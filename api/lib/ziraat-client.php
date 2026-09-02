<?php
declare(strict_types=1);

/**
 * Ziraat Bank 3D Pay (INNOVA V4) — hash + request helpers.
 * @see https://sanalpos.innova.com.tr/ziraatbankasi/Dosyalar/3DPay_Entegrasyon_Dokumani.pdf
 */

function ziraat_api_url(string $mode): string
{
    $config = app_load_config();
    $ziraat = $config['ziraat'] ?? [];

    if ($mode === 'live') {
        $override = trim((string) ($ziraat['api_url'] ?? ''));
        return $override !== ''
            ? $override
            : 'https://sanalpos.ziraatbank.com.tr/v4/v3/VposThreeDPay.aspx';
    }

    $override = trim((string) ($ziraat['test_api_url'] ?? ''));
    return $override !== ''
        ? $override
        : 'https://sanalpos.innova.com.tr/ZIRAATBANK/VposWeb/v3/VposThreeDPay.aspx';
}

function ziraat_merchant_password(): string
{
    $config = app_load_config();
    return trim((string) ($config['ziraat']['merchant_password'] ?? ''));
}

function ziraat_merchant_id_raw(): string
{
    $config = app_load_config();
    return trim((string) ($config['ziraat']['merchant_id'] ?? ''));
}

function ziraat_format_merchant_id(string $merchantId): string
{
    $digits = preg_replace('/\D+/', '', $merchantId) ?? '';
    if ($digits === '') {
        return '';
    }
    return str_pad($digits, 15, '0', STR_PAD_LEFT);
}

function ziraat_generate_rnd(): string
{
    return bin2hex(random_bytes(16));
}

function ziraat_hash_sha512(string $plain): string
{
    return base64_encode(hash('sha512', $plain, true));
}

function ziraat_request_hash(
    string $merchantId,
    string $orderId,
    string $currencyCode,
    float $amount,
    string $okUrl,
    string $failUrl,
    string $rnd,
    string $merchantPassword
): string {
    $kurus = (string) (int) round($amount * 100);
    $plain = $merchantId . $orderId . $currencyCode . $kurus . $okUrl . $failUrl . $rnd . $merchantPassword;
    return ziraat_hash_sha512($plain);
}

function ziraat_verify_response_hash(array $post, string $merchantPassword): bool
{
    $hash = (string) ($post['hash'] ?? $post['Hash'] ?? '');
    $hashItems = (string) ($post['hashItems'] ?? $post['HashItems'] ?? '');

    if ($hash === '' || $hashItems === '' || $merchantPassword === '') {
        return false;
    }

    $expected = ziraat_hash_sha512($hashItems . $merchantPassword);
    return hash_equals($expected, $hash);
}

function ziraat_currency_code(string $currency): string
{
    $map = [
        'TRY' => '949',
        'USD' => '840',
        'EUR' => '978',
    ];
    $code = strtoupper($currency);
    return $map[$code] ?? '949';
}

function ziraat_client_ip(): string
{
    $candidates = [
        $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '',
        $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
        $_SERVER['REMOTE_ADDR'] ?? '',
    ];

    foreach ($candidates as $value) {
        if ($value === '') {
            continue;
        }
        $ip = trim(explode(',', $value)[0]);
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return $ip;
        }
    }

    return '127.0.0.1';
}

function ziraat_format_expiry(int $month, int $year): string
{
    if ($year < 100) {
        $year += 2000;
    }
    return sprintf('%04d%02d', $year, $month);
}

/** @return array<string, string> */
function ziraat_build_payment_fields(array $settings, array $params): array
{
    $merchantPassword = trim((string) ($settings['storeKey'] ?? ''));
    if ($merchantPassword === '') {
        $merchantPassword = ziraat_merchant_password();
    }
    if ($merchantPassword === '') {
        throw new RuntimeException('Ziraat merchant password (store key) is not configured on the server');
    }

    $merchantId = ziraat_format_merchant_id((string) ($settings['merchantId'] ?? ''));
    if ($merchantId === '') {
        throw new RuntimeException('Ziraat merchant ID is not configured');
    }

    $orderId = (string) ($params['order_id'] ?? '');
    $amount = (float) ($params['amount'] ?? 0);
    if ($orderId === '' || $amount <= 0) {
        throw new InvalidArgumentException('Invalid Ziraat payment parameters');
    }

    $currency = (string) ($settings['currency'] ?? 'USD');
    $currencyCode = ziraat_currency_code($currency);
    $okUrl = (string) ($params['ok_url'] ?? '');
    $failUrl = (string) ($params['fail_url'] ?? '');
    $rnd = ziraat_generate_rnd();

    $hashData = ziraat_request_hash(
        $merchantId,
        $orderId,
        $currencyCode,
        $amount,
        $okUrl,
        $failUrl,
        $rnd,
        $merchantPassword
    );

    $pan = preg_replace('/\D+/', '', (string) ($params['pan'] ?? '')) ?? '';
    $cvc = trim((string) ($params['cvc'] ?? ''));
    $holder = trim((string) ($params['holder'] ?? ''));
    $month = (int) ($params['month'] ?? 0);
    $year = (int) ($params['year'] ?? 0);

    if ($pan === '' || $cvc === '' || $holder === '' || $month < 1 || $month > 12 || $year < 1) {
        throw new InvalidArgumentException('Complete card details are required');
    }

    $fields = [
        'MerchantId' => $merchantId,
        'OrderId' => $orderId,
        'StoreType' => '3d_pay',
        'TransactionType' => 'Sale',
        'CurrencyAmount' => number_format($amount, 2, '.', ''),
        'CurrencyCode' => $currencyCode,
        'Pan' => $pan,
        'Cvv' => $cvc,
        'Expiry' => ziraat_format_expiry($month, $year),
        'CardHoldersName' => $holder,
        'ClientIp' => ziraat_client_ip(),
        'okUrl' => $okUrl,
        'failUrl' => $failUrl,
        'Rnd' => $rnd,
        'HashData' => $hashData,
        'TransactionDeviceSource' => '0',
        'CallbackType' => 'POST',
        'OrderDescription' => (string) ($params['description'] ?? 'MARVISPACE order'),
    ];

    if (!empty($settings['instalment']) && !empty($params['installments'])) {
        $fields['NumberOfInstallments'] = (string) (int) $params['installments'];
    }

    return $fields;
}

function ziraat_is_success_response(array $post): bool
{
    $code = (string) ($post['ProcReturnCode'] ?? $post['procreturncode'] ?? '');
    $response = strtoupper((string) ($post['Response'] ?? $post['response'] ?? ''));
    $mdStatus = (string) ($post['MdStatus'] ?? $post['mdStatus'] ?? '');

    if ($response === 'APPROVED' && ($code === '00' || $code === '0000')) {
        return true;
    }

    if ($mdStatus === '1' && ($code === '00' || $code === '0000')) {
        return true;
    }

    return false;
}

function ziraat_redact_fields(array $fields): array
{
    $safe = $fields;
    foreach (['Pan', 'Cvv', 'CardHoldersName'] as $key) {
        if (isset($safe[$key])) {
            $safe[$key] = '[redacted]';
        }
    }
    return $safe;
}
