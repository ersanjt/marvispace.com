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
