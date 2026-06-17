<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/lib/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $id = $_GET['id'] ?? '';
    if ($id !== '') {
        $product = product_get($pdo, $id);
        if (!$product) {
            json_error('Product not found', 404);
        }
        json_ok($product);
    }
    json_ok(products_list($pdo));
}

json_error('Method not allowed', 405);
