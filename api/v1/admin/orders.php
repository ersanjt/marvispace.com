<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

admin_require($pdo);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$id = trim((string) ($_GET['id'] ?? ''));

if ($method === 'GET') {
    json_ok(orders_list($pdo));
}

if ($method === 'PATCH' || $method === 'PUT') {
    if ($id === '') {
        json_error('Order id required', 400);
    }
    $body = read_json_body();
    $status = (string) ($body['status'] ?? '');
    $order = order_update_status($pdo, $id, $status);
    if (!$order) {
        json_error('Order not found or invalid status', 404);
    }
    json_ok($order);
}

json_error('Method not allowed', 405);
