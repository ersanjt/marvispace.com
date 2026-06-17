<?php
/**
 * Provision MARVISPACE database on cPanel (connect, migrate, seed).
 *
 * Option A — use existing cPanel database credentials:
 *   MARVISPACE_DB_NAME='marvispace_store' \
 *   MARVISPACE_DB_USER='marvispace_storeuser' \
 *   MARVISPACE_DB_PASS='your-db-password' \
 *   php install/provision-database.php
 *
 * Option B — auto-create via UAPI (run as root on WHM):
 *   bash install/setup-server.sh
 */
declare(strict_types=1);

$repoRoot = dirname(__DIR__);
$configPath = '/home/marvispace/api_config.php';
if (!is_file($configPath)) {
    $configPath = $repoRoot . '/api/config.local.php';
}

$dbName = getenv('MARVISPACE_DB_NAME') ?: '';
$dbUser = getenv('MARVISPACE_DB_USER') ?: '';
$dbPass = getenv('MARVISPACE_DB_PASS') ?: '';
$dbHost = getenv('MARVISPACE_DB_HOST') ?: 'localhost';

if ($dbName === '' || $dbUser === '' || $dbPass === '') {
    if (is_file($configPath)) {
        $existing = require $configPath;
        $dbName = $dbName ?: (string) ($existing['db']['name'] ?? '');
        $dbUser = $dbUser ?: (string) ($existing['db']['user'] ?? '');
        $dbPass = $dbPass ?: (string) ($existing['db']['pass'] ?? '');
        $dbHost = $dbHost ?: (string) ($existing['db']['host'] ?? 'localhost');
    }
}

if ($dbName === '' || $dbUser === '' || $dbPass === '') {
    fwrite(STDERR, "ERROR: Set MARVISPACE_DB_NAME, MARVISPACE_DB_USER, MARVISPACE_DB_PASS\n");
    fwrite(STDERR, "       Or create api_config.php first.\n");
    exit(1);
}

echo "==> Testing database connection...\n";
echo "    Host: {$dbHost}\n";
echo "    Database: {$dbName}\n";
echo "    User: {$dbUser}\n";

try {
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $dbHost, $dbName);
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $pdo->query('SELECT 1');
} catch (Throwable $e) {
    fwrite(STDERR, "ERROR: Cannot connect — " . $e->getMessage() . "\n");
    fwrite(STDERR, "       In cPanel: MySQL Databases → add user to database with ALL PRIVILEGES.\n");
    exit(1);
}

$config = is_file($configPath) ? require $configPath : [];
$config['db'] = [
    'host' => $dbHost,
    'name' => $dbName,
    'user' => $dbUser,
    'pass' => $dbPass,
];
$config['site'] = $config['site'] ?? ['url' => 'https://marvispace.com'];
$config['admin'] = $config['admin'] ?? [];
$config['mail'] = $config['mail'] ?? [
    'from' => 'orders@marvispace.com',
    'from_name' => 'MARVISPACE Orders',
    'support' => 'support@marvispace.com',
    'admin_notify' => getenv('MARVISPACE_ADMIN_EMAIL') ?: '',
    'smtp' => [
        'host' => 'mail.marvispace.com',
        'port' => 465,
        'secure' => 'ssl',
        'user' => 'orders@marvispace.com',
        'pass' => '',
    ],
];

$export = var_export($config, true);
$content = "<?php\nreturn {$export};\n";

if (!is_writable(dirname($configPath)) && !is_file($configPath)) {
    fwrite(STDERR, "ERROR: Cannot write config to {$configPath}\n");
    exit(1);
}

file_put_contents($configPath, $content);
@chmod($configPath, 0640);
echo "==> Updated {$configPath}\n";

passthru('php ' . escapeshellarg($repoRoot . '/install/migrate.php'), $migrateCode);
if ($migrateCode !== 0) {
    exit($migrateCode);
}

$count = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
if ($count === 0) {
    echo "==> Seeding catalog + admin user...\n";
    passthru('php ' . escapeshellarg($repoRoot . '/install/seed.php'), $seedCode);
    if ($seedCode !== 0) {
        exit($seedCode);
    }
} else {
    echo "==> Products already seeded ({$count} items). Skipping seed.\n";
}

passthru('php ' . escapeshellarg($repoRoot . '/install/patch-api-config.php'), $patchCode);
passthru('php ' . escapeshellarg($repoRoot . '/install/patch-api-config-mail.php'), $mailCode);

echo "\n==> Database provision complete.\n";
echo "    Verify: curl -s https://marvispace.com/api/v1/health.php\n";
