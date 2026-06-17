<?php
/**
 * Send a test email from the server to verify mail/SMTP setup.
 *
 * Usage:
 *   php install/test-mail.php
 *   php install/test-mail.php customer@example.com
 *   php install/test-mail.php --probe
 *   php install/test-mail.php --tls you@example.com
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

$args = array_slice($argv, 1);
$probe = in_array('--probe', $args, true);
$tryTls = in_array('--tls', $args, true);
$args = array_values(array_filter($args, static fn ($a) => !str_starts_with($a, '--')));

$cfg = mail_config();

if ($probe || $tryTls) {
    echo "==> SMTP probe\n";
    echo "    Host:   {$cfg['smtp']['host']}:{$cfg['smtp']['port']} ({$cfg['smtp']['secure']})\n";
    echo "    User:   {$cfg['smtp']['user']}\n";
    echo '    Pass:   ' . ($cfg['smtp']['pass'] !== '' ? 'set' : 'MISSING') . "\n\n";

    $probeCfg = $cfg['smtp'];
    if ($tryTls) {
        $probeCfg = array_merge($probeCfg, ['port' => 587, 'secure' => 'tls']);
        echo "    Trying TLS on port 587...\n";
    }

    $result = mail_probe_smtp($probeCfg);
    foreach ($result['steps'] as $step) {
        echo "    OK  {$step}\n";
    }

    if ($result['ok']) {
        echo "\n==> SMTP authentication OK.\n";
        if ($tryTls) {
            echo "    Update api_config.php: port 587, secure tls\n";
            echo "    MARVISPACE_SMTP_PORT=587 MARVISPACE_SMTP_SECURE=tls MARVISPACE_SMTP_PASS='...' php install/patch-api-config-mail.php\n";
        }
        exit(0);
    }

    fwrite(STDERR, "\nERROR: " . ($result['error'] ?? 'SMTP probe failed') . "\n");
    fwrite(STDERR, "\nFix checklist:\n");
    fwrite(STDERR, "  1. cPanel → Email Accounts → orders@marvispace.com → Connect Devices → copy password\n");
    fwrite(STDERR, "  2. MARVISPACE_SMTP_PASS='mailbox-password' php install/patch-api-config-mail.php\n");
    fwrite(STDERR, "  3. If SSL/465 fails: php install/test-mail.php --probe --tls\n");
    fwrite(STDERR, "  4. DNS: SPF + DKIM enabled for marvispace.com\n");
    exit(1);
}

$to = $args[0] ?? ($config['mail']['admin_notify'] ?? '');
if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "ERROR: Pass a valid recipient email or set mail.admin_notify in api config.\n");
    exit(1);
}

echo "==> Sending test email\n";
echo "    To:     {$to}\n";
echo "    From:   {$cfg['from']}\n";
echo "    SMTP:   {$cfg['smtp']['host']}:{$cfg['smtp']['port']} ({$cfg['smtp']['secure']})\n";
echo "    User:   {$cfg['smtp']['user']}\n\n";

$html = '<p>This is a test email from <strong>MARVISPACE</strong>.</p>'
    . '<p>If you received this, order confirmation emails are configured correctly.</p>'
    . '<p>From: ' . htmlspecialchars($cfg['from'], ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p>SMTP: ' . ($cfg['smtp']['pass'] !== '' ? 'authenticated' : 'PHP mail()') . '</p>';

$ok = mail_send_html($to, 'MARVISPACE mail test', $html);

if ($ok) {
    echo "==> Test email sent to {$to}\n";
    echo "    Check inbox and spam folder.\n";
    exit(0);
}

$detail = mail_last_error();
fwrite(STDERR, "ERROR: Could not send test email.\n");
if ($detail !== '') {
    fwrite(STDERR, "    Detail: {$detail}\n");
}
fwrite(STDERR, "\nRun: php install/test-mail.php --probe\n");
fwrite(STDERR, "If auth fails, reset orders@ password in cPanel and run patch-api-config-mail.php again.\n");
fwrite(STDERR, "If SSL/465 fails, try: php install/test-mail.php --probe --tls\n");
exit(1);
