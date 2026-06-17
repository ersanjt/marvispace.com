<?php
/**
 * Ensure api_config.php has mail settings for order notifications.
 *
 * Run on server:
 *   php install/patch-api-config-mail.php
 *
 * With SMTP password (recommended on cPanel):
 *   MARVISPACE_SMTP_PASS='your-orders-mailbox-password' php install/patch-api-config-mail.php
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
$adminEmail = getenv('MARVISPACE_ADMIN_EMAIL') ?: 'ersanjahedtabrizi@gmail.com';
$smtpPass = getenv('MARVISPACE_SMTP_PASS') ?: (string) ($config['mail']['smtp']['pass'] ?? '');

$config['mail'] = array_merge([
    'from' => 'orders@marvispace.com',
    'from_name' => 'MARVISPACE Orders',
    'support' => 'support@marvispace.com',
    'admin_notify' => $adminEmail,
    'smtp' => [
        'host' => 'mail.marvispace.com',
        'port' => 465,
        'secure' => 'ssl',
        'user' => 'orders@marvispace.com',
        'pass' => '',
    ],
], $config['mail'] ?? []);

$config['mail']['from'] = $config['mail']['from'] ?: 'orders@marvispace.com';
$config['mail']['support'] = $config['mail']['support'] ?: 'support@marvispace.com';
$config['mail']['admin_notify'] = $config['mail']['admin_notify'] ?: $adminEmail;
$config['mail']['smtp'] = array_merge([
    'host' => 'mail.marvispace.com',
    'port' => 465,
    'secure' => 'ssl',
    'user' => $config['mail']['from'],
    'pass' => '',
], $config['mail']['smtp'] ?? []);

if ($smtpPass !== '') {
    $config['mail']['smtp']['pass'] = $smtpPass;
    $config['mail']['smtp']['user'] = $config['mail']['smtp']['user'] ?: $config['mail']['from'];
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
echo "    SMTP:          {$config['mail']['smtp']['host']}:{$config['mail']['smtp']['port']}\n";
echo '    SMTP auth:     ' . ($config['mail']['smtp']['pass'] !== '' ? 'configured' : 'not set (uses PHP mail())') . "\n";
