<?php
/**
 * MARVISPACE database migration runner.
 * Applies SQL files in install/migrations/ once, tracked in schema_migrations.
 *
 * Usage:
 *   php install/migrate.php
 *   php install/migrate.php --status
 */
declare(strict_types=1);

$repoRoot = dirname(__DIR__);
$configPath = '/home/marvispace/api_config.php';
if (!is_file($configPath)) {
    $configPath = $repoRoot . '/api/config.local.php';
}

if (!is_file($configPath)) {
    fwrite(STDERR, "ERROR: API config not found. Run install/provision-database.php first.\n");
    exit(1);
}

$config = require $configPath;
require_once $repoRoot . '/api/lib/db.php';

$pdo = db_connect($config['db']);
$pdo->setAttribute(PDO::MYSQL_ATTR_MULTI_STATEMENTS, true);

$statusOnly = in_array('--status', $argv ?? [], true);

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(64) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);

$applied = $pdo->query('SELECT version FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN);
$applied = array_flip($applied);

$migrationsDir = $repoRoot . '/install/migrations';
$files = glob($migrationsDir . '/*.sql') ?: [];
sort($files);

if ($statusOnly) {
    echo "==> Migration status\n";
    foreach ($files as $file) {
        $version = basename($file);
        $state = isset($applied[$version]) ? 'applied' : 'pending';
        echo "    [{$state}] {$version}\n";
    }
    exit(0);
}

$ran = 0;
foreach ($files as $file) {
    $version = basename($file);
    if (isset($applied[$version])) {
        continue;
    }

    echo "==> Applying {$version}...\n";
    $sql = file_get_contents($file);
    if ($sql === false || trim($sql) === '') {
        fwrite(STDERR, "ERROR: Empty migration {$version}\n");
        exit(1);
    }

    try {
        $pdo->exec($sql);
        $stmt = $pdo->prepare('INSERT INTO schema_migrations (version) VALUES (?)');
        $stmt->execute([$version]);
        $ran++;
    } catch (Throwable $e) {
        fwrite(STDERR, "ERROR in {$version}: " . $e->getMessage() . "\n");
        exit(1);
    }
}

echo $ran > 0
    ? "==> Applied {$ran} migration(s).\n"
    : "==> Database schema is up to date.\n";
