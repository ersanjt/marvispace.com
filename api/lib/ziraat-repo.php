<?php
declare(strict_types=1);

require_once __DIR__ . '/settings-repo.php';
require_once __DIR__ . '/ziraat-client.php';

function ziraat_store_key(PDO $pdo): string
{
    $fromDb = trim(setting_get($pdo, 'ziraat_store_key', ''));
    if ($fromDb !== '') {
        return $fromDb;
    }
    return ziraat_merchant_password();
}

/** @return array<string, mixed> */
function ziraat_settings(PDO $pdo): array
{
    $configId = ziraat_merchant_id_raw();
    $merchantId = setting_get($pdo, 'ziraat_merchant_id', $configId);
    if ($merchantId === '' && $configId !== '') {
        $merchantId = $configId;
    }

    $storeKey = ziraat_store_key($pdo);

    return [
        'enabled' => setting_get($pdo, 'ziraat_enabled', '0') === '1',
        'mode' => setting_get($pdo, 'ziraat_mode', 'live') === 'test' ? 'test' : 'live',
        'merchantId' => $merchantId,
        'instalment' => setting_get($pdo, 'ziraat_instalment', '0') === '1',
        'currency' => strtoupper(setting_get($pdo, 'store_currency', 'USD')),
        'panelUrl' => setting_get($pdo, 'ziraat_panel_url', 'https://sanalpos2.ziraatbank.com.tr'),
        'panelUser' => setting_get($pdo, 'ziraat_panel_user', 'marvisadmin'),
        'securityCode' => setting_get($pdo, 'ziraat_security_code', 'OTLN'),
        'supportPhone' => setting_get($pdo, 'ziraat_support_phone', '0212 319 06 19'),
        'storeKey' => $storeKey,
        'passwordConfigured' => $storeKey !== '',
    ];
}

function ziraat_is_ready(PDO $pdo): bool
{
    $s = ziraat_settings($pdo);
    return $s['enabled']
        && $s['passwordConfigured']
        && trim((string) $s['merchantId']) !== '';
}

/** @param array<string, mixed> $input */
function ziraat_settings_save(PDO $pdo, array $input): array
{
    if (array_key_exists('enabled', $input)) {
        setting_set($pdo, 'ziraat_enabled', !empty($input['enabled']) ? '1' : '0');
    }
    if (array_key_exists('mode', $input)) {
        $mode = ($input['mode'] ?? '') === 'test' ? 'test' : 'live';
        setting_set($pdo, 'ziraat_mode', $mode);
    }
    if (array_key_exists('merchantId', $input)) {
        $id = preg_replace('/\D+/', '', trim((string) $input['merchantId'])) ?? '';
        setting_set($pdo, 'ziraat_merchant_id', $id);
    }
    if (array_key_exists('panelUrl', $input)) {
        setting_set($pdo, 'ziraat_panel_url', trim((string) $input['panelUrl']));
    }
    if (array_key_exists('panelUser', $input)) {
        setting_set($pdo, 'ziraat_panel_user', trim((string) $input['panelUser']));
    }
    if (array_key_exists('securityCode', $input)) {
        setting_set($pdo, 'ziraat_security_code', trim((string) $input['securityCode']));
    }
    if (array_key_exists('supportPhone', $input)) {
        setting_set($pdo, 'ziraat_support_phone', trim((string) $input['supportPhone']));
    }
    if (array_key_exists('storeKey', $input)) {
        $key = trim((string) $input['storeKey']);
        if ($key !== '') {
            setting_set($pdo, 'ziraat_store_key', $key);
        }
    }
    if (array_key_exists('instalment', $input)) {
        setting_set($pdo, 'ziraat_instalment', !empty($input['instalment']) ? '1' : '0');
    }
    if (array_key_exists('currency', $input)) {
        $currency = strtoupper(trim((string) $input['currency']));
        if (preg_match('/^[A-Z]{3}$/', $currency)) {
            setting_set($pdo, 'store_currency', $currency);
        }
    }

    return ziraat_settings_admin($pdo);
}

/** @return array<string, mixed> */
function ziraat_settings_admin(PDO $pdo): array
{
    $ziraat = ziraat_settings($pdo);
    return [
        'ziraat' => [
            'enabled' => $ziraat['enabled'],
            'mode' => $ziraat['mode'],
            'merchantId' => $ziraat['merchantId'],
            'instalment' => $ziraat['instalment'],
            'currency' => $ziraat['currency'],
            'panelUrl' => $ziraat['panelUrl'],
            'panelUser' => $ziraat['panelUser'],
            'securityCode' => $ziraat['securityCode'],
            'supportPhone' => $ziraat['supportPhone'],
            'storeKeySet' => $ziraat['passwordConfigured'],
            'passwordConfigured' => $ziraat['passwordConfigured'],
            'ready' => ziraat_is_ready($pdo),
        ],
    ];
}

function ziraat_callback_url(): string
{
    $config = app_load_config();
    $base = rtrim((string) ($config['site']['url'] ?? ''), '/');
    if ($base === '') {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $base = $scheme . '://' . $host;
    }
    return $base . '/api/v1/payments/ziraat/callback';
}

function ziraat_payment_log(PDO $pdo, string $orderId, string $step, string $status, ?array $request, ?array $response): void
{
    static $tableExists = null;
    if ($tableExists === null) {
        try {
            $pdo->query('SELECT 1 FROM payment_transactions LIMIT 1');
            $tableExists = true;
        } catch (Throwable $e) {
            $tableExists = false;
        }
    }
    if (!$tableExists) {
        return;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO payment_transactions (order_id, gateway, step, status, request_json, response_json)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $orderId,
        'ziraat',
        $step,
        $status,
        $request ? json_encode($request, JSON_UNESCAPED_UNICODE) : null,
        $response ? json_encode($response, JSON_UNESCAPED_UNICODE) : null,
    ]);
}
