<?php
/**
 * Seed products + admin user. Run once on server:
 *   MARVISPACE_ADMIN_EMAIL='you@example.com' \
 *   MARVISPACE_ADMIN_PASSWORD='StrongPass123' \
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

echo '==> Seeding products (' . count($products) . ")...\n";
foreach ($products as $product) {
    $product['sizes'] = $product['sizes'] ?? DEFAULT_SIZES;
    product_save($pdo, $product);
}

$adminEmail = strtolower(trim((string) (getenv('MARVISPACE_ADMIN_EMAIL') ?: '')));
$adminPass = (string) (getenv('MARVISPACE_ADMIN_PASSWORD') ?: '');

if ($adminEmail === '' || $adminPass === '') {
    fwrite(STDERR, "ERROR: Set MARVISPACE_ADMIN_EMAIL and MARVISPACE_ADMIN_PASSWORD.\n");
    exit(1);
}

if (!filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "ERROR: MARVISPACE_ADMIN_EMAIL must be a valid email address.\n");
    exit(1);
}

if (strlen($adminPass) < 8) {
    fwrite(STDERR, "ERROR: MARVISPACE_ADMIN_PASSWORD must be at least 8 characters.\n");
    exit(1);
}

$hash = password_hash($adminPass, PASSWORD_BCRYPT);

$existing = $pdo->prepare('SELECT id, role FROM admin_users WHERE email = ? LIMIT 1');
$existing->execute([$adminEmail]);
$row = $existing->fetch(PDO::FETCH_ASSOC);

if ($row) {
    $upd = $pdo->prepare('UPDATE admin_users SET password_hash = ?, name = COALESCE(NULLIF(name, \'\'), ?) WHERE id = ?');
    $upd->execute([$hash, 'Owner', (int) $row['id']]);
    echo "==> Admin password updated: {$adminEmail}\n";
} else {
    $ownerCount = (int) $pdo->query("SELECT COUNT(*) FROM admin_users WHERE role = 'owner'")->fetchColumn();
    $role = $ownerCount === 0 ? 'owner' : 'admin';
    $ins = $pdo->prepare(
        'INSERT INTO admin_users (email, name, password_hash, role) VALUES (?, ?, ?, ?)'
    );
    $ins->execute([$adminEmail, 'Owner', $hash, $role]);
    echo "==> Admin user created ({$role}): {$adminEmail}\n";
}

echo "==> Seed completed.\n";
