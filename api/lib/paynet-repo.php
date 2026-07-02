<?php
declare(strict_types=1);

require_once __DIR__ . '/settings-repo.php';
require_once __DIR__ . '/paynet-client.php';

/** @return array<string, mixed> */
function paynet_settings(PDO $pdo): array
{
    $secret = paynet_secret_key();
    $publishable = setting_get($pdo, 'paynet_publishable_key', '');
    $configPub = trim((string) (app_load_config()['paynet']['publishable_key'] ?? ''));
    if ($publishable === '' && $configPub !== '') {
        $publishable = $configPub;
    }

    return [
        'enabled' => setting_get($pdo, 'paynet_enabled', '0') === '1',
        'mode' => setting_get($pdo, 'paynet_mode', 'sandbox') === 'live' ? 'live' : 'sandbox',
        'domain' => setting_get($pdo, 'paynet_domain', 'marvispace.com'),
        'publishableKey' => $publishable,
        'instalment' => setting_get($pdo, 'paynet_instalment', '0') === '1',
        'currency' => strtoupper(setting_get($pdo, 'store_currency', 'TRY')),
        'secretConfigured' => $secret !== '',
    ];
}

function paynet_is_ready(PDO $pdo): bool
{
    $s = paynet_settings($pdo);
    return $s['enabled'] && $s['secretConfigured'];
}

/** @return array<string, mixed> */
function payment_public_settings(PDO $pdo): array
{
    $paynet = paynet_settings($pdo);
    return [
        'currency' => $paynet['currency'],
        'paynet' => [
            'enabled' => paynet_is_ready($pdo),
            'mode' => $paynet['mode'],
            'publishableKey' => $paynet['publishableKey'],
            'instalment' => $paynet['instalment'],
            'domain' => $paynet['domain'],
        ],
    ];
}

/** @param array<string, string> $input */
function paynet_settings_save(PDO $pdo, array $input): array
{
    if (array_key_exists('enabled', $input)) {
        setting_set($pdo, 'paynet_enabled', !empty($input['enabled']) ? '1' : '0');
    }
    if (array_key_exists('mode', $input)) {
        $mode = ($input['mode'] ?? '') === 'live' ? 'live' : 'sandbox';
        setting_set($pdo, 'paynet_mode', $mode);
    }
    if (array_key_exists('domain', $input)) {
        $domain = trim((string) $input['domain']);
        if ($domain !== '') {
            setting_set($pdo, 'paynet_domain', $domain);
        }
    }
    if (array_key_exists('publishableKey', $input)) {
        setting_set($pdo, 'paynet_publishable_key', trim((string) $input['publishableKey']));
    }
    if (array_key_exists('instalment', $input)) {
        setting_set($pdo, 'paynet_instalment', !empty($input['instalment']) ? '1' : '0');
    }
    if (array_key_exists('currency', $input)) {
        $currency = strtoupper(trim((string) $input['currency']));
        if (preg_match('/^[A-Z]{3}$/', $currency)) {
            setting_set($pdo, 'store_currency', $currency);
        }
    }

    return paynet_settings_admin($pdo);
}

/** @return array<string, mixed> */
function paynet_settings_admin(PDO $pdo): array
{
    $paynet = paynet_settings($pdo);
    return [
        'paynet' => [
            'enabled' => $paynet['enabled'],
            'mode' => $paynet['mode'],
            'domain' => $paynet['domain'],
            'publishableKey' => $paynet['publishableKey'],
            'instalment' => $paynet['instalment'],
            'currency' => $paynet['currency'],
            'secretConfigured' => $paynet['secretConfigured'],
            'ready' => paynet_is_ready($pdo),
        ],
        'store' => [
            'name' => setting_get($pdo, 'store_name', 'MARVISPACE'),
            'currency' => $paynet['currency'],
        ],
    ];
}

function payment_log(PDO $pdo, string $orderId, string $step, string $status, ?array $request, ?array $response): void
{
    if (!payment_transactions_table_exists($pdo)) {
        return;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO payment_transactions (order_id, gateway, step, status, request_json, response_json)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $orderId,
        'paynet',
        $step,
        $status,
        $request ? json_encode($request, JSON_UNESCAPED_UNICODE) : null,
        $response ? json_encode($response, JSON_UNESCAPED_UNICODE) : null,
    ]);
}

function payment_transactions_table_exists(PDO $pdo): bool
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }
    try {
        $pdo->query('SELECT 1 FROM payment_transactions LIMIT 1');
        $cache = true;
    } catch (Throwable $e) {
        $cache = false;
    }
    return $cache;
}

function paynet_callback_url(): string
{
    $config = app_load_config();
    $base = rtrim((string) ($config['site']['url'] ?? ''), '/');
    if ($base === '') {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $base = $scheme . '://' . $host;
    }
    return $base . '/api/v1/payments/paynet/callback';
}
