<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once dirname(__DIR__, 2) . '/lib/admin-permissions.php';

admin_session_start();
if (empty($_SESSION['admin_id'])) {
    json_ok(['authenticated' => false]);
}

$stmt = $pdo->prepare(
    'SELECT id, email, name, role, permissions, created_at FROM admin_users WHERE id = ? LIMIT 1'
);
$stmt->execute([(int) $_SESSION['admin_id']]);
$row = $stmt->fetch();

if (!$row) {
    json_ok(['authenticated' => false]);
}

$public = admin_user_public($row);
json_ok([
    'authenticated' => true,
    'email' => $public['email'],
    'name' => $public['name'],
    'role' => $public['role'],
    'isOwner' => $public['isOwner'],
    'permissions' => $public['permissions'],
]);
