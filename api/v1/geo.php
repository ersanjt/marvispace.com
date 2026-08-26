<?php
/**
 * Public geo probe — Turkey gets tr, everyone else en.
 */
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/i18n.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, max-age=300');

if (i18n_is_bot()) {
    echo json_encode(['ok' => true, 'data' => ['country' => '', 'lang' => 'en', 'source' => 'bot']]);
    exit;
}

$country = i18n_country_from_headers();
$source = $country !== '' ? 'header' : '';
if ($country === '') {
    $country = i18n_country_from_ip(i18n_client_ip());
    $source = $country !== '' ? 'ip' : 'default';
}

$lang = $country === 'TR' || ($country === '' && i18n_accept_language_prefers_tr()) ? 'tr' : 'en';
if ($country === 'TR') {
    $lang = 'tr';
} elseif ($country !== '') {
    $lang = 'en';
}

echo json_encode([
    'ok' => true,
    'data' => [
        'country' => $country,
        'lang' => $lang,
        'source' => $source ?: 'default',
    ],
], JSON_UNESCAPED_SLASHES);
