<?php
/**
 * Homepage — language prefix /tr/ or /en/, geo redirect from /.
 */
declare(strict_types=1);

require_once __DIR__ . '/api/lib/storefront.php';
require_once __DIR__ . '/api/lib/i18n.php';
require_once __DIR__ . '/api/lib/product-seo.php';

$products = storefront_products();
$slugMap = seo_slug_map($products);

$id = trim((string) ($_GET['product'] ?? ''));
$hl = i18n_from_query();

if ($hl === '') {
    $lang = i18n_lang();
    i18n_persist($lang);
    if ($id !== '') {
        $product = seo_find_product($products, $slugMap, $id);
        if ($product) {
            header('Location: ' . seo_product_url($product, $slugMap, $lang), true, 301);
            exit;
        }
    }
    header('Location: ' . seo_site_url() . seo_home_path($lang), true, 302);
    exit;
}

$lang = i18n_normalize($hl);
i18n_persist($lang);

if ($id !== '') {
    $product = seo_find_product($products, $slugMap, $id);
    if ($product) {
        header('Location: ' . seo_product_url($product, $slugMap, $lang), true, 301);
        exit;
    }
}

$html = seo_apply_home_itemlist(seo_storefront_html(), $products, $slugMap, $lang);
seo_send_html($html, 200, 0);
