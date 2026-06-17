<?php
declare(strict_types=1);

function admin_user_row(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'email' => $row['email'],
        'name' => $row['name'] ?? '',
        'createdAt' => gmdate('c', strtotime($row['created_at'])),
    ];
}

function admin_users_list(PDO $pdo): array
{
    $stmt = $pdo->query('SELECT id, email, name, created_at FROM admin_users ORDER BY created_at ASC');
    $users = [];
    foreach ($stmt->fetchAll() as $row) {
        $users[] = admin_user_row($row);
    }
    return $users;
}

function admin_user_create(PDO $pdo, string $email, string $password, string $name = ''): array
{
    $email = strtolower(trim($email));
    $name = trim($name);

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Valid email is required');
    }

    if (strlen($password) < 8) {
        throw new InvalidArgumentException('Password must be at least 8 characters');
    }

    $check = $pdo->prepare('SELECT id FROM admin_users WHERE email = ? LIMIT 1');
    $check->execute([$email]);
    if ($check->fetch()) {
        throw new InvalidArgumentException('This email is already registered');
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO admin_users (email, name, password_hash) VALUES (?, ?, ?)');
    $stmt->execute([$email, $name, $hash]);

    $id = (int) $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT id, email, name, created_at FROM admin_users WHERE id = ?');
    $row->execute([$id]);
    $user = $row->fetch();

    return $user ? admin_user_row($user) : ['id' => $id, 'email' => $email, 'name' => $name, 'createdAt' => gmdate('c')];
}

function admin_user_delete(PDO $pdo, int $id, int $currentAdminId): bool
{
    if ($id <= 0 || $id === $currentAdminId) {
        return false;
    }

    $stmt = $pdo->prepare('DELETE FROM admin_users WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
}
