<?php
/**
 * Ensure api_config.php recovery bcrypt matches MARVISPACE_RECOVERY_CODE (default: MarviRecover2026!).
 * Re-hashes automatically when the stored hash no longer verifies.
 *
 * Run on server:
 *   php install/patch-api-config.php
 *
 * Force re-hash:
 *   MARVISPACE_FORCE_RECOVERY=1 php install/patch-api-config.php
 *
 * Custom code:
 *   MARVISPACE_RECOVERY_CODE='YourCode' php install/patch-api-config.php
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
$force = getenv('MARVISPACE_FORCE_RECOVERY') === '1';
$existing = (string) ($config['admin']['recovery_bcrypt'] ?? '');

if (!$force && $existing !== '' && password_verify($recoveryCode, $existing)) {
    echo "==> Recovery hash OK for code: {$recoveryCode}\n";
    exit(0);
}

if ($existing !== '' && !$force) {
    echo "==> Stored recovery hash does not match '{$recoveryCode}'. Re-hashing...\n";
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
echo "==> Recovery code configured: {$recoveryCode}\n";
