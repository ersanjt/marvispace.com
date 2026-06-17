<?php
/**
 * Send a test email from the server to verify mail/SMTP setup.
 *
 * Usage:
 *   php install/test-mail.php
 *   php install/test-mail.php customer@example.com
 */
declare(strict_types=1);

$repoRoot = dirname(__DIR__);
$configPath = '/home/marvispace/api_config.php';
if (!is_file($configPath)) {
    $configPath = $repoRoot . '/api/config.local.php';
}

if (!is_file($configPath)) {
    fwrite(STDERR, "ERROR: api config not found.\n");
    exit(1);
}

$config = require $configPath;

function app_config(): array
{
    global $config;
    return $config;
}

require_once $repoRoot . '/api/lib/mail.php';

$to = $argv[1] ?? ($config['mail']['admin_notify'] ?? '');
if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "ERROR: Pass a valid recipient email or set mail.admin_notify in api config.\n");
    exit(1);
}

$cfg = mail_config();
$html = '<p>This is a test email from <strong>MARVISPACE</strong>.</p>'
    . '<p>If you received this, order confirmation emails are configured correctly.</p>'
    . '<p>From: ' . htmlspecialchars($cfg['from'], ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p>SMTP: ' . ($cfg['smtp']['pass'] !== '' ? 'authenticated' : 'PHP mail()') . '</p>';

$ok = mail_send_html($to, 'MARVISPACE mail test', $html);

if ($ok) {
    echo "==> Test email sent to {$to}\n";
    exit(0);
}

fwrite(STDERR, "ERROR: Could not send test email. Check SMTP password or PHP mail logs.\n");
exit(1);
