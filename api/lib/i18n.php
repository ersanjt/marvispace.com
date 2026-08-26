<?php
/**
 * Language + geo helpers. Turkey → tr, everyone else → en.
 * Googlebot is not geo-cloaked: /tr/ and /en/ are real indexable URLs.
 */
declare(strict_types=1);

const I18N_COOKIE = 'marvispace_lang';

function i18n_is_bot(): bool
{
    $ua = strtolower((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
    if ($ua === '') {
        return false;
    }
    return (bool) preg_match('/googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|whatsapp|telegrambot|linkedinbot|preview|crawler|spider/i', $ua);
}

function i18n_client_ip(): string
{
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $key) {
        $raw = (string) ($_SERVER[$key] ?? '');
        if ($raw === '') {
            continue;
        }
        $ip = trim(explode(',', $raw)[0]);
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            return $ip;
        }
    }
    return '';
}

function i18n_country_from_headers(): string
{
    foreach ([
        'HTTP_CF_IPCOUNTRY',
        'HTTP_CLOUDFRONT_VIEWER_COUNTRY',
        'HTTP_X_COUNTRY_CODE',
        'HTTP_X_GEO_COUNTRY',
        'GEOIP_COUNTRY_CODE',
        'HTTP_X_APPENGINE_COUNTRY',
    ] as $header) {
        $value = strtoupper(trim((string) ($_SERVER[$header] ?? '')));
        if ($value !== '' && $value !== 'XX' && preg_match('/^[A-Z]{2}$/', $value)) {
            return $value;
        }
    }
    return '';
}

function i18n_country_from_ip(string $ip): string
{
    if ($ip === '' || !filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        return '';
    }
    $cacheFile = sys_get_temp_dir() . '/marvispace-geo-' . md5($ip) . '.txt';
    if (is_readable($cacheFile) && (time() - (int) filemtime($cacheFile)) < 86400) {
        $cached = strtoupper(trim((string) file_get_contents($cacheFile)));
        if (preg_match('/^[A-Z]{2}$/', $cached)) {
            return $cached;
        }
    }

    $url = 'https://ipwho.is/' . rawurlencode($ip) . '?fields=country_code,success';
    $ctx = stream_context_create([
        'http' => ['timeout' => 0.8, 'ignore_errors' => true],
        'ssl' => ['verify_peer' => true],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    if (!is_string($raw) || $raw === '') {
        return '';
    }
    $data = json_decode($raw, true);
    $code = strtoupper((string) ($data['country_code'] ?? ''));
    if (!preg_match('/^[A-Z]{2}$/', $code)) {
        return '';
    }
    @file_put_contents($cacheFile, $code);
    return $code;
}

function i18n_accept_language_prefers_tr(): bool
{
    $header = strtolower((string) ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? ''));
    if ($header === '') {
        return false;
    }
    return (bool) preg_match('/^(tr|tr-)|\btr(-|,|;|$)/', $header);
}

function i18n_normalize(?string $lang): string
{
    $lang = strtolower(trim((string) $lang));
    return $lang === 'tr' ? 'tr' : 'en';
}

function i18n_from_query(): string
{
    $hl = strtolower(trim((string) ($_GET['hl'] ?? $_GET['lang'] ?? '')));
    return ($hl === 'tr' || $hl === 'en') ? $hl : '';
}

function i18n_from_cookie(): string
{
    $cookie = strtolower(trim((string) ($_COOKIE[I18N_COOKIE] ?? '')));
    return ($cookie === 'tr' || $cookie === 'en') ? $cookie : '';
}

/** Resolved UI/SEO language for this request. */
function i18n_lang(): string
{
    static $lang = null;
    if (is_string($lang)) {
        return $lang;
    }

    $fromQuery = i18n_from_query();
    if ($fromQuery !== '') {
        $lang = $fromQuery;
        return $lang;
    }

    $fromCookie = i18n_from_cookie();
    if ($fromCookie !== '') {
        $lang = $fromCookie;
        return $lang;
    }

    if (!i18n_is_bot()) {
        $country = i18n_country_from_headers();
        if ($country === '') {
            $country = i18n_country_from_ip(i18n_client_ip());
        }
        if ($country === 'TR') {
            $lang = 'tr';
            return $lang;
        }
        if ($country !== '') {
            $lang = 'en';
            return $lang;
        }
        if (i18n_accept_language_prefers_tr()) {
            $lang = 'tr';
            return $lang;
        }
    }

    $lang = 'en';
    return $lang;
}

function i18n_persist(string $lang): void
{
    $lang = i18n_normalize($lang);
    if (headers_sent()) {
        return;
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    setcookie(I18N_COOKIE, $lang, [
        'expires' => time() + 60 * 60 * 24 * 365,
        'path' => '/',
        'secure' => $secure,
        'httponly' => false,
        'samesite' => 'Lax',
    ]);
    $_COOKIE[I18N_COOKIE] = $lang;
}

function i18n_html_lang(string $lang = ''): string
{
    return i18n_normalize($lang ?: i18n_lang()) === 'tr' ? 'tr' : 'en';
}

function i18n_og_locale(string $lang = ''): string
{
    return i18n_normalize($lang ?: i18n_lang()) === 'tr' ? 'tr_TR' : 'en_US';
}

function i18n_home_meta(string $lang): array
{
    if (i18n_normalize($lang) === 'tr') {
        return [
            'title' => 'MARVISPACE | Premium Deri Giyim — marvispace.com',
            'ogTitle' => 'MARVISPACE | Premium Deri Giyim',
            'description' => 'MARVISPACE’de premium deri ceket, palto, gömlek ve aksesuar. Erkek ve kadın koleksiyonu — güvenli ödeme, 14 gün iade.',
            'h1' => 'MARVISPACE — Premium Deri Giyim Online Mağaza',
        ];
    }
    return [
        'title' => 'MARVISPACE | Premium Leather Apparel — marvispace.com',
        'ogTitle' => 'MARVISPACE | Premium Leather Apparel',
        'description' => 'Shop premium leather jackets, coats, shirts and accessories at MARVISPACE. Curated mens and womens collections — secure checkout, 14-day returns.',
        'h1' => 'MARVISPACE — Premium Leather Apparel Online Store',
    ];
}

function i18n_category_phrase(array $product, string $lang): string
{
    $tr = i18n_normalize($lang) === 'tr';
    return match ($product['category'] ?? '') {
        'jackets' => $tr ? 'deri ceket' : 'leather jacket',
        'coats' => $tr ? 'deri palto' : 'leather coat',
        'shirts' => $tr ? 'gömlek' : 'shirt',
        'accessories' => $tr ? 'deri aksesuar' : 'leather accessory',
        'bottoms' => $tr ? 'deri alt giyim' : 'leather bottoms',
        default => $tr ? 'deri giyim' : 'leather apparel',
    };
}

function i18n_product_description(array $product, string $lang): string
{
    $label = (string) ($product['label'] ?? 'MARVISPACE');
    $price = number_format(
        function_exists('product_unit_price') ? product_unit_price($product) : (float) ($product['price'] ?? 0),
        2,
        '.',
        ''
    );
    $cat = i18n_category_phrase($product, $lang);
    $tr = i18n_normalize($lang) === 'tr';
    $gender = (($product['gender'] ?? '') === 'womens')
        ? ($tr ? 'kadın' : "women's")
        : ($tr ? 'erkek' : "men's");

    if ($tr) {
        return $label . ' — ' . $gender . ' için premium ' . $cat . '. MARVISPACE’de $'
            . $price . '. %100 kaliteli malzeme, 3–5 iş gününde kargo, 14 gün iade.';
    }
    return $label . ' — premium ' . $cat . ' for ' . $gender . '. $'
        . $price . ' at MARVISPACE. 100% premium materials, ships 3–5 business days, 14-day returns.';
}
