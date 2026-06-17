<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $body = read_json_body();
    $email = (string) ($body['email'] ?? '');
    $password = (string) ($body['password'] ?? '');

    if (!admin_login($pdo, $email, $password)) {
        json_error('Invalid email or password', 401);
    }

    json_ok(['email' => strtolower(trim($email))]);
}

json_error('Method not allowed', 405);
