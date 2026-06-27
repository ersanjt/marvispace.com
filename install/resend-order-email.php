<?php
/**
 * Resend order confirmation emails for an existing order.
 *
 *   php install/resend-order-email.php ORDER_ID
 */
declare(strict_types=1);

$repoRoot = dirname(__DIR__);
$orderId = trim((string) ($argv[1] ?? ''));

if ($orderId === '') {
    fwrite(STDERR, "Usage: php install/resend-order-email.php ORDER_ID\n");
    exit(1);
}

$configPath = '/home/marvispace/api_config.php';
if (!is_file($configPath)) {
    $configPath = $repoRoot . '/api/config.local.php';
}

if (!is_file($configPath)) {
    fwrite(STDERR, "ERROR: api config not found.\n");
    exit(1);
}

$config = require $configPath;

function app_config(): array
{
    global $config;
    return $config;
}

require_once $repoRoot . '/api/lib/db.php';
require_once $repoRoot . '/api/lib/orders-repo.php';
require_once $repoRoot . '/api/lib/order-mail.php';

try {
    $pdo = db_connect($config['db']);
} catch (Throwable $e) {
    fwrite(STDERR, 'ERROR: Database — ' . $e->getMessage() . "\n");
    exit(1);
}

$order = order_get($pdo, $orderId);
if (!$order) {
    fwrite(STDERR, "ERROR: Order not found: {$orderId}\n");
    exit(1);
}

echo "==> Resending emails for order {$orderId}\n";
echo '    Customer: ' . ($order['customer']['email'] ?? '(none)') . "\n\n";

$result = order_send_purchase_emails($pdo, $order);

echo '    Customer email: ' . ($result['customer'] ? 'sent' : 'FAILED') . "\n";
if (!$result['customer'] && mail_last_error() !== '') {
    echo '      ' . mail_last_error() . "\n";
}

echo '    Admin email:    ' . ($result['admin'] ? 'sent' : 'FAILED') . "\n";
if (!$result['admin'] && mail_last_error() !== '') {
    echo '      ' . mail_last_error() . "\n";
}

exit(($result['customer'] || $result['admin']) ? 0 : 1);
