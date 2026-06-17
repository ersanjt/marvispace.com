<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/bootstrap.php';
require_once dirname(__DIR__) . '/lib/cart-repo.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$sessionId = cart_session_id();

if ($method === 'GET') {
    json_ok(['items' => cart_list($pdo, $sessionId)]);
}

if ($method === 'PUT' || $method === 'POST') {
    $body = read_json_body();
    $items = $body['items'] ?? [];
    if (!is_array($items)) {
        json_error('Invalid cart payload', 400);
    }

    $saved = cart_replace($pdo, $sessionId, $items);
    json_ok(['items' => $saved]);
}

if ($method === 'DELETE') {
    cart_clear($pdo, $sessionId);
    json_ok(['items' => []]);
}

json_error('Method not allowed', 405);
