<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/cache-headers.php';
send_no_cache_headers();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once dirname(__DIR__) . '/lib/config.php';
require_once dirname(__DIR__) . '/lib/db.php';
require_once dirname(__DIR__) . '/lib/response.php';

$config = app_load_config();

if (!$config || empty($config['db'])) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'API not configured']);
    exit;
}

try {
    $pdo = db_connect($config['db']);
} catch (Throwable $e) {
    json_ok([
        'database' => false,
        'version' => '2',
        'error' => 'Database connection failed',
        'hint' => 'Run php install/doctor.php on the server',
        'config' => basename((string) app_config_source()),
    ]);
}

$requiredTables = ['products', 'orders', 'order_items', 'admin_users'];
$optionalTables = ['site_settings', 'login_attempts', 'schema_migrations', 'cart_sessions', 'cart_items'];

$checks = [];
$counts = [];

foreach (array_merge($requiredTables, $optionalTables) as $table) {
    try {
        $pdo->query("SELECT 1 FROM {$table} LIMIT 1");
        $checks[$table] = true;
        $counts[$table] = (int) $pdo->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();
    } catch (Throwable $e) {
        $checks[$table] = false;
        $counts[$table] = 0;
    }
}

$schemaVersion = null;
try {
    $versions = $pdo->query('SELECT version FROM schema_migrations ORDER BY version')->fetchAll(PDO::FETCH_COLUMN);
    $schemaVersion = $versions ? end($versions) : null;
} catch (Throwable $e) {
    /* not migrated yet */
}

$databaseOk = $checks['products'] && $checks['orders'] && $checks['admin_users'];

json_ok([
    'database' => $databaseOk,
    'version' => '2',
    'schema' => $schemaVersion,
    'tables' => $checks,
    'counts' => $counts,
    'config' => basename((string) app_config_source()),
]);
