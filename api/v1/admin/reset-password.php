<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';

if ($method !== 'POST') {
    json_error('Method not allowed', 405);
}

$body = read_json_body();
$email = (string) ($body['email'] ?? '');
$recoveryCode = (string) ($body['recoveryCode'] ?? $body['recovery_code'] ?? '');
$newPassword = (string) ($body['newPassword'] ?? $body['new_password'] ?? '');

if ($newPassword !== (string) ($body['confirmPassword'] ?? $body['confirm_password'] ?? '')) {
    json_error('New passwords do not match', 400);
}

$config = app_config();
$result = admin_reset_password_result($pdo, $config, $email, $recoveryCode, $newPassword);

if (!$result['ok']) {
    json_error($result['error'] ?? 'Could not reset password', $result['status'] ?? 400);
}

json_ok(['email' => $result['email'] ?? strtolower(trim($email)), 'reset' => true]);
