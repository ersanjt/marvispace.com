<?php
declare(strict_types=1);

const CART_COOKIE = 'marvispace_cart';
const CART_COOKIE_DAYS = 30;

function cart_session_id(): string
{
    $id = trim((string) ($_COOKIE[CART_COOKIE] ?? ''));
    if ($id !== '' && preg_match('/^[a-f0-9]{32}$/', $id)) {
        return $id;
    }

    $id = bin2hex(random_bytes(16));
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

    setcookie(CART_COOKIE, $id, [
        'expires' => time() + (CART_COOKIE_DAYS * 86400),
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    return $id;
}

function cart_ensure_session(PDO $pdo, string $sessionId): void
{
    $stmt = $pdo->prepare('INSERT IGNORE INTO cart_sessions (id) VALUES (?)');
    $stmt->execute([$sessionId]);
}

function cart_list(PDO $pdo, string $sessionId): array
{
    cart_ensure_session($pdo, $sessionId);

    $stmt = $pdo->prepare(
        'SELECT product_id, label, size, price, qty, image
         FROM cart_items WHERE session_id = ? ORDER BY id ASC'
    );
    $stmt->execute([$sessionId]);

    $items = [];
    foreach ($stmt->fetchAll() as $row) {
        $items[] = [
            'id' => $row['product_id'],
            'label' => $row['label'],
            'size' => $row['size'],
            'price' => (float) $row['price'],
            'qty' => (int) $row['qty'],
            'image' => $row['image'] ?? '',
        ];
    }

    return $items;
}

function cart_replace(PDO $pdo, string $sessionId, array $items): array
{
    cart_ensure_session($pdo, $sessionId);

    $pdo->beginTransaction();
    try {
        $del = $pdo->prepare('DELETE FROM cart_items WHERE session_id = ?');
        $del->execute([$sessionId]);

        $ins = $pdo->prepare(
            'INSERT INTO cart_items (session_id, product_id, label, size, price, qty, image)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );

        foreach ($items as $item) {
            $qty = (int) ($item['qty'] ?? 0);
            if ($qty < 1) {
                continue;
            }

            $ins->execute([
                $sessionId,
                (string) ($item['id'] ?? ''),
                (string) ($item['label'] ?? ''),
                (string) ($item['size'] ?? ''),
                (float) ($item['price'] ?? 0),
                $qty,
                (string) ($item['image'] ?? ''),
            ]);
        }

        $pdo->prepare('UPDATE cart_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            ->execute([$sessionId]);

        $pdo->commit();
        return cart_list($pdo, $sessionId);
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function cart_clear(PDO $pdo, string $sessionId): void
{
    $stmt = $pdo->prepare('DELETE FROM cart_items WHERE session_id = ?');
    $stmt->execute([$sessionId]);
}
