<?php
declare(strict_types=1);

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function product_row_to_array(array $row): array
{
    $images = json_decode($row['images'] ?? '[]', true);
    $sizes = json_decode($row['sizes'] ?? '[]', true);
    if (!is_array($images)) {
        $images = [];
    }
    if (!is_array($sizes) || !$sizes) {
        $sizes = DEFAULT_SIZES;
    }

    return [
        'id' => $row['id'],
        'label' => $row['label'],
        'image' => $row['image'],
        'images' => $images,
        'galleryCount' => (int) ($row['gallery_count'] ?? count($images)),
        'price' => (float) $row['price'],
        'category' => $row['category'],
        'gender' => $row['gender'],
        'inStock' => (bool) $row['in_stock'],
        'stock' => (int) $row['stock'],
        'sizes' => $sizes,
    ];
}

function products_list(PDO $pdo): array
{
    $stmt = $pdo->query('SELECT * FROM products ORDER BY label ASC');
    $rows = $stmt->fetchAll();
    return array_map('product_row_to_array', $rows);
}

/** Storefront catalog — only purchasable products */
function products_list_public(PDO $pdo): array
{
    $stmt = $pdo->query('SELECT * FROM products WHERE in_stock = 1 ORDER BY label ASC');
    $rows = $stmt->fetchAll();
    return array_map('product_row_to_array', $rows);
}

function product_get(PDO $pdo, string $id): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? product_row_to_array($row) : null;
}

function product_save(PDO $pdo, array $product): array
{
    $images = $product['images'] ?? [];
    $sizes = $product['sizes'] ?? DEFAULT_SIZES;
    if (!is_array($images)) {
        $images = [];
    }
    if (!is_array($sizes) || !$sizes) {
        $sizes = DEFAULT_SIZES;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO products (id, label, image, images, gallery_count, price, category, gender, in_stock, stock, sizes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           label = VALUES(label),
           image = VALUES(image),
           images = VALUES(images),
           gallery_count = VALUES(gallery_count),
           price = VALUES(price),
           category = VALUES(category),
           gender = VALUES(gender),
           in_stock = VALUES(in_stock),
           stock = VALUES(stock),
           sizes = VALUES(sizes)'
    );

    $stmt->execute([
        $product['id'],
        $product['label'],
        $product['image'],
        json_encode($images, JSON_UNESCAPED_SLASHES),
        (int) ($product['galleryCount'] ?? count($images)),
        (float) $product['price'],
        $product['category'],
        $product['gender'],
        !empty($product['inStock']) ? 1 : 0,
        (int) ($product['stock'] ?? 0),
        json_encode($sizes, JSON_UNESCAPED_SLASHES),
    ]);

    return product_get($pdo, $product['id']) ?? $product;
}

function product_delete(PDO $pdo, string $id): bool
{
    $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
}

function products_bulk_ids_placeholder(array $ids): array
{
    $ids = array_values(array_unique(array_filter(array_map(
        static fn($id) => trim((string) $id),
        $ids
    ))));
    if (!$ids) {
        return ['', []];
    }
    return [implode(',', array_fill(0, count($ids), '?')), $ids];
}

function products_bulk_update(PDO $pdo, array $ids, array $patch): array
{
    [$placeholder, $ids] = products_bulk_ids_placeholder($ids);
    if ($placeholder === '') {
        return ['updated' => 0, 'ids' => []];
    }

    $updated = 0;

    if (!empty($patch['price']) && is_array($patch['price'])) {
        $mode = (string) ($patch['price']['mode'] ?? '');
        $value = (float) ($patch['price']['value'] ?? 0);
        $sql = match ($mode) {
            'percent_increase' => "UPDATE products SET price = ROUND(GREATEST(0, price * (1 + ? / 100)), 2) WHERE id IN ($placeholder)",
            'percent_decrease' => "UPDATE products SET price = ROUND(GREATEST(0, price * (1 - ? / 100)), 2) WHERE id IN ($placeholder)",
            'amount_increase' => "UPDATE products SET price = ROUND(GREATEST(0, price + ?), 2) WHERE id IN ($placeholder)",
            'amount_decrease' => "UPDATE products SET price = ROUND(GREATEST(0, price - ?), 2) WHERE id IN ($placeholder)",
            'set' => "UPDATE products SET price = ROUND(GREATEST(0, ?), 2) WHERE id IN ($placeholder)",
            default => '',
        };
        if ($sql !== '') {
            $stmt = $pdo->prepare($sql);
            $stmt->execute(array_merge([$value], $ids));
            $updated = max($updated, $stmt->rowCount());
        }
    }

    if (!empty($patch['stock']) && is_array($patch['stock'])) {
        $mode = (string) ($patch['stock']['mode'] ?? '');
        $value = (int) ($patch['stock']['value'] ?? 0);
        $sql = match ($mode) {
            'add' => "UPDATE products SET stock = GREATEST(0, stock + ?) WHERE id IN ($placeholder)",
            'subtract' => "UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id IN ($placeholder)",
            'set' => "UPDATE products SET stock = GREATEST(0, ?) WHERE id IN ($placeholder)",
            default => '',
        };
        if ($sql !== '') {
            $stmt = $pdo->prepare($sql);
            $stmt->execute(array_merge([$value], $ids));
            $updated = max($updated, $stmt->rowCount());
        }
    }

    if (array_key_exists('category', $patch)) {
        $category = trim((string) $patch['category']);
        $allowed = ['jackets', 'coats', 'shirts', 'bottoms', 'accessories'];
        if (in_array($category, $allowed, true)) {
            $stmt = $pdo->prepare("UPDATE products SET category = ? WHERE id IN ($placeholder)");
            $stmt->execute(array_merge([$category], $ids));
            $updated = max($updated, $stmt->rowCount());
        }
    }

    if (array_key_exists('gender', $patch)) {
        $gender = trim((string) $patch['gender']);
        if (in_array($gender, ['mens', 'womens'], true)) {
            $stmt = $pdo->prepare("UPDATE products SET gender = ? WHERE id IN ($placeholder)");
            $stmt->execute(array_merge([$gender], $ids));
            $updated = max($updated, $stmt->rowCount());
        }
    }

    if (array_key_exists('inStock', $patch)) {
        $inStock = !empty($patch['inStock']) ? 1 : 0;
        $stmt = $pdo->prepare("UPDATE products SET in_stock = ? WHERE id IN ($placeholder)");
        $stmt->execute(array_merge([$inStock], $ids));
        $updated = max($updated, $stmt->rowCount());
    }

    return ['updated' => $updated, 'ids' => $ids];
}

function products_normalize_input(array $input): array
{
    $images = $input['images'] ?? [];
    if (is_string($images)) {
        $images = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $images))));
    }

    $sizes = $input['sizes'] ?? DEFAULT_SIZES;
    if (is_string($sizes)) {
        $sizes = array_values(array_filter(array_map('trim', explode(',', $sizes))));
    }

    return [
        'id' => trim((string) ($input['id'] ?? '')),
        'label' => trim((string) ($input['label'] ?? '')),
        'image' => trim((string) ($input['image'] ?? '')),
        'images' => $images,
        'galleryCount' => (int) ($input['galleryCount'] ?? count($images)),
        'price' => (float) ($input['price'] ?? 0),
        'category' => trim((string) ($input['category'] ?? 'jackets')),
        'gender' => trim((string) ($input['gender'] ?? 'mens')),
        'inStock' => !empty($input['inStock']),
        'stock' => (int) ($input['stock'] ?? 0),
        'sizes' => $sizes,
    ];
}
