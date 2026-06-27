<?php
declare(strict_types=1);

require_once __DIR__ . '/order-customer.php';

function order_row_to_array(PDO $pdo, array $row): array
{
    $customer = order_row_customer($row);

    $stmt = $pdo->prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC');
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

    $order = [
        'id' => $row['id'],
        'createdAt' => gmdate('c', strtotime($row['created_at'])),
        'status' => $row['status'],
        'items' => $items,
        'total' => (float) $row['total'],
        'customer' => $customer,
    ];

    if (order_has_professional_columns($pdo)) {
        $order['currency'] = $row['currency'] ?? 'USD';
        $order['emailSentAt'] = !empty($row['confirmation_email_sent_at'])
            ? gmdate('c', strtotime($row['confirmation_email_sent_at']))
            : null;
    }

    return $order;
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
    order_validate_customer($order['customer'] ?? []);

    $pdo->beginTransaction();
    try {
        $rawItems = $order['items'] ?? [];
        if (!$rawItems) {
            throw new InvalidArgumentException('Order has no items');
        }

        $normalizedItems = [];
        $computedTotal = 0.0;

        foreach ($rawItems as $item) {
            $pid = (string) ($item['id'] ?? '');
            $qty = (int) ($item['qty'] ?? 0);
            $size = (string) ($item['size'] ?? '');

            if ($pid === '' || $qty < 1) {
                continue;
            }

            $stmt = $pdo->prepare(
                'SELECT id, label, image, price, stock, in_stock FROM products WHERE id = ? FOR UPDATE'
            );
            $stmt->execute([$pid]);
            $product = $stmt->fetch();
            if (!$product) {
                throw new InvalidArgumentException('Product not available');
            }
            if (!(int) $product['in_stock']) {
                throw new InvalidArgumentException('Product is out of stock: ' . $product['label']);
            }
            if ((int) $product['stock'] < $qty) {
                throw new InvalidArgumentException('Insufficient stock for ' . $product['label']);
            }

            $price = (float) $product['price'];
            $computedTotal += $price * $qty;

            $newStock = (int) $product['stock'] - $qty;
            $inStock = $newStock > 0 ? 1 : 0;
            $upd = $pdo->prepare('UPDATE products SET stock = ?, in_stock = ? WHERE id = ?');
            $upd->execute([$newStock, $inStock, $pid]);

            $normalizedItems[] = [
                'id' => $pid,
                'label' => (string) $product['label'],
                'size' => $size,
                'price' => $price,
                'qty' => $qty,
                'image' => (string) $product['image'],
            ];
        }

        if (!$normalizedItems) {
            throw new InvalidArgumentException('Order has no valid items');
        }

        $customer = order_customer_from_input($order['customer'] ?? []);
        $customerJson = order_customer_to_legacy_json($customer);
        $status = (string) ($order['status'] ?? 'pending');
        $allowed = ['pending', 'processing', 'completed', 'shipped', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            $status = 'pending';
        }

        if (order_has_professional_columns($pdo)) {
            $stmt = $pdo->prepare(
                'INSERT INTO orders (
                    id, status, total, currency,
                    customer_email, customer_first_name, customer_last_name, customer_phone,
                    shipping_address1, shipping_address2, shipping_city, shipping_state,
                    shipping_zip, shipping_country, payment_method, tax_id, customer_subscribed,
                    customer
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $order['id'],
                $status,
                $computedTotal,
                'USD',
                $customer['email'],
                $customer['firstName'],
                $customer['lastName'],
                $customer['phone'],
                $customer['address'],
                $customer['address2'],
                $customer['city'],
                $customer['state'],
                $customer['zip'],
                $customer['country'],
                $customer['payment'],
                $customer['taxId'],
                $customer['subscribe'] ? 1 : 0,
                $customerJson,
            ]);
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO orders (id, status, total, customer) VALUES (?, ?, ?, ?)'
            );
            $stmt->execute([
                $order['id'],
                $status,
                $computedTotal,
                $customerJson,
            ]);
        }

        $itemStmt = $pdo->prepare(
            'INSERT INTO order_items (order_id, product_id, label, size, price, qty, image)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($normalizedItems as $item) {
            $itemStmt->execute([
                $order['id'],
                $item['id'],
                $item['label'],
                $item['size'],
                $item['price'],
                $item['qty'],
                $item['image'],
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

function order_mark_email_sent(PDO $pdo, string $orderId, bool $customer = true, bool $admin = false): void
{
    if (!order_has_professional_columns($pdo)) {
        return;
    }

    $fields = [];
    if ($customer) {
        $fields[] = 'confirmation_email_sent_at = CURRENT_TIMESTAMP';
    }
    if ($admin) {
        $fields[] = 'admin_notified_at = CURRENT_TIMESTAMP';
    }
    if (!$fields) {
        return;
    }

    $sql = 'UPDATE orders SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$orderId]);
}
