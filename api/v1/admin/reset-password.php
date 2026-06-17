<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';

if ($method !== 'POST') {
    json_error('Method not allowed', 405);
}

$body = read_json_body();
$email = (string) ($body['email'] ?? '');
$recoveryCode = (string) ($body['recoveryCode'] ?? '');
$newPassword = (string) ($body['newPassword'] ?? '');

if ($newPassword !== (string) ($body['confirmPassword'] ?? '')) {
    json_error('New passwords do not match', 400);
}

$config = app_config();
if (empty($config['admin']['recovery_bcrypt'])) {
    json_error('Password recovery is not configured on the server. Run install/patch-api-config.php', 503);
}

if (!admin_reset_password($pdo, $config, $email, $recoveryCode, $newPassword)) {
    json_error('Invalid email or recovery code', 401);
}

json_ok(['email' => strtolower(trim($email)), 'reset' => true]);
