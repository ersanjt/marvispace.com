<?php
declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/lib/cache-headers.php';
send_no_cache_headers();

require_once dirname(__DIR__, 3) . '/lib/config.php';
require_once dirname(__DIR__, 3) . '/lib/db.php';
require_once dirname(__DIR__, 3) . '/lib/orders-repo.php';
require_once dirname(__DIR__, 3) . '/lib/order-customer.php';
require_once dirname(__DIR__, 3) . '/lib/cart-repo.php';
require_once dirname(__DIR__, 3) . '/lib/paynet-client.php';
require_once dirname(__DIR__, 3) . '/lib/paynet-repo.php';

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

$sessionId = trim((string) ($_REQUEST['session_id'] ?? ''));
$tokenId = trim((string) ($_REQUEST['token_id'] ?? ''));
$referenceNo = trim((string) ($_REQUEST['reference_no'] ?? ''));

$siteUrl = rtrim((string) ($config['site']['url'] ?? ''), '/');
if ($siteUrl === '') {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $siteUrl = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

function paynet_redirect(string $url): void
{
    header('Location: ' . $url, true, 302);
    exit;
}

if ($sessionId === '' || $tokenId === '') {
    paynet_redirect($siteUrl . '/checkout?payment=failed');
}

$order = order_get_by_gateway_session($pdo, $sessionId);
if (!$order) {
    paynet_redirect($siteUrl . '/checkout?payment=failed');
}
if ($referenceNo !== '' && $referenceNo !== (string) $order['id']) {
    paynet_redirect($siteUrl . '/checkout?payment=failed');
}

$orderId = (string) $order['id'];

try {
    $charge = paynet_tds_charge($sessionId, $tokenId, paynet_settings($pdo)['mode'] ?? 'sandbox');
    payment_log(
        $pdo,
        $orderId,
        'tds_charge',
        paynet_is_success($charge) ? 'ok' : 'error',
        ['session_id' => $sessionId, 'token_id' => '[redacted]'],
        $charge
    );
} catch (Throwable $e) {
    order_fail_payment($pdo, $orderId, $e->getMessage());
    paynet_redirect($siteUrl . '/checkout?payment=failed&order=' . urlencode($orderId));
}

if (!paynet_is_success($charge)) {
    $message = (string) ($charge['message'] ?? 'Payment declined');
    order_fail_payment($pdo, $orderId, $message);
    paynet_redirect($siteUrl . '/checkout?payment=failed&order=' . urlencode($orderId));
}

try {
    $charge['session_id'] = $sessionId;
    $charge['token_id'] = $tokenId;
    $finalized = order_finalize_payment($pdo, $orderId, $charge);
    if (!$finalized) {
        throw new RuntimeException('Order not found after payment');
    }

    try {
        require_once dirname(__DIR__, 3) . '/lib/order-mail.php';
        $mailResult = order_send_purchase_emails($pdo, $finalized);
        if (!$mailResult['customer'] || !$mailResult['admin']) {
            error_log('MARVISPACE paynet mail partial failure for ' . $orderId);
        }
    } catch (Throwable $mailErr) {
        error_log('MARVISPACE paynet mail: ' . $mailErr->getMessage());
    }

    try {
        if (!empty($_COOKIE[CART_COOKIE])) {
            cart_clear($pdo, (string) $_COOKIE[CART_COOKIE]);
        }
    } catch (Throwable $cartErr) {
        error_log('MARVISPACE paynet cart clear: ' . $cartErr->getMessage());
    }
} catch (Throwable $e) {
    order_fail_payment($pdo, $orderId, $e->getMessage());
    paynet_redirect($siteUrl . '/checkout?payment=failed&order=' . urlencode($orderId));
}

paynet_redirect(
    $siteUrl . '/order-confirmation?id=' . urlencode($orderId)
        . '&t=' . urlencode(order_confirm_token($orderId))
        . '&paid=1'
);
