<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/lib/bootstrap.php';

try {
    $pdo->query('SELECT 1 FROM products LIMIT 1');
    json_ok(['database' => true, 'version' => '1']);
} catch (Throwable $e) {
    json_ok(['database' => false, 'version' => '1']);
}
