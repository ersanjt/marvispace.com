<?php
declare(strict_types=1);

/**
 * iyzico Paynet REST client — 3D Secure flow.
 * @see https://doc.paynet.com.tr/english/api-integration/payment
 */
function paynet_api_base(string $mode): string
{
    return $mode === 'live'
        ? 'https://api.paynet.com.tr'
        : 'https://pts-api.paynet.com.tr';
}

function paynet_secret_key(): string
{
    $config = app_load_config();
    return trim((string) ($config['paynet']['secret_key'] ?? ''));
}

function paynet_format_amount(float $amount): string
{
    return str_replace('.', ',', number_format($amount, 2, '.', ''));
}

/** @return array<string, mixed> */
function paynet_json_request(string $url, array $payload, string $secretKey): array
{
    if ($secretKey === '') {
        throw new RuntimeException('Paynet secret key is not configured on the server');
    }

    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($body === false) {
        throw new RuntimeException('Could not encode Paynet request');
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json; charset=UTF-8',
                'Content-Type: application/json; charset=UTF-8',
                'Authorization: Basic ' . $secretKey,
            ],
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 45,
        ]);
        $raw = curl_exec($ch);
        $errno = curl_errno($ch);
        $error = curl_error($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false) {
            throw new RuntimeException('Paynet request failed: ' . ($error ?: 'curl error ' . $errno));
        }
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Accept: application/json; charset=UTF-8\r\n"
                    . "Content-Type: application/json; charset=UTF-8\r\n"
                    . 'Authorization: Basic ' . $secretKey . "\r\n",
                'content' => $body,
                'ignore_errors' => true,
                'timeout' => 45,
            ],
        ]);
        $raw = @file_get_contents($url, false, $context);
        $status = 0;
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
            $status = (int) $m[1];
        }
        if ($raw === false) {
            throw new RuntimeException('Paynet request failed');
        }
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid Paynet response (HTTP ' . $status . ')');
    }

    $decoded['_http_status'] = $status;
    return $decoded;
}

/** @return array<string, mixed> */
function paynet_tds_initial(array $settings, array $params): array
{
    $base = paynet_api_base((string) ($settings['mode'] ?? 'sandbox'));
    $url = $base . '/v2/transaction/tds_initial';

    $payload = [
        'amount' => paynet_format_amount((float) ($params['amount'] ?? 0)),
        'reference_no' => (string) ($params['reference_no'] ?? ''),
        'return_url' => (string) ($params['return_url'] ?? ''),
        'domain' => (string) ($params['domain'] ?? ''),
        'transaction_type' => 1,
        'instalment' => !empty($settings['instalment']) ? 1 : 0,
        'card_holder' => (string) ($params['card_holder'] ?? ''),
        'pan' => preg_replace('/\D+/', '', (string) ($params['pan'] ?? '')),
        'month' => (int) ($params['month'] ?? 0),
        'year' => (int) ($params['year'] ?? 0),
        'cvc' => (string) ($params['cvc'] ?? ''),
        'card_holder_mail' => (string) ($params['email'] ?? ''),
        'card_holder_phone' => (string) ($params['phone'] ?? ''),
        'description' => (string) ($params['description'] ?? 'MARVISPACE order'),
    ];

    return paynet_json_request($url, $payload, paynet_secret_key());
}

/** @return array<string, mixed> */
function paynet_tds_charge(string $sessionId, string $tokenId, string $mode = 'sandbox'): array
{
    $base = paynet_api_base($mode);
    $url = $base . '/v2/transaction/tds_charge';

    return paynet_json_request($url, [
        'session_id' => $sessionId,
        'token_id' => $tokenId,
        'transaction_type' => 1,
    ], paynet_secret_key());
}

function paynet_is_success(array $response): bool
{
    if (!empty($response['is_succeed'])) {
        return true;
    }
    $code = $response['code'] ?? null;
    return $code === 0 || $code === '0';
}

function paynet_redact_for_log(array $payload): array
{
    $safe = $payload;
    foreach (['pan', 'cvc', 'card_holder'] as $key) {
        if (isset($safe[$key])) {
            $safe[$key] = '[redacted]';
        }
    }
    return $safe;
}
