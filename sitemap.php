<?php
/**
 * Dynamic sitemap — EN + TR URLs with hreflang.
 */
declare(strict_types=1);

require_once __DIR__ . '/api/lib/storefront.php';
require_once __DIR__ . '/api/lib/i18n.php';
require_once __DIR__ . '/api/lib/product-seo.php';

$today = gmdate('Y-m-d');
$origin = seo_site_url();
$products = storefront_products();
$slugMap = seo_slug_map($products);

$pages = [
    ['en' => '/en/', 'tr' => '/tr/', 'changefreq' => 'daily', 'priority' => '1.0'],
    ['en' => '/contact', 'tr' => '/contact', 'changefreq' => 'monthly', 'priority' => '0.6'],
    ['en' => '/terms', 'tr' => '/kvkk', 'changefreq' => 'monthly', 'priority' => '0.4'],
    ['en' => '/privacy', 'tr' => '/kvkk', 'changefreq' => 'monthly', 'priority' => '0.4'],
    ['en' => '/accessibility', 'tr' => '/accessibility', 'changefreq' => 'monthly', 'priority' => '0.3'],
    ['en' => '/order-status', 'tr' => '/order-status', 'changefreq' => 'monthly', 'priority' => '0.5'],
    ['en' => '/mesafeli-satis-sozlesmesi', 'tr' => '/mesafeli-satis-sozlesmesi', 'changefreq' => 'monthly', 'priority' => '0.5'],
    ['en' => '/on-bilgilendirme', 'tr' => '/on-bilgilendirme', 'changefreq' => 'monthly', 'priority' => '0.5'],
    ['en' => '/iade-ve-iptal', 'tr' => '/iade-ve-iptal', 'changefreq' => 'monthly', 'priority' => '0.5'],
];

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=600');
header('X-Content-Type-Options: nosniff');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">' . "\n";

$writeHreflang = static function (string $en, string $tr) use ($origin): void {
    echo '    <xhtml:link rel="alternate" hreflang="en" href="' . seo_h($origin . $en) . '"/>' . "\n";
    echo '    <xhtml:link rel="alternate" hreflang="tr" href="' . seo_h($origin . $tr) . '"/>' . "\n";
    echo '    <xhtml:link rel="alternate" hreflang="x-default" href="' . seo_h($origin . $en) . '"/>' . "\n";
};

$seenLoc = [];
foreach ($pages as $page) {
    foreach (['en', 'tr'] as $lang) {
        $loc = $origin . $page[$lang];
        if (isset($seenLoc[$loc])) {
            continue;
        }
        $seenLoc[$loc] = true;
        echo "  <url>\n";
        echo '    <loc>' . seo_h($loc) . "</loc>\n";
        echo '    <lastmod>' . $today . "</lastmod>\n";
        echo '    <changefreq>' . $page['changefreq'] . "</changefreq>\n";
        echo '    <priority>' . $page['priority'] . "</priority>\n";
        $writeHreflang($page['en'], $page['tr']);
        echo "  </url>\n";
    }
}

foreach ($products as $product) {
    $en = seo_product_path($product, $slugMap, 'en');
    $tr = seo_product_path($product, $slugMap, 'tr');
    $image = seo_absolute_url((string) ($product['image'] ?? ''));
    foreach ([$en, $tr] as $path) {
        echo "  <url>\n";
        echo '    <loc>' . seo_h($origin . $path) . "</loc>\n";
        echo '    <lastmod>' . $today . "</lastmod>\n";
        echo "    <changefreq>weekly</changefreq>\n";
        echo "    <priority>0.8</priority>\n";
        $writeHreflang($en, $tr);
        if ($image !== $origin . '/') {
            echo "    <image:image>\n";
            echo '      <image:loc>' . seo_h($image) . "</image:loc>\n";
            echo '      <image:title>' . seo_h((string) ($product['label'] ?? '')) . "</image:title>\n";
            echo "    </image:image>\n";
        }
        echo "  </url>\n";
    }
}

echo '</urlset>';
