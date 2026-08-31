<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once dirname(__DIR__, 2) . '/lib/paynet-client.php';
require_once dirname(__DIR__, 2) . '/lib/paynet-repo.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    json_error('Method not allowed', 405);
}

if (!paynet_is_ready($pdo)) {
    json_error('Paynet payment is not enabled', 503);
}

$body = read_json_body();
$orderInput = $body['order'] ?? [];
$card = $body['card'] ?? [];

try {
    order_validate_customer($orderInput['customer'] ?? []);
} catch (InvalidArgumentException $e) {
    json_error($e->getMessage(), 400);
}

if (empty($orderInput['items']) || !is_array($orderInput['items'])) {
    json_error('Cart is empty', 400);
}

$payment = trim((string) ($orderInput['customer']['payment'] ?? ''));
if ($payment !== 'card') {
    json_error('Paynet only supports card payments', 400);
}

$holder = trim((string) ($card['holder'] ?? ''));
$pan = preg_replace('/\D+/', '', (string) ($card['pan'] ?? ''));
$month = (int) ($card['month'] ?? 0);
$year = (int) ($card['year'] ?? 0);
$cvc = trim((string) ($card['cvc'] ?? ''));

if ($holder === '' || strlen($pan) < 12 || $month < 1 || $month > 12 || $year < 1 || strlen($cvc) < 3) {
    json_error('Complete card details are required', 400);
}

if ($year < 100) {
    $year += 2000;
}

$orderInput['id'] = order_new_id();

$orderInput['paymentGateway'] = 'paynet';
$settings = paynet_settings($pdo);
$customer = order_customer_from_input($orderInput['customer'] ?? []);

try {
    $pending = order_create_pending($pdo, $orderInput);
} catch (Throwable $e) {
    json_error($e->getMessage(), $e instanceof InvalidArgumentException ? 400 : 409);
}

$initParams = [
    'amount' => (float) ($pending['total'] ?? 0),
    'reference_no' => (string) $pending['id'],
    'return_url' => paynet_callback_url(),
    'domain' => $settings['domain'],
    'card_holder' => $holder,
    'pan' => $pan,
    'month' => $month,
    'year' => $year,
    'cvc' => $cvc,
    'email' => $customer['email'],
    'phone' => $customer['phone'],
    'description' => 'MARVISPACE ' . $pending['id'],
];

try {
    $response = paynet_tds_initial($settings, $initParams);
    payment_log(
        $pdo,
        (string) $pending['id'],
        'tds_initial',
        paynet_is_success($response) ? 'ok' : 'error',
        paynet_redact_for_log($initParams),
        $response
    );
} catch (Throwable $e) {
    order_fail_payment($pdo, (string) $pending['id'], $e->getMessage());
    json_error($e->getMessage(), 502);
}

if (!paynet_is_success($response)) {
    $message = (string) ($response['message'] ?? 'Paynet initialization failed');
    order_fail_payment($pdo, (string) $pending['id'], $message);
    json_error($message, 402);
}

$sessionId = (string) ($response['session_id'] ?? '');
$tokenId = (string) ($response['token_id'] ?? '');
if ($sessionId === '' || $tokenId === '') {
    order_fail_payment($pdo, (string) $pending['id'], 'Invalid Paynet session');
    json_error('Invalid Paynet session response', 502);
}

order_update_gateway_session($pdo, (string) $pending['id'], $sessionId, $tokenId);

json_ok([
    'orderId' => $pending['id'],
    'email' => $customer['email'],
    'sessionId' => $sessionId,
    'htmlContent' => (string) ($response['html_content'] ?? ''),
    'postUrl' => (string) ($response['post_url'] ?? ''),
], 201);
