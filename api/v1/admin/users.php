<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once dirname(__DIR__, 2) . '/lib/admin-users-repo.php';

$admin = admin_require_permission($pdo, 'users');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$id = (int) ($_GET['id'] ?? 0);

if ($method === 'GET') {
    json_ok(admin_users_list($pdo));
}

if ($method === 'POST') {
    $body = read_json_body();
    $email = (string) ($body['email'] ?? '');
    $password = (string) ($body['password'] ?? '');
    $name = (string) ($body['name'] ?? '');
    $confirm = (string) ($body['confirmPassword'] ?? $body['confirm_password'] ?? '');
    $permissions = isset($body['permissions']) && is_array($body['permissions'])
        ? $body['permissions']
        : null;

    if ($password !== $confirm) {
        json_error('Passwords do not match', 400);
    }

    try {
        $user = admin_user_create($pdo, $email, $password, $name, $permissions);
        json_ok($user, 201);
    } catch (InvalidArgumentException $e) {
        json_error($e->getMessage(), 400);
    }
}

if ($method === 'PATCH' || $method === 'PUT') {
    if ($id <= 0) {
        json_error('User id required', 400);
    }

    $body = read_json_body();
    $permissions = array_key_exists('permissions', $body) && is_array($body['permissions'])
        ? $body['permissions']
        : null;
    $name = array_key_exists('name', $body) ? (string) $body['name'] : null;

    try {
        $user = admin_user_update($pdo, $id, $permissions, $name);
        if (!$user) {
            json_error('User not found', 404);
        }
        json_ok($user);
    } catch (InvalidArgumentException $e) {
        json_error($e->getMessage(), 400);
    }
}

if ($method === 'DELETE') {
    if ($id <= 0) {
        json_error('User id required', 400);
    }

    if (!admin_user_delete($pdo, $id, (int) $admin['id'])) {
        json_error('Cannot delete this user', 400);
    }

    json_ok(['deleted' => true]);
}

json_error('Method not allowed', 405);
