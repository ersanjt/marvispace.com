<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once dirname(__DIR__, 2) . '/lib/ziraat-repo.php';
require_once dirname(__DIR__, 2) . '/lib/orders-repo.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    json_error('Method not allowed', 405);
}

if (!ziraat_is_ready($pdo)) {
    json_error('Ziraat payment is not enabled', 503);
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
    json_error('Ziraat only supports card payments', 400);
}

if (empty($orderInput['id'])) {
    $orderInput['id'] = 'ord_' . base_convert((string) (int) (microtime(true) * 1000), 10, 36);
}

$orderInput['paymentGateway'] = 'ziraat';
$settings = ziraat_settings($pdo);

try {
    $pending = order_create_pending($pdo, $orderInput);
} catch (Throwable $e) {
    json_error($e->getMessage(), $e instanceof InvalidArgumentException ? 400 : 409);
}

$callbackUrl = ziraat_callback_url();
$params = [
    'order_id' => (string) $pending['id'],
    'amount' => (float) ($pending['total'] ?? 0),
    'ok_url' => $callbackUrl,
    'fail_url' => $callbackUrl,
    'pan' => (string) ($card['pan'] ?? ''),
    'cvc' => (string) ($card['cvc'] ?? ''),
    'holder' => (string) ($card['holder'] ?? ''),
    'month' => (int) ($card['month'] ?? 0),
    'year' => (int) ($card['year'] ?? 0),
    'description' => 'MARVISPACE ' . $pending['id'],
];

try {
    $fields = ziraat_build_payment_fields($settings, $params);
    ziraat_payment_log(
        $pdo,
        (string) $pending['id'],
        'initialize',
        'ok',
        ziraat_redact_fields($fields),
        null
    );
    order_update_gateway_session($pdo, (string) $pending['id'], $fields['Rnd'], '');
} catch (Throwable $e) {
    order_fail_payment($pdo, (string) $pending['id'], $e->getMessage());
    json_error($e->getMessage(), $e instanceof InvalidArgumentException ? 400 : 502);
}

$postUrl = ziraat_api_url($settings['mode']);

json_ok([
    'orderId' => $pending['id'],
    'email' => $pending['customer']['email'] ?? '',
    'postUrl' => $postUrl,
    'fields' => $fields,
], 201);
