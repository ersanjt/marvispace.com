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
    $pdo->query('SELECT 1');
} catch (Throwable $e) {
    json_ok([
        'database' => false,
    ]);
}

json_ok([
    'database' => true,
]);
