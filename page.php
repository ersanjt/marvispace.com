<?php
/**
 * Bilingual info/legal pages — one router for /en|/tr slugs.
 */
declare(strict_types=1);

require_once __DIR__ . '/api/lib/i18n.php';
require_once __DIR__ . '/api/lib/product-seo.php';

$page = strtolower(trim((string) ($_GET['page'] ?? '')));
$slug = strtolower(trim((string) ($_GET['slug'] ?? '')));

if ($page === '' && $slug !== '') {
    $page = i18n_page_from_slug($slug);
}

$relative = i18n_page_template($page);
if ($relative === '') {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Not found — MARVISPACE</title></head><body><p>Page not found.</p></body></html>';
    exit;
}

seo_serve_i18n_page($page, __DIR__ . '/' . $relative);
