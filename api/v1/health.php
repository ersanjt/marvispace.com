<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/lib/bootstrap.php';

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
