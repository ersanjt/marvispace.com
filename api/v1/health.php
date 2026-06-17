<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$configPaths = [
    '/home/marvispace/api_config.php',
    dirname(__DIR__, 2) . '/api/config.local.php',
];

$config = null;
foreach ($configPaths as $path) {
    if (is_file($path)) {
        $config = require $path;
        break;
    }
}

if (!$config || empty($config['db'])) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'API not configured']);
    exit;
}

require_once dirname(__DIR__) . '/lib/db.php';
require_once dirname(__DIR__) . '/lib/response.php';

try {
    $pdo = db_connect($config['db']);
} catch (Throwable $e) {
    json_ok([
        'database' => false,
        'version' => '2',
        'error' => 'Database connection failed',
        'hint' => 'Run php install/doctor.php on the server',
    ]);
}

$requiredTables = ['products', 'orders', 'order_items', 'admin_users'];
$optionalTables = ['site_settings', 'login_attempts', 'schema_migrations'];

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
]);
