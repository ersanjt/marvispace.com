<?php
/**
 * Ensure api_config.php has admin recovery bcrypt hash.
 * Run on server: php install/patch-api-config.php
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
$recoveryCode = getenv('MARVISPACE_RECOVERY_CODE') ?: 'MarviRecover2026!';

if (!empty($config['admin']['recovery_bcrypt'])) {
    echo "==> Recovery hash already configured.\n";
    exit(0);
}

$config['admin'] = $config['admin'] ?? [];
$config['admin']['recovery_bcrypt'] = password_hash($recoveryCode, PASSWORD_BCRYPT);

$export = var_export($config, true);
$content = "<?php\nreturn {$export};\n";

if (!is_writable($configPath)) {
    fwrite(STDERR, "ERROR: Cannot write {$configPath}\n");
    exit(1);
}

file_put_contents($configPath, $content);
echo "==> Recovery code configured (default: MarviRecover2026! unless MARVISPACE_RECOVERY_CODE was set).\n";
