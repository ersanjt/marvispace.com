<?php
declare(strict_types=1);

require_once __DIR__ . '/admin-permissions.php';

function admin_users_list(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT id, email, name, role, permissions, created_at FROM admin_users ORDER BY created_at ASC'
    );
    $users = [];
    foreach ($stmt->fetchAll() as $row) {
        $users[] = admin_user_public($row);
    }
    return $users;
}

/** @param array<string, mixed>|null $permissionsInput */
function admin_user_create(PDO $pdo, string $email, string $password, string $name = '', ?array $permissionsInput = null): array
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

    $permissions = admin_normalize_permissions_input($permissionsInput);
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare(
        'INSERT INTO admin_users (email, name, password_hash, role, permissions) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$email, $name, $hash, 'admin', admin_permissions_json($permissions)]);

    $id = (int) $pdo->lastInsertId();
    $row = $pdo->prepare(
        'SELECT id, email, name, role, permissions, created_at FROM admin_users WHERE id = ?'
    );
    $row->execute([$id]);
    $user = $row->fetch();

    return $user ? admin_user_public($user) : [
        'id' => $id,
        'email' => $email,
        'name' => $name,
        'role' => 'admin',
        'isOwner' => false,
        'permissions' => $permissions,
        'createdAt' => gmdate('c'),
    ];
}

/** @param array<string, mixed>|null $permissionsInput */
function admin_user_update(PDO $pdo, int $id, ?array $permissionsInput = null, ?string $name = null): ?array
{
    if ($id <= 0) {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT id, email, name, role, permissions, created_at FROM admin_users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }

    if (admin_is_owner($row)) {
        throw new InvalidArgumentException('Owner account permissions cannot be changed');
    }

    $fields = [];
    $params = [];

    if ($name !== null) {
        $fields[] = 'name = ?';
        $params[] = trim($name);
    }

    if ($permissionsInput !== null) {
        $permissions = admin_normalize_permissions_input($permissionsInput);
        $fields[] = 'permissions = ?';
        $params[] = admin_permissions_json($permissions);
    }

    if (!$fields) {
        return admin_user_public($row);
    }

    $params[] = $id;
    $upd = $pdo->prepare('UPDATE admin_users SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $upd->execute($params);

    $stmt->execute([$id]);
    $updated = $stmt->fetch();
    return $updated ? admin_user_public($updated) : null;
}

function admin_user_delete(PDO $pdo, int $id, int $currentAdminId): bool
{
    if ($id <= 0 || $id === $currentAdminId) {
        return false;
    }

    $stmt = $pdo->prepare('SELECT id, role FROM admin_users WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        return false;
    }

    $currentStmt = $pdo->prepare('SELECT id, role FROM admin_users WHERE id = ? LIMIT 1');
    $currentStmt->execute([$currentAdminId]);
    $current = $currentStmt->fetch();
    if (!$current) {
        return false;
    }

    // Owners can remove other owners only when at least one owner remains.
    if (admin_is_owner($row)) {
        if (!admin_is_owner($current)) {
            return false;
        }
        $ownerCount = (int) $pdo->query(
            "SELECT COUNT(*) FROM admin_users WHERE role = 'owner'"
        )->fetchColumn();
        if ($ownerCount <= 1) {
            return false;
        }
    }

    $del = $pdo->prepare('DELETE FROM admin_users WHERE id = ?');
    $del->execute([$id]);
    return $del->rowCount() > 0;
}
