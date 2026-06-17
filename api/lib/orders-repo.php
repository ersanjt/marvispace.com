<?php
declare(strict_types=1);

function order_row_to_array(PDO $pdo, array $row): array
{
    $customer = json_decode($row['customer'] ?? '{}', true);
    if (!is_array($customer)) {
        $customer = [];
    }

    $stmt = $pdo->prepare('SELECT * FROM order_items WHERE order_id = ?');
    $stmt->execute([$row['id']]);
    $items = [];
    foreach ($stmt->fetchAll() as $item) {
        $items[] = [
            'id' => $item['product_id'],
            'label' => $item['label'],
            'price' => (float) $item['price'],
            'size' => $item['size'],
            'image' => $item['image'],
            'qty' => (int) $item['qty'],
        ];
    }

    return [
        'id' => $row['id'],
        'createdAt' => gmdate('c', strtotime($row['created_at'])),
        'status' => $row['status'],
        'items' => $items,
        'total' => (float) $row['total'],
        'customer' => $customer,
    ];
}

function orders_list(PDO $pdo): array
{
    $stmt = $pdo->query('SELECT * FROM orders ORDER BY created_at DESC');
    $orders = [];
    foreach ($stmt->fetchAll() as $row) {
        $orders[] = order_row_to_array($pdo, $row);
    }
    return $orders;
}

function order_get(PDO $pdo, string $id): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? order_row_to_array($pdo, $row) : null;
}

function order_create(PDO $pdo, array $order): array
{
    $pdo->beginTransaction();
    try {
        $items = $order['items'] ?? [];
        if (!$items) {
            throw new RuntimeException('Order has no items');
        }

        foreach ($items as $item) {
            $pid = $item['id'] ?? '';
            $qty = (int) ($item['qty'] ?? 0);
            if ($qty < 1) {
                continue;
            }

            $stmt = $pdo->prepare('SELECT stock, in_stock FROM products WHERE id = ? FOR UPDATE');
            $stmt->execute([$pid]);
            $product = $stmt->fetch();
            if (!$product) {
                throw new RuntimeException('Product not found: ' . $pid);
            }
            if ((int) $product['stock'] < $qty) {
                throw new RuntimeException('Insufficient stock for ' . $pid);
            }

            $newStock = (int) $product['stock'] - $qty;
            $inStock = $newStock > 0 ? 1 : 0;
            $upd = $pdo->prepare('UPDATE products SET stock = ?, in_stock = ? WHERE id = ?');
            $upd->execute([$newStock, $inStock, $pid]);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO orders (id, status, total, customer) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            $order['id'],
            $order['status'] ?? 'pending',
            (float) ($order['total'] ?? 0),
            json_encode($order['customer'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);

        $itemStmt = $pdo->prepare(
            'INSERT INTO order_items (order_id, product_id, label, size, price, qty, image)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($items as $item) {
            $itemStmt->execute([
                $order['id'],
                $item['id'] ?? '',
                $item['label'] ?? '',
                $item['size'] ?? '',
                (float) ($item['price'] ?? 0),
                (int) ($item['qty'] ?? 0),
                $item['image'] ?? '',
            ]);
        }

        $pdo->commit();
        return order_get($pdo, $order['id']) ?? $order;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function order_update_status(PDO $pdo, string $id, string $status): ?array
{
    $allowed = ['pending', 'processing', 'completed', 'shipped', 'cancelled'];
    if (!in_array($status, $allowed, true)) {
        return null;
    }

    $stmt = $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?');
    $stmt->execute([$status, $id]);
    if ($stmt->rowCount() === 0) {
        return null;
    }

    return order_get($pdo, $id);
}
