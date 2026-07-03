<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once dirname(__DIR__, 2) . '/lib/admin-permissions.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$id = trim((string) ($_GET['id'] ?? ''));

if ($method === 'GET') {
    $admin = admin_require($pdo);
    if (!admin_has_any_permission($admin, ['products', 'dashboard'])) {
        json_error('You do not have access to this section', 403);
    }
    if ($id !== '') {
        $product = product_get($pdo, $id);
        if (!$product) {
            json_error('Product not found', 404);
        }
        json_ok($product);
    }
    json_ok(products_list($pdo));
}

if ($method === 'POST') {
    admin_require_permission($pdo, 'products');
    $body = read_json_body();
    $product = products_normalize_input($body['product'] ?? $body);
    if ($product['id'] === '' || $product['label'] === '') {
        json_error('Product id and label required', 400);
    }
    json_ok(product_save($pdo, $product), 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    admin_require_permission($pdo, 'products');
    if ($id === '') {
        json_error('Product id required', 400);
    }
    $body = read_json_body();
    $product = products_normalize_input(array_merge($body['product'] ?? $body, ['id' => $id]));
    json_ok(product_save($pdo, $product));
}

if ($method === 'DELETE') {
    admin_require_permission($pdo, 'products');
    if ($id === '') {
        json_error('Product id required', 400);
    }
    if (!product_delete($pdo, $id)) {
        json_error('Product not found', 404);
    }
    json_ok(['deleted' => true]);
}

json_error('Method not allowed', 405);
