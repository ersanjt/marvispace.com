<?php
/**
 * MARVISPACE database migration runner.
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

try {
    $config = require $configPath;
    $db = $config['db'] ?? [];
    if (empty($db['name']) || empty($db['user']) || !array_key_exists('pass', $db)) {
        throw new RuntimeException('Database credentials incomplete in api_config.php');
    }

    require_once $repoRoot . '/api/lib/db.php';
    $pdo = db_connect($db);

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

    if (!$files) {
        fwrite(STDERR, "ERROR: No migrations found in {$migrationsDir}\n");
        exit(1);
    }

    $statusOnly = in_array('--status', $argv ?? [], true);

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
        migrate_run_sql_file($db, $file);

        $stmt = $pdo->prepare('INSERT INTO schema_migrations (version) VALUES (?)');
        $stmt->execute([$version]);
        $ran++;
    }

    echo $ran > 0
        ? "==> Applied {$ran} migration(s).\n"
        : "==> Database schema is up to date.\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'ERROR: ' . $e->getMessage() . "\n");
    exit(1);
}

function migrate_run_sql_file(array $db, string $filePath): void
{
    if (!is_file($filePath)) {
        throw new RuntimeException('Migration file not found: ' . $filePath);
    }

    require_once dirname(__DIR__) . '/api/lib/db.php';
    $pdo = db_connect($db);
    if (defined('PDO::MYSQL_ATTR_MULTI_STATEMENTS')) {
        $pdo->setAttribute(PDO::MYSQL_ATTR_MULTI_STATEMENTS, true);
    }

    $sql = file_get_contents($filePath);
    if ($sql === false || trim($sql) === '') {
        throw new RuntimeException('Empty migration file');
    }

    $pdo->exec($sql);
}
