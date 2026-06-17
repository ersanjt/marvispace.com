<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

admin_require($pdo);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$id = trim((string) ($_GET['id'] ?? ''));

if ($method === 'GET') {
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
    $body = read_json_body();
    $product = products_normalize_input($body['product'] ?? $body);
    if ($product['id'] === '' || $product['label'] === '') {
        json_error('Product id and label required', 400);
    }
    json_ok(product_save($pdo, $product), 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    if ($id === '') {
        json_error('Product id required', 400);
    }
    $body = read_json_body();
    $product = products_normalize_input(array_merge($body['product'] ?? $body, ['id' => $id]));
    json_ok(product_save($pdo, $product));
}

if ($method === 'DELETE') {
    if ($id === '') {
        json_error('Product id required', 400);
    }
    if (!product_delete($pdo, $id)) {
        json_error('Product not found', 404);
    }
    json_ok(['deleted' => true]);
}

json_error('Method not allowed', 405);
