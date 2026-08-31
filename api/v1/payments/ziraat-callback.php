<?php
declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/lib/cache-headers.php';
send_no_cache_headers();

require_once dirname(__DIR__, 3) . '/lib/config.php';
require_once dirname(__DIR__, 3) . '/lib/db.php';
require_once dirname(__DIR__, 3) . '/lib/orders-repo.php';
require_once dirname(__DIR__, 3) . '/lib/order-customer.php';
require_once dirname(__DIR__, 3) . '/lib/cart-repo.php';
require_once dirname(__DIR__, 3) . '/lib/ziraat-client.php';
require_once dirname(__DIR__, 3) . '/lib/ziraat-repo.php';

$config = app_load_config();
if (!$config || empty($config['db'])) {
    http_response_code(503);
    echo 'Payment service unavailable';
    exit;
}

try {
    $pdo = db_connect($config['db']);
} catch (Throwable $e) {
    http_response_code(503);
    echo 'Database unavailable';
    exit;
}

$siteUrl = rtrim((string) ($config['site']['url'] ?? ''), '/');
if ($siteUrl === '') {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $siteUrl = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

function ziraat_redirect(string $url): void
{
    header('Location: ' . $url, true, 302);
    exit;
}

$post = $_POST;
if (!$post) {
    ziraat_redirect($siteUrl . '/checkout?payment=failed');
}

$orderId = trim((string) ($post['Oid'] ?? $post['OrderId'] ?? $post['oid'] ?? ''));
if ($orderId === '') {
    ziraat_redirect($siteUrl . '/checkout?payment=failed');
}

$order = order_get($pdo, $orderId);
if (!$order) {
    ziraat_redirect($siteUrl . '/checkout?payment=failed');
}

$merchantPassword = ziraat_store_key($pdo);

$hashOk = ziraat_verify_response_hash($post, $merchantPassword);
ziraat_payment_log(
    $pdo,
    $orderId,
    'callback',
    $hashOk && ziraat_is_success_response($post) ? 'ok' : 'error',
    null,
    array_diff_key($post, array_flip(['Pan', 'Cvv', 'pan', 'cvv']))
);

if (!$hashOk) {
    order_fail_payment($pdo, $orderId, 'Payment response verification failed');
    ziraat_redirect($siteUrl . '/checkout?payment=failed&order=' . urlencode($orderId));
}

if (!ziraat_is_success_response($post)) {
    $message = (string) ($post['ResultMessage'] ?? $post['ErrMsg'] ?? 'Payment declined');
    order_fail_payment($pdo, $orderId, $message);
    ziraat_redirect($siteUrl . '/checkout?payment=failed&order=' . urlencode($orderId));
}

try {
    $gateway = [
        'transaction_id' => (string) ($post['TransId'] ?? $post['HostRefNum'] ?? ''),
        'auth_code' => (string) ($post['AuthCode'] ?? ''),
        'session_id' => (string) ($post['Rnd'] ?? ''),
    ];
    $finalized = order_finalize_payment($pdo, $orderId, $gateway, 'ziraat');
    if (!$finalized) {
        throw new RuntimeException('Order not found after payment');
    }

    try {
        require_once dirname(__DIR__, 3) . '/lib/order-mail.php';
        $mailResult = order_send_purchase_emails($pdo, $finalized);
        if (!$mailResult['customer'] || !$mailResult['admin']) {
            error_log('MARVISPACE ziraat mail partial failure for ' . $orderId);
        }
    } catch (Throwable $mailErr) {
        error_log('MARVISPACE ziraat mail: ' . $mailErr->getMessage());
    }

    try {
        if (!empty($_COOKIE[CART_COOKIE])) {
            cart_clear($pdo, (string) $_COOKIE[CART_COOKIE]);
        }
    } catch (Throwable $cartErr) {
        error_log('MARVISPACE ziraat cart clear: ' . $cartErr->getMessage());
    }
} catch (Throwable $e) {
    order_fail_payment($pdo, $orderId, $e->getMessage());
    ziraat_redirect($siteUrl . '/checkout?payment=failed&order=' . urlencode($orderId));
}

ziraat_redirect(
    $siteUrl . '/order-confirmation?id=' . urlencode($orderId)
        . '&t=' . urlencode(order_confirm_token($orderId))
        . '&paid=1'
);
