<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/lib/bootstrap.php';
require_once dirname(__DIR__) . '/lib/settings-repo.php';
require_once dirname(__DIR__) . '/lib/paynet-repo.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET') {
    json_error('Method not allowed', 405);
}

json_ok(array_merge(
    ['favicon' => favicon_public($pdo)],
    ['whatsapp' => whatsapp_public_get($pdo)],
    payment_public_settings($pdo)
));
