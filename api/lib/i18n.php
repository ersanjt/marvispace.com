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

function i18n_page_slugs(): array
{
    return [
        'contact' => ['en' => 'contact', 'tr' => 'iletisim'],
        'privacy' => ['en' => 'privacy', 'tr' => 'gizlilik'],
        'accessibility' => ['en' => 'accessibility', 'tr' => 'erisilebilirlik'],
        'cookies' => ['en' => 'cookies', 'tr' => 'cerez-politikasi'],
        'terms' => ['en' => 'terms', 'tr' => 'kullanim-kosullari'],
        'returns' => ['en' => 'returns', 'tr' => 'iade-ve-iptal'],
        'kvkk' => ['en' => 'kvkk', 'tr' => 'kvkk'],
        'distance' => ['en' => 'distance-sales', 'tr' => 'mesafeli-satis-sozlesmesi'],
        'preinfo' => ['en' => 'pre-contract', 'tr' => 'on-bilgilendirme'],
    ];
}

/** HTML templates for bilingual pages (relative to site root). */
function i18n_page_templates(): array
{
    return [
        'contact' => 'templates/contact.html',
        'privacy' => 'templates/privacy.html',
        'accessibility' => 'templates/accessibility.html',
        'cookies' => 'templates/cookies.html',
        'terms' => 'templates/terms.html',
        'returns' => 'templates/returns.html',
        'kvkk' => 'templates/kvkk.html',
        'distance' => 'templates/distance.html',
        'preinfo' => 'templates/preinfo.html',
    ];
}

function i18n_page_template(string $page): string
{
    return i18n_page_templates()[$page] ?? '';
}

function i18n_page_from_slug(string $slug): string
{
    $slug = strtolower(trim($slug));
    if ($slug === '') {
        return '';
    }
    foreach (i18n_page_slugs() as $page => $langs) {
        if (($langs['en'] ?? '') === $slug || ($langs['tr'] ?? '') === $slug) {
            return $page;
        }
    }
    return '';
}

function i18n_page_path(string $page, ?string $lang = null): string
{
    $lang = i18n_normalize($lang);
    $slugs = i18n_page_slugs()[$page] ?? ['en' => $page, 'tr' => $page];
    return '/' . $lang . '/' . ($slugs[$lang] ?? $page);
}

function i18n_page_expected_slug(string $page, string $lang): string
{
    $slugs = i18n_page_slugs()[$page] ?? ['en' => $page, 'tr' => $page];
    return $slugs[i18n_normalize($lang)] ?? $page;
}

function i18n_contact_path(?string $lang = null): string
{
    return i18n_page_path('contact', $lang);
}

function i18n_privacy_path(?string $lang = null): string
{
    return i18n_page_path('privacy', $lang);
}

function i18n_contact_meta(string $lang): array
{
    if (i18n_normalize($lang) === 'tr') {
        return [
            'title' => 'İletişim — MARVISPACE',
            'ogTitle' => 'İletişim — MARVISPACE',
            'description' => 'MARVISPACE iletişim. İstanbul Kağıthane deri atölyesi. Sipariş, iade ve müşteri hizmetleri — 1–2 iş günü içinde yanıt.',
            'h1' => 'Atölyeyi ziyaret edin.',
        ];
    }
    return [
        'title' => 'Contact — MARVISPACE',
        'ogTitle' => 'Contact — MARVISPACE',
        'description' => 'Contact MARVISPACE. Istanbul Kağıthane leather workshop. Orders, returns, and customer support — we reply within 1–2 business days.',
        'h1' => 'Visit the workshop.',
    ];
}

function i18n_privacy_meta(string $lang): array
{
    if (i18n_normalize($lang) === 'tr') {
        return [
            'title' => 'Gizlilik — MARVISPACE',
            'ogTitle' => 'Gizlilik — MARVISPACE',
            'description' => 'MARVISPACE gizlilik ve KVKK aydınlatma metni. İşlenen veriler, saklama, aktarım, haklar ve çerezler — support@marvispace.com.',
            'h1' => 'Gizlilik',
        ];
    }
    return [
        'title' => 'Privacy — MARVISPACE',
        'ogTitle' => 'Privacy — MARVISPACE',
        'description' => 'MARVISPACE privacy policy and KVKK notice. Data we process, retention, transfers, your rights, and cookies — support@marvispace.com.',
        'h1' => 'Privacy',
    ];
}

function i18n_accessibility_meta(string $lang): array
{
    if (i18n_normalize($lang) === 'tr') {
        return [
            'title' => 'Erişilebilirlik — MARVISPACE',
            'ogTitle' => 'Erişilebilirlik — MARVISPACE',
            'description' => 'MARVISPACE erişilebilirlik. Klavye ile gezinme, okunabilir yazı ve semantik sayfa yapısı. Engel bildirimi: support@marvispace.com.',
            'h1' => 'Erişilebilirlik',
        ];
    }
    return [
        'title' => 'Accessibility — MARVISPACE',
        'ogTitle' => 'Accessibility — MARVISPACE',
        'description' => 'MARVISPACE accessibility. Keyboard navigation, readable typography, and semantic page structure. Report barriers to support@marvispace.com.',
        'h1' => 'Accessibility',
    ];
}

function i18n_cookies_meta(string $lang): array
{
    if (i18n_normalize($lang) === 'tr') {
        return [
            'title' => 'Çerez Politikası — MARVISPACE',
            'ogTitle' => 'Çerez Politikası — MARVISPACE',
            'description' => 'MARVISPACE çerez politikası. Zorunlu çerezler sepet ve oturum içindir; analitik çerezler yalnızca kabul sonrası yüklenir.',
            'h1' => 'Çerez Politikası',
        ];
    }
    return [
        'title' => 'Cookie Policy — MARVISPACE',
        'ogTitle' => 'Cookie Policy — MARVISPACE',
        'description' => 'MARVISPACE cookie policy. Essential cookies for cart and session; analytics cookies load only after you accept the banner.',
        'h1' => 'Cookie Policy',
    ];
}

function i18n_terms_meta(string $lang): array
{
    if (i18n_normalize($lang) === 'tr') {
        return [
            'title' => 'Kullanım Koşulları — MARVISPACE',
            'ogTitle' => 'Kullanım Koşulları — MARVISPACE',
            'description' => 'MARVISPACE kullanım koşulları. Güvenli ödeme, KDV dahil fiyatlar, 3D Secure. Türkiye mesafeli satış metinleri ayrıca yayımlanır.',
            'h1' => 'Kullanım Koşulları',
        ];
    }
    return [
        'title' => 'Terms — MARVISPACE',
        'ogTitle' => 'Terms — MARVISPACE',
        'description' => 'MARVISPACE terms of service. Secure checkout, VAT-inclusive prices, 3D Secure. Distance-sale documents for Turkey are published separately.',
        'h1' => 'Terms',
    ];
}

function i18n_returns_meta(string $lang): array
{
    if (i18n_normalize($lang) === 'tr') {
        return [
            'title' => 'İade ve Cayma Hakkı — MARVISPACE',
            'ogTitle' => 'İade ve Cayma Hakkı — MARVISPACE',
            'description' => 'MARVISPACE iade, iptal ve 14 gün cayma hakkı. Süreç, istisnalar ve ayıplı ürün — support@marvispace.com.',
            'h1' => 'İade ve Cayma Hakkı',
        ];
    }
    return [
        'title' => 'Returns & Withdrawal — MARVISPACE',
        'ogTitle' => 'Returns & Withdrawal — MARVISPACE',
        'description' => 'MARVISPACE returns, cancellation, and 14-day withdrawal. Process, exceptions, and damaged goods — support@marvispace.com.',
        'h1' => 'Returns & Withdrawal',
    ];
}

function i18n_kvkk_meta(string $lang): array
{
    if (i18n_normalize($lang) === 'tr') {
        return [
            'title' => 'KVKK Aydınlatma Metni — MARVISPACE',
            'ogTitle' => 'KVKK Aydınlatma Metni — MARVISPACE',
            'description' => 'MARVISPACE KVKK aydınlatma metni. İşlenen kişisel veriler, amaç, aktarım, saklama ve haklar — 6698 sayılı Kanun, support@marvispace.com.',
            'h1' => 'KVKK Aydınlatma Metni',
        ];
    }
    return [
        'title' => 'KVKK Privacy Notice — MARVISPACE',
        'ogTitle' => 'KVKK Privacy Notice — MARVISPACE',
        'description' => 'MARVISPACE KVKK privacy notice. Personal data we process, purpose, transfers, retention, and your rights under Turkish Law No. 6698.',
        'h1' => 'KVKK Privacy Notice',
    ];
}

function i18n_distance_meta(string $lang): array
{
    if (i18n_normalize($lang) === 'tr') {
        return [
            'title' => 'Mesafeli Satış Sözleşmesi — MARVISPACE',
            'ogTitle' => 'Mesafeli Satış Sözleşmesi — MARVISPACE',
            'description' => 'MARVISPACE mesafeli satış sözleşmesi. Teslimat 3–7 iş günü, KDV dahil fiyat, 14 gün cayma hakkı — 6502 sayılı Kanun.',
            'h1' => 'Mesafeli Satış Sözleşmesi',
        ];
    }
    return [
        'title' => 'Distance Sales Agreement — MARVISPACE',
        'ogTitle' => 'Distance Sales Agreement — MARVISPACE',
        'description' => 'MARVISPACE distance sales agreement. Delivery 3–7 business days, VAT-inclusive prices, 14-day withdrawal — Turkish Law No. 6502.',
        'h1' => 'Distance Sales Agreement',
    ];
}

function i18n_preinfo_meta(string $lang): array
{
    if (i18n_normalize($lang) === 'tr') {
        return [
            'title' => 'Ön Bilgilendirme Formu — MARVISPACE',
            'ogTitle' => 'Ön Bilgilendirme Formu — MARVISPACE',
            'description' => 'MARVISPACE ön bilgilendirme formu. Fiyat, kargo, ödeme, teslimat ve cayma hakkı — sipariş öncesi zorunlu bilgiler.',
            'h1' => 'Ön Bilgilendirme Formu',
        ];
    }
    return [
        'title' => 'Pre-contract Information — MARVISPACE',
        'ogTitle' => 'Pre-contract Information — MARVISPACE',
        'description' => 'MARVISPACE pre-contract information. Price, shipping, payment, delivery, and withdrawal rights before you order.',
        'h1' => 'Pre-contract Information',
    ];
}

function i18n_page_meta(string $page, string $lang): array
{
    return match ($page) {
        'privacy' => i18n_privacy_meta($lang),
        'accessibility' => i18n_accessibility_meta($lang),
        'cookies' => i18n_cookies_meta($lang),
        'terms' => i18n_terms_meta($lang),
        'returns' => i18n_returns_meta($lang),
        'kvkk' => i18n_kvkk_meta($lang),
        'distance' => i18n_distance_meta($lang),
        'preinfo' => i18n_preinfo_meta($lang),
        default => i18n_contact_meta($lang),
    };
}

function i18n_home_meta(string $lang): array
{
    if (i18n_normalize($lang) === 'tr') {
        return [
            'title' => 'Premium Deri Ceket ve Palto | MARVISPACE',
            'ogTitle' => 'Premium Deri Ceketler | MARVISPACE',
            'description' => 'İstanbul atölyesinden premium deri ceket, palto, gömlek ve aksesuar. Erkek ve kadın koleksiyonu, 3D Secure ödeme, 3–7 gün kargo, 14 gün iade.',
            'h1' => 'MARVISPACE — İstanbul’dan Premium Deri Giyim',
        ];
    }
    return [
        'title' => 'Premium Leather Jackets & Coats | MARVISPACE',
        'ogTitle' => 'Premium Leather Jackets | MARVISPACE',
        'description' => 'Shop premium leather jackets, coats, shirts and accessories from the Istanbul workshop. Men’s and women’s collections, 3D Secure checkout, 3–7 day shipping, 14-day returns.',
        'h1' => 'MARVISPACE — Premium Leather Apparel from Istanbul',
    ];
}

function i18n_home_faq(string $lang): array
{
    if (i18n_normalize($lang) === 'tr') {
        return [
            [
                'q' => 'MARVISPACE deri ceketler nerede üretiliyor?',
                'a' => 'Koleksiyon İstanbul atölyesinde üretilir. Siparişler 3–7 iş gününde kargoya verilir.',
            ],
            [
                'q' => 'İade süresi nedir?',
                'a' => 'Teslimattan sonra 14 gün içinde cayma ve iade hakkınız vardır. Koşullar iade sayfasındadır.',
            ],
            [
                'q' => 'Ödeme güvenli mi?',
                'a' => 'Kart ödemeleri 3D Secure ile Ziraat Bankası veya iyzico Paynet üzerinden alınır. Kart bilgileri sunucularımızda saklanmaz.',
            ],
            [
                'q' => 'Hangi bedenleri satıyorsunuz?',
                'a' => 'Ceket ve paltolar XS–XXL (EU 34–44) bedenlerdedir. Ürün sayfasında beden seçimi vardır.',
            ],
        ];
    }
    return [
        [
            'q' => 'Where are MARVISPACE leather jackets made?',
            'a' => 'The collection is made in our Istanbul workshop. Orders usually ship within 3–7 business days.',
        ],
        [
            'q' => 'What is the return window?',
            'a' => 'You can withdraw and return within 14 days of delivery. Full terms are on the returns page.',
        ],
        [
            'q' => 'Is checkout secure?',
            'a' => 'Card payments run through 3D Secure with Ziraat Bank or iyzico Paynet. Card details are not stored on our servers.',
        ],
        [
            'q' => 'Which sizes do you sell?',
            'a' => 'Jackets and coats are available in XS–XXL (EU 34–44). Choose a size on each product page.',
        ],
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
    $symbol = function_exists('storefront_currency_symbol') ? storefront_currency_symbol() : '$';

    if ($tr) {
        return $label . ' — ' . $gender . ' için premium ' . $cat
            . '. İstanbul atölyesi, ' . $symbol . $price
            . '. %100 kaliteli malzeme, 3–7 iş gününde kargo, 14 gün iade. MARVISPACE.';
    }
    return $label . ' — premium ' . $cat . ' for ' . $gender
        . '. Istanbul workshop, ' . $symbol . $price
        . '. 100% premium materials, ships 3–7 business days, 14-day returns. MARVISPACE.';
}
