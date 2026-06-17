<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once dirname(__DIR__, 2) . '/lib/admin-users-repo.php';

$admin = admin_require($pdo);
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

    if ($password !== $confirm) {
        json_error('Passwords do not match', 400);
    }

    try {
        $user = admin_user_create($pdo, $email, $password, $name);
        json_ok($user, 201);
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
