<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/lib/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    json_error('Method not allowed', 405);
}

$body = read_json_body();
$email = strtolower(trim((string) ($body['email'] ?? '')));

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('A valid email address is required.', 400);
}

if (strlen($email) > 255) {
    json_error('Email address is too long.', 400);
}

try {
    $stmt = $pdo->prepare(
        'INSERT INTO newsletter_subscribers (email, source)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE email = email'
    );
    $stmt->execute([$email, 'footer']);
} catch (Throwable $e) {
    error_log('MARVISPACE newsletter: ' . $e->getMessage());
    json_error('Could not subscribe right now. Please try again later.', 500);
}

json_ok(['subscribed' => true], 201);
