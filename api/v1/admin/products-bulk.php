<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once dirname(__DIR__, 2) . '/lib/admin-permissions.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    json_error('Method not allowed', 405);
}

admin_require_permission($pdo, 'products');

$body = read_json_body();
$ids = $body['ids'] ?? [];
if (!is_array($ids) || !$ids) {
    json_error('Select at least one product', 400);
}

$patch = [];
if (!empty($body['price']) && is_array($body['price'])) {
    $patch['price'] = [
        'mode' => (string) ($body['price']['mode'] ?? ''),
        'value' => (float) ($body['price']['value'] ?? 0),
    ];
}
if (!empty($body['stock']) && is_array($body['stock'])) {
    $patch['stock'] = [
        'mode' => (string) ($body['stock']['mode'] ?? ''),
        'value' => (int) ($body['stock']['value'] ?? 0),
    ];
}
if (array_key_exists('category', $body)) {
    $patch['category'] = (string) $body['category'];
}
if (array_key_exists('gender', $body)) {
    $patch['gender'] = (string) $body['gender'];
}
if (array_key_exists('inStock', $body)) {
    $patch['inStock'] = !empty($body['inStock']);
}
if (array_key_exists('discountPercent', $body)) {
    $patch['discountPercent'] = (int) $body['discountPercent'];
}

if (!$patch) {
    json_error('Choose at least one change to apply', 400);
}

$result = products_bulk_update($pdo, $ids, $patch);
json_ok($result);
