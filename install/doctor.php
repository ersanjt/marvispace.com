<?php
/**
 * MARVISPACE server diagnostics (run on cPanel as root or marvispace user).
 *
 *   php install/doctor.php
 */
declare(strict_types=1);

$repoRoot = dirname(__DIR__);
echo "==> MARVISPACE doctor\n";
echo "    PHP: " . PHP_VERSION . "\n";
echo "    Repo: {$repoRoot}\n\n";

$configPath = '/home/marvispace/api_config.php';
if (!is_file($configPath)) {
    $configPath = $repoRoot . '/api/config.local.php';
}

if (!is_file($configPath)) {
    echo "ERROR: api_config.php not found.\n";
    exit(1);
}

echo "==> Config: {$configPath}\n";
$config = require $configPath;
$db = $config['db'] ?? [];
echo "    DB host: " . ($db['host'] ?? 'localhost') . "\n";
echo "    DB name: " . ($db['name'] ?? '(missing)') . "\n";
echo "    DB user: " . ($db['user'] ?? '(missing)') . "\n\n";

$requiredFiles = [
    'api/lib/bootstrap.php',
    'api/lib/db.php',
    'api/lib/order-customer.php',
    'api/lib/orders-repo.php',
    'install/migrate.php',
    'install/migrations/001_initial.sql',
];

echo "==> Required files\n";
$missing = false;
foreach ($requiredFiles as $rel) {
    $path = $repoRoot . '/' . $rel;
    $ok = is_file($path);
    echo '    ' . ($ok ? 'OK' : 'MISSING') . "  {$rel}\n";
    if (!$ok) {
        $missing = true;
    }
}

if ($missing) {
    echo "\nERROR: Run git pull in the repository.\n";
    exit(1);
}

echo "\n==> Database connection\n";
try {
    require_once $repoRoot . '/api/lib/db.php';
    $pdo = db_connect($db);
    $pdo->query('SELECT 1');
    echo "    Connection: OK\n";
} catch (Throwable $e) {
    echo "    Connection: FAILED\n";
    echo "    " . $e->getMessage() . "\n";
    echo "\nFix: cPanel → MySQL Databases → link user to database (ALL PRIVILEGES)\n";
    echo "Then: MARVISPACE_DB_NAME=... MARVISPACE_DB_USER=... MARVISPACE_DB_PASS=... php install/provision-database.php\n";
    exit(1);
}

echo "\n==> Tables\n";
$tables = ['products', 'orders', 'order_items', 'admin_users', 'schema_migrations'];
foreach ($tables as $table) {
    try {
        $count = (int) $pdo->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();
        echo "    OK  {$table} ({$count} rows)\n";
    } catch (Throwable $e) {
        echo "    MISSING  {$table}\n";
    }
}

echo "\n==> Git commit (if available)\n";
chdir($repoRoot);
passthru('git log -1 --oneline 2>/dev/null');

echo "\n==> Web config (public_html)\n";
$webConfig = '/home/marvispace/public_html/api/config.local.php';
if (is_readable($webConfig)) {
    echo "    OK  {$webConfig}\n";
    try {
        $webCfg = require $webConfig;
        $pdoWeb = db_connect($webCfg['db']);
        $pdoWeb->query('SELECT 1');
        echo "    Web config DB connection: OK\n";
    } catch (Throwable $e) {
        echo "    Web config DB connection: FAILED\n";
        echo '    ' . $e->getMessage() . "\n";
    }
} else {
    echo "    MISSING  {$webConfig}\n";
    echo "    Run: bash deploy.sh\n";
}

echo "\n==> Next steps\n";
echo "    php install/migrate.php\n";
echo "    php install/seed.php\n";
echo "    bash deploy.sh\n";
echo "    curl -s https://marvispace.com/api/v1/health.php\n";
