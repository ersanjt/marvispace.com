<?php
/**
 * Product URL slugs + SEO helpers. Keep in sync with assets/js/core/product-seo.js
 * @author Ersan JT
 */
declare(strict_types=1);

function seo_h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function seo_site_url(): string
{
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? 'marvispace.com'));
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ((string) ($_SERVER['SERVER_PORT'] ?? '') === '443')
        || ((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $scheme = $https ? 'https' : 'http';
    if ($host === 'localhost' || str_starts_with($host, '127.0.0.1')) {
        return $scheme . '://' . $host;
    }
    return 'https://marvispace.com';
}

function seo_absolute_url(string $path): string
{
    if ($path === '') {
        return seo_site_url() . '/';
    }
    if (preg_match('#^https?://#i', $path)) {
        return $path;
    }
    return seo_site_url() . '/' . ltrim($path, '/');
}

function seo_slugify(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';
    $value = trim($value, '-');
    if (strlen($value) > 80) {
        $value = rtrim(substr($value, 0, 80), '-');
    }
    return $value;
}

/** Stable slug per product id — adding a new product does not change existing URLs. */
function seo_slug_map(array $products): array
{
    $sorted = $products;
    usort($sorted, static fn($a, $b) => strcmp((string) ($a['id'] ?? ''), (string) ($b['id'] ?? '')));

    $used = [];
    $map = [];
    foreach ($sorted as $product) {
        $id = (string) ($product['id'] ?? '');
        if ($id === '') {
            continue;
        }
        $base = seo_slugify((string) ($product['label'] ?? ''));
        if ($base === '') {
            $base = seo_slugify($id);
        }
        if ($base === '') {
            $base = 'product';
        }
        $slug = $base;
        if (isset($used[$slug])) {
            $idPart = seo_slugify($id);
            $slug = $idPart !== '' ? $base . '-' . $idPart : $base . '-2';
            $n = 2;
            while (isset($used[$slug])) {
                $slug = $base . '-' . $n;
                $n++;
            }
        }
        $used[$slug] = true;
        $map[$id] = $slug;
    }
    return $map;
}

function seo_lang(?string $lang = null): string
{
    if (function_exists('i18n_normalize')) {
        return i18n_normalize($lang ?? (function_exists('i18n_lang') ? i18n_lang() : 'en'));
    }
    $lang = strtolower(trim((string) $lang));
    return $lang === 'tr' ? 'tr' : 'en';
}

function seo_home_path(?string $lang = null): string
{
    return '/' . seo_lang($lang) . '/';
}

function seo_product_path(array $product, array $slugMap, ?string $lang = null): string
{
    $id = (string) ($product['id'] ?? '');
    $slug = $slugMap[$id] ?? seo_slugify($id);
    return '/' . seo_lang($lang) . '/product/' . $slug;
}

function seo_product_url(array $product, array $slugMap, ?string $lang = null): string
{
    return seo_site_url() . seo_product_path($product, $slugMap, $lang);
}

function seo_hreflang_tags(string $enUrl, string $trUrl): string
{
    return '  <link rel="alternate" hreflang="en" href="' . seo_h($enUrl) . '" />' . "\n"
        . '  <link rel="alternate" hreflang="tr" href="' . seo_h($trUrl) . '" />' . "\n"
        . '  <link rel="alternate" hreflang="x-default" href="' . seo_h($enUrl) . '" />';
}

function seo_image_mime(string $path): string
{
    $ext = strtolower(pathinfo(parse_url($path, PHP_URL_PATH) ?: $path, PATHINFO_EXTENSION));
    return match ($ext) {
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        default => 'image/jpeg',
    };
}

function seo_apply_html_lang(string $html, string $lang): string
{
    $htmlLang = $lang === 'tr' ? 'tr' : 'en';
    $next = preg_replace('/<html\s+lang="[^"]*"/i', '<html lang="' . $htmlLang . '"', $html, 1);
    return is_string($next) ? $next : $html;
}

function seo_find_product(array $products, array $slugMap, string $slugOrId): ?array
{
    $needle = trim($slugOrId);
    if ($needle === '') {
        return null;
    }
    foreach ($products as $product) {
        $id = (string) ($product['id'] ?? '');
        if ($id === $needle) {
            return $product;
        }
        if (($slugMap[$id] ?? '') === $needle) {
            return $product;
        }
    }
    return null;
}

function seo_product_description(array $product, ?string $lang = null): string
{
    $lang = seo_lang($lang);
    if (function_exists('i18n_product_description')) {
        return i18n_product_description($product, $lang);
    }
    $label = (string) ($product['label'] ?? 'MARVISPACE');
    $price = number_format((float) ($product['price'] ?? 0), 2, '.', '');
    return $label . ' — MARVISPACE. $' . $price;
}

function seo_product_jsonld(array $product, array $slugMap, ?string $lang = null): array
{
    $lang = seo_lang($lang);
    $url = seo_product_url($product, $slugMap, $lang);
    $images = [];
    if (!empty($product['image'])) {
        $images[] = seo_absolute_url((string) $product['image']);
    }
    if (!empty($product['images']) && is_array($product['images'])) {
        foreach ($product['images'] as $src) {
            $abs = seo_absolute_url((string) $src);
            if ($abs !== '' && !in_array($abs, $images, true)) {
                $images[] = $abs;
            }
        }
    }

    $inStock = ($product['inStock'] ?? true) !== false;
    return [
        '@context' => 'https://schema.org',
        '@type' => 'Product',
        '@id' => $url,
        'name' => (string) ($product['label'] ?? ''),
        'sku' => (string) ($product['id'] ?? ''),
        'image' => $images,
        'description' => seo_product_description($product, $lang),
        'inLanguage' => $lang,
        'brand' => [
            '@type' => 'Brand',
            'name' => 'MARVISPACE',
        ],
        'offers' => [
            '@type' => 'Offer',
            'url' => $url,
            'priceCurrency' => 'USD',
            'price' => number_format(
                function_exists('product_unit_price') ? product_unit_price($product) : (float) ($product['price'] ?? 0),
                2,
                '.',
                ''
            ),
            'availability' => $inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            'itemCondition' => 'https://schema.org/NewCondition',
            'seller' => [
                '@type' => 'Organization',
                'name' => 'MARVISPACE',
                'url' => seo_site_url() . '/',
            ],
        ],
    ];
}

function seo_itemlist_jsonld(array $products, array $slugMap, ?string $lang = null): array
{
    $lang = seo_lang($lang);
    $elements = [];
    $i = 1;
    foreach ($products as $product) {
        if (($product['inStock'] ?? true) === false) {
            continue;
        }
        $url = seo_product_url($product, $slugMap, $lang);
        $elements[] = [
            '@type' => 'ListItem',
            'position' => $i,
            'url' => $url,
            'name' => (string) ($product['label'] ?? ''),
        ];
        $i++;
    }
    return [
        '@context' => 'https://schema.org',
        '@type' => 'ItemList',
        'name' => $lang === 'tr' ? 'MARVISPACE Ürün Kataloğu' : 'MARVISPACE Product Catalog',
        'inLanguage' => $lang,
        'itemListElement' => $elements,
    ];
}

function seo_json(array $data): string
{
    return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE) ?: '{}';
}

function seo_replace_tagged(string $html, string $key, string $value, string $mode = 'content'): string
{
    $safeKey = preg_quote($key, '/');
    $safe = seo_h($value);
    if ($mode === 'title') {
        $next = preg_replace(
            '/(<title[^>]*data-seo="' . $safeKey . '"[^>]*>)(.*?)(<\/title>)/is',
            '$1' . $safe . '$3',
            $html,
            1
        );
        return is_string($next) ? $next : $html;
    }
    if ($mode === 'text') {
        $next = preg_replace(
            '/(<h1[^>]*data-seo="' . $safeKey . '"[^>]*>)(.*?)(<\/h1>)/is',
            '$1' . $safe . '$3',
            $html,
            1
        );
        return is_string($next) ? $next : $html;
    }
    $attr = $mode === 'href' ? 'href' : 'content';
    $next = preg_replace(
        '/(data-seo="' . $safeKey . '"[^>]*' . $attr . '=")([^"]*)(")/i',
        '$1' . $safe . '$3',
        $html,
        1
    );
    return is_string($next) ? $next : $html;
}

function seo_apply_product_head(string $html, array $product, array $slugMap, ?string $lang = null): string
{
    $lang = seo_lang($lang);
    $label = (string) ($product['label'] ?? 'MARVISPACE');
    $title = $label . ' | MARVISPACE';
    $description = seo_product_description($product, $lang);
    $url = seo_product_url($product, $slugMap, $lang);
    $enUrl = seo_product_url($product, $slugMap, 'en');
    $trUrl = seo_product_url($product, $slugMap, 'tr');
    $image = seo_absolute_url((string) ($product['image'] ?? '/assets/images/brand/og.jpg'));
    $ogLocale = $lang === 'tr' ? 'tr_TR' : 'en_US';
    $ogAltLocale = $lang === 'tr' ? 'en_US' : 'tr_TR';

    $html = seo_apply_html_lang($html, $lang);
    $html = seo_replace_tagged($html, 'title', $title, 'title');
    $html = seo_replace_tagged($html, 'description', $description);
    $html = seo_replace_tagged($html, 'canonical', $url, 'href');
    $html = seo_replace_tagged($html, 'og-type', 'product');
    $html = seo_replace_tagged($html, 'og-title', $title);
    $html = seo_replace_tagged($html, 'og-description', $description);
    $html = seo_replace_tagged($html, 'og-url', $url);
    $html = seo_replace_tagged($html, 'og-image', $image);
    $html = seo_replace_tagged($html, 'og-image-secure', $image);
    $html = seo_replace_tagged($html, 'og-image-type', seo_image_mime($image));
    $html = seo_replace_tagged($html, 'og-image-alt', $label . ' — MARVISPACE');
    $html = seo_replace_tagged($html, 'og-locale', $ogLocale);
    $html = seo_replace_tagged($html, 'og-locale-alt', $ogAltLocale);
    $html = seo_replace_tagged($html, 'twitter-title', $title);
    $html = seo_replace_tagged($html, 'twitter-description', $description);
    $html = seo_replace_tagged($html, 'twitter-image', $image);
    $html = seo_replace_tagged($html, 'twitter-image-alt', $label . ' — MARVISPACE');
    $html = seo_replace_tagged($html, 'h1', $label . ' — MARVISPACE', 'text');

    $boot = [
        'id' => (string) ($product['id'] ?? ''),
        'slug' => $slugMap[(string) ($product['id'] ?? '')] ?? '',
        'lang' => $lang,
        'image' => $image,
    ];
    $price = number_format(
        function_exists('product_unit_price') ? product_unit_price($product) : (float) ($product['price'] ?? 0),
        2,
        '.',
        ''
    );
    $inject = seo_hreflang_tags($enUrl, $trUrl) . "\n"
        . '  <meta property="product:price:amount" content="' . seo_h($price) . '" />' . "\n"
        . '  <meta property="product:price:currency" content="USD" />' . "\n"
        . '  <link rel="image_src" href="' . seo_h($image) . '" />' . "\n"
        . '  <script type="application/ld+json">' . seo_json(seo_product_jsonld($product, $slugMap, $lang)) . "</script>\n"
        . '  <script>window.__MARVISPACE_OPEN_PRODUCT__=' . seo_json($boot) . ";window.__MARVISPACE_LANG__='" . $lang . "';</script>\n";
    $html = str_replace('<!-- SEO_INJECT -->', $inject . '  <!-- SEO_INJECT -->', $html);

    $noscript = '<noscript><article><h1>' . seo_h($label) . '</h1>'
        . '<p>' . seo_h($description) . '</p>'
        . '<p>$' . seo_h($price) . '</p>'
        . '<img src="' . seo_h($image) . '" alt="' . seo_h($label) . '" width="800" height="800" />'
        . '</article></noscript>';
    $html = str_replace('<!-- SEO_NOSCRIPT -->', $noscript, $html);

    return $html;
}

function seo_apply_home_itemlist(string $html, array $products, array $slugMap, ?string $lang = null): string
{
    $lang = seo_lang($lang);
    $meta = function_exists('i18n_home_meta') ? i18n_home_meta($lang) : [
        'title' => 'MARVISPACE | Premium Leather Apparel — marvispace.com',
        'ogTitle' => 'MARVISPACE | Premium Leather Apparel',
        'description' => 'Shop premium leather jackets at MARVISPACE.',
        'h1' => 'MARVISPACE — Premium Leather Apparel Online Store',
    ];
    $home = seo_site_url() . seo_home_path($lang);
    $enHome = seo_site_url() . seo_home_path('en');
    $trHome = seo_site_url() . seo_home_path('tr');
    $ogLocale = $lang === 'tr' ? 'tr_TR' : 'en_US';

    $html = seo_apply_html_lang($html, $lang);
    $html = seo_replace_tagged($html, 'title', $meta['title'], 'title');
    $html = seo_replace_tagged($html, 'description', $meta['description']);
    $html = seo_replace_tagged($html, 'canonical', $home, 'href');
    $html = seo_replace_tagged($html, 'og-title', $meta['ogTitle']);
    $html = seo_replace_tagged($html, 'og-description', $meta['description']);
    $html = seo_replace_tagged($html, 'og-url', $home);
    $html = seo_replace_tagged($html, 'og-locale', $ogLocale);
    $html = seo_replace_tagged($html, 'twitter-title', $meta['ogTitle']);
    $html = seo_replace_tagged($html, 'twitter-description', $meta['description']);
    $html = seo_replace_tagged($html, 'h1', $meta['h1'], 'text');

    $inject = seo_hreflang_tags($enHome, $trHome) . "\n"
        . '  <script type="application/ld+json">' . seo_json(seo_itemlist_jsonld($products, $slugMap, $lang)) . "</script>\n"
        . '  <script>window.__MARVISPACE_LANG__="' . $lang . '";</script>\n';
    $html = str_replace('<!-- SEO_INJECT -->', $inject . '  <!-- SEO_INJECT -->', $html);

    $items = '';
    foreach ($products as $product) {
        if (($product['inStock'] ?? true) === false) {
            continue;
        }
        $items .= '<li><a href="' . seo_h(seo_product_path($product, $slugMap, $lang)) . '">'
            . seo_h((string) ($product['label'] ?? '')) . '</a></li>';
    }
    $noscript = '<noscript><nav aria-label="Product catalog"><ul>' . $items . '</ul></nav></noscript>';
    return str_replace('<!-- SEO_NOSCRIPT -->', $noscript, $html);
}

function seo_storefront_html(): string
{
    $file = storefront_root() . '/index.html';
    $html = is_readable($file) ? file_get_contents($file) : false;
    if (!is_string($html) || $html === '') {
        http_response_code(500);
        return '<!doctype html><title>MARVISPACE</title><p>Storefront unavailable.</p>';
    }
    return $html;
}

function seo_send_html(string $html, int $status = 200, int $maxAge = 0): void
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    if ($maxAge > 0) {
        header('Cache-Control: public, max-age=' . $maxAge);
    } else {
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
    }
    echo $html;
}
