<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/lib/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $id = trim((string) ($_GET['id'] ?? ''));
    $email = strtolower(trim((string) ($_GET['email'] ?? '')));

    if ($id === '') {
        json_error('Order id required', 400);
    }

    $order = order_get($pdo, $id);
    if (!$order) {
        json_error('Order not found', 404);
    }

    $orderEmail = strtolower((string) ($order['customer']['email'] ?? ''));
    if ($email !== '' && $orderEmail !== '' && $email !== $orderEmail) {
        json_error('Email does not match this order', 403);
    }

    json_ok($order);
}

if ($method === 'POST') {
    $body = read_json_body();
    $order = $body['order'] ?? $body;

    if (empty($order['items'])) {
        json_error('Invalid order payload', 400);
    }

    try {
        order_validate_customer($order['customer'] ?? []);
    } catch (InvalidArgumentException $e) {
        json_error($e->getMessage(), 400);
    }

    if (empty($order['id'])) {
        $order['id'] = 'ord_' . base_convert((string) (int) (microtime(true) * 1000), 10, 36);
    }

    try {
        $created = order_create($pdo, $order);
        try {
            require_once dirname(__DIR__) . '/lib/order-mail.php';
            order_send_purchase_emails($pdo, $created);
        } catch (Throwable $mailErr) {
            error_log('MARVISPACE order mail: ' . $mailErr->getMessage());
        }
        json_ok($created, 201);
    } catch (Throwable $e) {
        json_error($e->getMessage(), $e instanceof InvalidArgumentException ? 400 : 409);
    }
}

json_error('Method not allowed', 405);
