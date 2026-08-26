<?php
/**
 * Ensure api_config.php has mail settings for order + contact emails.
 *
 * On the cPanel server itself, use localhost (public SMTP host often times out):
 *
 *   MARVISPACE_SMTP_USER='support@marvispace.com' \
 *   MARVISPACE_SMTP_PASS='your-NEW-mailbox-password' \
 *   php install/patch-api-config-mail.php
 *
 * Explicit localhost (same as default):
 *   MARVISPACE_SMTP_HOST=localhost MARVISPACE_SMTP_PORT=587 MARVISPACE_SMTP_SECURE=tls \
 *   MARVISPACE_SMTP_USER='support@marvispace.com' MARVISPACE_SMTP_PASS='...' \
 *   php install/patch-api-config-mail.php
 */
declare(strict_types=1);

$configPath = '/home/marvispace/api_config.php';
if (!is_file($configPath)) {
    $configPath = dirname(__DIR__) . '/api/config.local.php';
}

if (!is_file($configPath)) {
    fwrite(STDERR, "ERROR: Config not found.\n");
    exit(1);
}

$config = require $configPath;

function app_config(): array
{
    global $config;
    return $config;
}

require_once dirname(__DIR__) . '/api/lib/mail.php';

$adminEmail = getenv('MARVISPACE_ADMIN_EMAIL') ?: '';
$smtpPass = getenv('MARVISPACE_SMTP_PASS') ?: (string) ($config['mail']['smtp']['pass'] ?? '');
$smtpUser = getenv('MARVISPACE_SMTP_USER') ?: (string) ($config['mail']['smtp']['user'] ?? '');

if ($adminEmail === '') {
    $adminEmail = trim((string) ($config['mail']['admin_notify'] ?? ''));
}

if ($adminEmail === '' && !empty($config['db'])) {
    try {
        require_once dirname(__DIR__) . '/api/lib/db.php';
        $pdo = db_connect($config['db']);
        $row = $pdo->query('SELECT email FROM admin_users ORDER BY id ASC LIMIT 1')->fetch();
        if ($row && !empty($row['email'])) {
            $adminEmail = (string) $row['email'];
        }
    } catch (Throwable $e) {
        /* ignore */
    }
}

$recommended = mail_recommended_smtp();
$smtpHost = getenv('MARVISPACE_SMTP_HOST') ?: '';
$smtpPort = getenv('MARVISPACE_SMTP_PORT') ? (int) getenv('MARVISPACE_SMTP_PORT') : 0;
$smtpSecure = getenv('MARVISPACE_SMTP_SECURE') ?: '';

if ($smtpHost === '') {
    $smtpHost = (string) ($config['mail']['smtp']['host'] ?? $recommended['host']);
}
if ($smtpPort <= 0) {
    $smtpPort = (int) ($config['mail']['smtp']['port'] ?? $recommended['port']);
}
if ($smtpSecure === '') {
    $smtpSecure = (string) ($config['mail']['smtp']['secure'] ?? $recommended['secure']);
}

$forcePublic = (string) (getenv('MARVISPACE_SMTP_FORCE_PUBLIC') ?: '') === '1';
$publicHosts = ['marvispace.com', 'mail.marvispace.com', 'www.marvispace.com'];

// From the server itself, public SMTP host often times out. Use local Exim unless forced.
if (!$forcePublic && in_array(strtolower($smtpHost), $publicHosts, true)) {
    fwrite(STDERR, "NOTE: {$smtpHost} from this server often times out — using localhost:587 tls (cPanel local SMTP).\n");
    $smtpHost = 'localhost';
    $smtpPort = 587;
    $smtpSecure = 'tls';
}

if (!mail_host_resolves($smtpHost)) {
    fwrite(STDERR, "NOTE: {$smtpHost} does not resolve — using localhost:587 (cPanel local mail).\n");
    $smtpHost = 'localhost';
    $smtpPort = 587;
    $smtpSecure = 'tls';
}

$smtpFrom = getenv('MARVISPACE_MAIL_FROM') ?: '';
if ($smtpFrom === '') {
    $smtpFrom = $smtpUser !== '' ? $smtpUser : (string) ($config['mail']['from'] ?? 'support@marvispace.com');
}

$config['mail'] = array_merge([
    'from' => 'support@marvispace.com',
    'from_name' => 'MARVISPACE',
    'support' => 'support@marvispace.com',
    'admin_notify' => $adminEmail !== '' ? $adminEmail : 'support@marvispace.com',
    'smtp' => [
        'host' => $recommended['host'],
        'port' => $recommended['port'],
        'secure' => $recommended['secure'],
        'user' => 'support@marvispace.com',
        'pass' => '',
    ],
], $config['mail'] ?? []);

$config['mail']['from'] = $smtpFrom !== '' ? $smtpFrom : ($config['mail']['from'] ?: 'support@marvispace.com');
$config['mail']['support'] = $config['mail']['support'] ?: 'support@marvispace.com';
$config['mail']['admin_notify'] = $config['mail']['admin_notify'] ?: ($adminEmail !== '' ? $adminEmail : 'support@marvispace.com');

$existingSmtp = $config['mail']['smtp'] ?? [];
$config['mail']['smtp'] = array_merge($existingSmtp, [
    'host' => $smtpHost,
    'port' => $smtpPort > 0 ? $smtpPort : 587,
    'secure' => $smtpSecure !== '' ? $smtpSecure : 'tls',
    'user' => $smtpUser !== '' ? $smtpUser : ($existingSmtp['user'] ?? $config['mail']['from']),
    'pass' => $smtpPass !== '' ? $smtpPass : (string) ($existingSmtp['pass'] ?? ''),
]);

if ($config['mail']['smtp']['user'] === '') {
    $config['mail']['smtp']['user'] = $config['mail']['from'];
}

$export = var_export($config, true);
$content = "<?php\nreturn {$export};\n";

if (!is_writable($configPath)) {
    fwrite(STDERR, "ERROR: Cannot write {$configPath}\n");
    exit(1);
}

file_put_contents($configPath, $content);

echo "==> Mail settings updated in API config.\n";
echo "    From:          {$config['mail']['from']}\n";
echo "    Support:       {$config['mail']['support']}\n";
echo "    Admin notify:  {$config['mail']['admin_notify']}\n";
echo "    SMTP:          {$config['mail']['smtp']['host']}:{$config['mail']['smtp']['port']} ({$config['mail']['smtp']['secure']})\n";
echo '    SMTP auth:     ' . ($config['mail']['smtp']['pass'] !== '' ? 'configured' : 'not set (uses PHP mail())') . "\n";

if (!mail_host_resolves('mail.marvispace.com')) {
    echo "\n    Tip: add DNS A record mail.marvispace.com → server IP, or keep localhost for cPanel.\n";
}

if ($config['mail']['smtp']['pass'] === '') {
    echo "\n    WARNING: SMTP password not set. Outbound email will fail.\n";
    echo "    Use the password from cPanel → Email Accounts → support@ → Connect Devices:\n";
    echo "    MARVISPACE_SMTP_USER='support@marvispace.com' MARVISPACE_SMTP_PASS='...' \\\n";
    echo "      MARVISPACE_SMTP_HOST='marvispace.com' MARVISPACE_SMTP_PORT=465 MARVISPACE_SMTP_SECURE=ssl \\\n";
    echo "      php install/patch-api-config-mail.php\n";
} else {
    echo "\n    Test:  php install/test-mail.php --probe && php install/test-mail.php\n";
}
