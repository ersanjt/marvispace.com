<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/lib/bootstrap.php';
require_once dirname(__DIR__) . '/lib/contact-mail.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    json_error('Method not allowed', 405);
}

$body = read_json_body();

// Honeypot — bots fill hidden "website" field.
$honeypot = trim((string) ($body['website'] ?? ''));
if ($honeypot !== '') {
    json_ok(['sent' => true], 201);
}

$name = trim((string) ($body['name'] ?? ''));
$email = strtolower(trim((string) ($body['email'] ?? '')));
$message = trim((string) ($body['message'] ?? ''));

if ($name === '' || mb_strlen($name) < 2) {
    json_error('Please enter your name.', 400);
}
if (mb_strlen($name) > 120) {
    json_error('Name is too long.', 400);
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Please enter a valid email address.', 400);
}
if (strlen($email) > 255) {
    json_error('Email address is too long.', 400);
}
if ($message === '' || mb_strlen($message) < 5) {
    json_error('Please enter a message.', 400);
}
if (mb_strlen($message) > 5000) {
    json_error('Message is too long.', 400);
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
if (contact_mail_rate_limited($ip)) {
    json_error('Too many messages. Please try again in a few minutes.', 429);
}

if (!contact_mail_send($name, $email, $message)) {
    $detail = mail_last_error();
    error_log('MARVISPACE contact form failed: ' . $detail);
    json_error('Could not send your message right now. Please email support@marvispace.com.', 500);
}

json_ok(['sent' => true], 201);
