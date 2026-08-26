<?php
/**
 * Storefront product loader for SEO pages (HTML, not JSON API).
 * @author Ersan JT
 */
declare(strict_types=1);

function storefront_root(): string
{
    return dirname(__DIR__, 2);
}

/** Public in-stock catalog — DB first, install/products.json fallback. */
function storefront_products(): array
{
    static $products = null;
    if (is_array($products)) {
        return $products;
    }

    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/products-repo.php';

    $config = app_load_config();
    if (!empty($config['db'])) {
        try {
            require_once __DIR__ . '/db.php';
            $pdo = db_connect($config['db']);
            $list = products_list_public($pdo);
            if ($list) {
                $products = $list;
                return $products;
            }
        } catch (Throwable $e) {
            /* fall through to seed file */
        }
    }

    $file = storefront_root() . '/install/products.json';
    $raw = is_readable($file) ? file_get_contents($file) : '[]';
    $list = json_decode((string) $raw, true);
    if (!is_array($list)) {
        $list = [];
    }

    $products = array_values(array_filter($list, static function ($item) {
        return is_array($item) && ($item['inStock'] ?? true) !== false;
    }));

    return $products;
}
