<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once dirname(__DIR__, 2) . '/lib/admin-permissions.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$id = trim((string) ($_GET['id'] ?? ''));

if ($method === 'GET') {
    $admin = admin_require($pdo);
    if (!admin_has_any_permission($admin, ['orders', 'dashboard'])) {
        json_error('You do not have access to this section', 403);
    }
    json_ok(orders_list($pdo));
}

if ($method === 'PATCH' || $method === 'PUT') {
    admin_require_permission($pdo, 'orders');
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
