<?php
declare(strict_types=1);

const ADMIN_PERMISSION_KEYS = ['dashboard', 'products', 'orders', 'users', 'settings'];

/** @return array<string, string> */
function admin_permission_labels(): array
{
    return [
        'dashboard' => 'Dashboard',
        'products' => 'Products',
        'orders' => 'Orders',
        'users' => 'Users',
        'settings' => 'Settings',
    ];
}

function admin_is_owner(array $user): bool
{
    return ($user['role'] ?? 'admin') === 'owner';
}

/** @return array<string, bool> */
function admin_default_permissions(): array
{
    return [
        'dashboard' => true,
        'products' => false,
        'orders' => false,
        'users' => false,
        'settings' => false,
    ];
}

/** @return array<string, bool> */
function admin_full_permissions(): array
{
    $perms = [];
    foreach (ADMIN_PERMISSION_KEYS as $key) {
        $perms[$key] = true;
    }
    return $perms;
}

/** @return array<string, bool> */
function admin_permissions_from_row(array $row): array
{
    if (admin_is_owner($row)) {
        return admin_full_permissions();
    }

    $defaults = admin_default_permissions();

    if (!empty($row['permissions'])) {
        $decoded = json_decode((string) $row['permissions'], true);
        if (is_array($decoded)) {
            foreach (ADMIN_PERMISSION_KEYS as $key) {
                if (array_key_exists($key, $decoded)) {
                    $defaults[$key] = !empty($decoded[$key]);
                }
            }
        }
    } else {
        // Legacy admin row before permissions column
        $defaults['products'] = true;
        $defaults['orders'] = true;
        $defaults['settings'] = true;
    }

    if (!$defaults['dashboard']) {
        $defaults['dashboard'] = true;
    }

    return $defaults;
}

/** @param array<string, mixed>|null $input @return array<string, bool> */
function admin_normalize_permissions_input(?array $input): array
{
    $out = admin_default_permissions();
    if (is_array($input)) {
        foreach (ADMIN_PERMISSION_KEYS as $key) {
            if (array_key_exists($key, $input)) {
                $out[$key] = !empty($input[$key]);
            }
        }
    }
    if (!$out['dashboard']) {
        $out['dashboard'] = true;
    }
    return $out;
}

function admin_has_permission(array $user, string $permission): bool
{
    if (admin_is_owner($user)) {
        return true;
    }
    $perms = admin_permissions_from_row($user);
    return !empty($perms[$permission]);
}

function admin_has_any_permission(array $user, array $permissions): bool
{
    foreach ($permissions as $permission) {
        if (admin_has_permission($user, $permission)) {
            return true;
        }
    }
    return false;
}

function admin_permissions_json(array $permissions): string
{
    $out = admin_normalize_permissions_input($permissions);
    return json_encode($out, JSON_UNESCAPED_UNICODE);
}

/** @return array<string, mixed> */
function admin_user_public(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'email' => $row['email'],
        'name' => $row['name'] ?? '',
        'role' => $row['role'] ?? 'admin',
        'isOwner' => admin_is_owner($row),
        'permissions' => admin_permissions_from_row($row),
        'createdAt' => gmdate('c', strtotime($row['created_at'])),
    ];
}

function admin_require_permission(PDO $pdo, string $permission): array
{
    $user = admin_require($pdo);
    if (!admin_has_permission($user, $permission)) {
        json_error('You do not have access to this section', 403);
    }
    return $user;
}
