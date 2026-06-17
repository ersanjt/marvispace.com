<?php
/**
 * MARVISPACE API bootstrap
 * @author Ersan JT <https://github.com/ersanjt>
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin && parse_url($origin, PHP_URL_HOST) === $host) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

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
    echo json_encode(['ok' => false, 'error' => 'API not configured. Run install/setup-server.sh on the server.']);
    exit;
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/products-repo.php';
require_once __DIR__ . '/orders-repo.php';

$pdo = db_connect($config['db']);

function app_config(): array
{
    global $config;
    return $config;
}
