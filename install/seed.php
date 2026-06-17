<?php
/**
 * Seed products + admin user. Run once on server:
 *   php install/seed.php
 */
declare(strict_types=1);

$repoRoot = dirname(__DIR__);
$configPath = '/home/marvispace/api_config.php';
if (!is_file($configPath)) {
    $configPath = $repoRoot . '/api/config.local.php';
}
if (!is_file($configPath)) {
    fwrite(STDERR, "ERROR: api config not found. Run install/setup-server.sh first.\n");
    exit(1);
}

$config = require $configPath;
require_once $repoRoot . '/api/lib/db.php';
require_once $repoRoot . '/api/lib/products-repo.php';

$pdo = db_connect($config['db']);

$productsFile = $repoRoot . '/install/products.json';
if (!is_file($productsFile)) {
    fwrite(STDERR, "ERROR: install/products.json not found.\n");
    exit(1);
}

$products = json_decode(file_get_contents($productsFile), true);
if (!is_array($products)) {
    fwrite(STDERR, "ERROR: invalid products.json\n");
    exit(1);
}

echo "==> Seeding products (" . count($products) . ")...\n";
foreach ($products as $product) {
    $product['sizes'] = $product['sizes'] ?? DEFAULT_SIZES;
    product_save($pdo, $product);
}

$adminEmail = getenv('MARVISPACE_ADMIN_EMAIL') ?: '';
$adminPass = getenv('MARVISPACE_ADMIN_PASSWORD') ?: '';

if ($adminEmail === '' || $adminPass === '') {
    fwrite(STDERR, "ERROR: Set MARVISPACE_ADMIN_EMAIL and MARVISPACE_ADMIN_PASSWORD.\n");
    exit(1);
}
$hash = password_hash($adminPass, PASSWORD_BCRYPT);

$stmt = $pdo->prepare(
    'INSERT INTO admin_users (email, name, password_hash) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name)'
);
$stmt->execute([strtolower($adminEmail), 'Owner', $hash]);

try {
    $pdo->prepare('UPDATE admin_users SET role = ? WHERE email = ?')->execute(['owner', strtolower($adminEmail)]);
} catch (Throwable $e) {
    /* role column after migration 003 */
}

echo "==> Admin user: {$adminEmail}\n";
echo "==> Seed completed.\n";
