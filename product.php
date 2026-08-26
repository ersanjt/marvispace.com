<?php
/**
 * Product URL — same storefront UI, unique SEO + product OG image.
 */
declare(strict_types=1);

require_once __DIR__ . '/api/lib/storefront.php';
require_once __DIR__ . '/api/lib/i18n.php';
require_once __DIR__ . '/api/lib/product-seo.php';

$slug = trim((string) ($_GET['slug'] ?? ''));
$hl = i18n_from_query();
$products = storefront_products();
$slugMap = seo_slug_map($products);
$product = seo_find_product($products, $slugMap, $slug);

if (!$product) {
    $lang = $hl !== '' ? $hl : i18n_lang();
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    $home = seo_h(seo_site_url() . seo_home_path($lang));
    $msg = $lang === 'tr' ? 'Ürün bulunamadı.' : 'Product not found.';
    echo '<!doctype html><html lang="' . seo_h($lang) . '"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Not found — MARVISPACE</title><link rel="canonical" href="' . $home . '"></head><body><p>' . seo_h($msg) . '</p><p><a href="' . $home . '">MARVISPACE</a></p></body></html>';
    exit;
}

$canonicalSlug = $slugMap[(string) $product['id']] ?? '';
if ($hl === '') {
    $lang = i18n_lang();
    i18n_persist($lang);
    $target = $canonicalSlug !== '' ? $canonicalSlug : $slug;
    header('Location: ' . seo_site_url() . '/' . $lang . '/product/' . rawurlencode($target), true, 302);
    exit;
}

$lang = i18n_normalize($hl);
i18n_persist($lang);

if ($canonicalSlug !== '' && $slug !== $canonicalSlug) {
    header('Location: ' . seo_site_url() . '/' . $lang . '/product/' . rawurlencode($canonicalSlug), true, 301);
    exit;
}

$html = seo_apply_product_head(seo_storefront_html(), $product, $slugMap, $lang);
seo_send_html($html, 200, 300);
