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

    if (order_has_payment_columns($pdo)) {
        $order['paymentStatus'] = $row['payment_status'] ?? 'unpaid';
        $order['paymentGateway'] = $row['payment_gateway'] ?? '';
        $order['gatewayReference'] = $row['gateway_reference'] ?? '';
        $order['gatewayTransactionId'] = $row['gateway_transaction_id'] ?? '';
        $order['paidAt'] = !empty($row['paid_at'])
            ? gmdate('c', strtotime($row['paid_at']))
            : null;
        $order['paymentError'] = $row['payment_error'] ?? null;
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

function order_has_payment_columns(PDO $pdo): bool
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }
    $stmt = $pdo->query("SHOW COLUMNS FROM orders LIKE 'payment_status'");
    $cache = (bool) $stmt->fetch();
    return $cache;
}

function order_get_by_gateway_session(PDO $pdo, string $sessionId): ?array
{
    if ($sessionId === '' || !order_has_payment_columns($pdo)) {
        return null;
    }
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE gateway_session_id = ? LIMIT 1');
    $stmt->execute([$sessionId]);
    $row = $stmt->fetch();
    return $row ? order_row_to_array($pdo, $row) : null;
}

/**
 * @return array{items: list<array<string, mixed>>, total: float}
 */
function order_normalize_items(PDO $pdo, array $rawItems, bool $decrementStock = true): array
{
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
            'SELECT id, label, image, price, discount_percent, stock, in_stock FROM products WHERE id = ? FOR UPDATE'
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

        $price = product_unit_price($product);
        $computedTotal += $price * $qty;

        if ($decrementStock) {
            $newStock = (int) $product['stock'] - $qty;
            $inStock = $newStock > 0 ? 1 : 0;
            $upd = $pdo->prepare('UPDATE products SET stock = ?, in_stock = ? WHERE id = ?');
            $upd->execute([$newStock, $inStock, $pid]);
        }

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

    return ['items' => $normalizedItems, 'total' => $computedTotal];
}

function order_store_currency(PDO $pdo): string
{
    if (!function_exists('setting_get')) {
        require_once __DIR__ . '/settings-repo.php';
    }
    return strtoupper(setting_get($pdo, 'store_currency', 'TRY'));
}

function order_new_id(): string
{
    return 'ord_' . bin2hex(random_bytes(8));
}

function order_confirm_secret(): string
{
    $config = function_exists('app_load_config') ? app_load_config() : [];
    $secret = (string) ($config['security']['confirm_secret'] ?? '');
    if ($secret === '') {
        $secret = (string) ($config['db']['pass'] ?? '');
    }
    if ($secret === '') {
        $secret = 'marvispace-order-confirm';
    }
    return $secret;
}

function order_confirm_token(string $orderId): string
{
    return hash_hmac('sha256', 'confirm:' . $orderId, order_confirm_secret());
}

function order_confirm_token_ok(string $orderId, string $token): bool
{
    if ($orderId === '' || $token === '' || !preg_match('/^[a-f0-9]{64}$/i', $token)) {
        return false;
    }
    return hash_equals(order_confirm_token($orderId), $token);
}

function order_create(PDO $pdo, array $order): array
{
    order_validate_customer($order['customer'] ?? []);

    $pdo->beginTransaction();
    try {
        $bundle = order_normalize_items($pdo, $order['items'] ?? [], true);
        $normalizedItems = $bundle['items'];
        $computedTotal = $bundle['total'];

        $customer = order_customer_from_input($order['customer'] ?? []);
        $customerJson = order_customer_to_legacy_json($customer);
        $status = 'pending';
        if (empty($order['id']) || !is_string($order['id'])) {
            $order['id'] = order_new_id();
        }

        $currency = order_store_currency($pdo);

        if (order_has_professional_columns($pdo)) {
            $paymentCols = order_has_payment_columns($pdo);
            if ($paymentCols) {
                $stmt = $pdo->prepare(
                    'INSERT INTO orders (
                        id, status, total, currency,
                        customer_email, customer_first_name, customer_last_name, customer_phone,
                        shipping_address1, shipping_address2, shipping_city, shipping_state,
                        shipping_zip, shipping_country, payment_method, payment_status, payment_gateway,
                        tax_id, customer_subscribed, customer
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $stmt->execute([
                    $order['id'],
                    $status,
                    $computedTotal,
                    $currency,
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
                    $status === 'awaiting_payment' ? 'pending' : 'unpaid',
                    $customer['payment'] === 'card' ? 'paynet' : '',
                    $customer['taxId'],
                    $customer['subscribe'] ? 1 : 0,
                    $customerJson,
                ]);
            } else {
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
                    $currency,
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
            }
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

function order_create_pending(PDO $pdo, array $order): array
{
    $order['status'] = 'awaiting_payment';
    order_validate_customer($order['customer'] ?? []);

    $pdo->beginTransaction();
    try {
        $bundle = order_normalize_items($pdo, $order['items'] ?? [], false);
        $normalizedItems = $bundle['items'];
        $computedTotal = $bundle['total'];

        $customer = order_customer_from_input($order['customer'] ?? []);
        $customerJson = order_customer_to_legacy_json($customer);
        $currency = order_store_currency($pdo);
        if (empty($order['id']) || !is_string($order['id'])) {
            $order['id'] = order_new_id();
        }

        if (!order_has_professional_columns($pdo)) {
            throw new RuntimeException('Payment gateway requires professional order schema');
        }

        if (order_has_payment_columns($pdo)) {
            $gateway = trim((string) ($order['paymentGateway'] ?? 'paynet'));
            if ($gateway === '') {
                $gateway = 'paynet';
            }
            $stmt = $pdo->prepare(
                'INSERT INTO orders (
                    id, status, total, currency,
                    customer_email, customer_first_name, customer_last_name, customer_phone,
                    shipping_address1, shipping_address2, shipping_city, shipping_state,
                    shipping_zip, shipping_country, payment_method, payment_status, payment_gateway,
                    gateway_reference, tax_id, customer_subscribed, customer
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $order['id'],
                'awaiting_payment',
                $computedTotal,
                $currency,
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
                'pending',
                $gateway,
                $order['id'],
                $customer['taxId'],
                $customer['subscribe'] ? 1 : 0,
                $customerJson,
            ]);
        } else {
            throw new RuntimeException('Payment gateway requires payment columns migration');
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

function order_update_gateway_session(PDO $pdo, string $orderId, string $sessionId, string $tokenId): void
{
    if (!order_has_payment_columns($pdo)) {
        return;
    }
    $stmt = $pdo->prepare(
        'UPDATE orders SET gateway_session_id = ?, gateway_token_id = ? WHERE id = ?'
    );
    $stmt->execute([$sessionId, $tokenId, $orderId]);
}

function order_finalize_payment(PDO $pdo, string $orderId, array $gateway, string $paymentGateway = 'paynet'): ?array
{
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
        $stmt->execute([$orderId]);
        $row = $stmt->fetch();
        if (!$row) {
            $pdo->rollBack();
            return null;
        }

        if (order_has_payment_columns($pdo) && ($row['payment_status'] ?? '') === 'paid') {
            $pdo->commit();
            return order_get($pdo, $orderId);
        }

        $itemStmt = $pdo->prepare('SELECT product_id, qty FROM order_items WHERE order_id = ?');
        $itemStmt->execute([$orderId]);
        foreach ($itemStmt->fetchAll() as $item) {
            $pid = (string) $item['product_id'];
            $qty = (int) $item['qty'];
            $pStmt = $pdo->prepare('SELECT stock, in_stock FROM products WHERE id = ? FOR UPDATE');
            $pStmt->execute([$pid]);
            $product = $pStmt->fetch();
            if (!$product || (int) $product['stock'] < $qty) {
                throw new InvalidArgumentException('Insufficient stock to complete payment');
            }
            $newStock = (int) $product['stock'] - $qty;
            $upd = $pdo->prepare('UPDATE products SET stock = ?, in_stock = ? WHERE id = ?');
            $upd->execute([$newStock, $newStock > 0 ? 1 : 0, $pid]);
        }

        if (order_has_payment_columns($pdo)) {
            $updOrder = $pdo->prepare(
                'UPDATE orders SET status = ?, payment_status = ?, payment_gateway = ?,
                 gateway_transaction_id = ?, gateway_session_id = ?, gateway_token_id = ?,
                 paid_at = CURRENT_TIMESTAMP, payment_error = NULL
                 WHERE id = ?'
            );
            $updOrder->execute([
                'pending',
                'paid',
                $paymentGateway,
                (string) ($gateway['xact_id'] ?? $gateway['transaction_id'] ?? ''),
                (string) ($gateway['session_id'] ?? ''),
                (string) ($gateway['token_id'] ?? ''),
                $orderId,
            ]);
        } else {
            $updOrder = $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?');
            $updOrder->execute(['pending', $orderId]);
        }

        $pdo->commit();
        return order_get($pdo, $orderId);
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function order_fail_payment(PDO $pdo, string $orderId, string $message): void
{
    if (!order_has_payment_columns($pdo)) {
        return;
    }
    $stmt = $pdo->prepare(
        'UPDATE orders SET payment_status = ?, status = ?, payment_error = ? WHERE id = ?'
    );
    $stmt->execute(['failed', 'cancelled', $message, $orderId]);
}

function order_update_status(PDO $pdo, string $id, string $status): ?array
{
    $allowed = ['pending', 'processing', 'completed', 'shipped', 'cancelled', 'awaiting_payment'];
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
