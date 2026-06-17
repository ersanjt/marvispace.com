<?php
declare(strict_types=1);

function db_connect(array $db): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $hosts = [];
    $primary = (string) ($db['host'] ?? 'localhost');
    $hosts[] = $primary;
    if ($primary === 'localhost') {
        $hosts[] = '127.0.0.1';
    }

    $last = null;
    foreach (array_unique($hosts) as $host) {
        try {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=utf8mb4',
                $host,
                $db['name']
            );
            $pdo = new PDO($dsn, $db['user'], $db['pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            return $pdo;
        } catch (Throwable $e) {
            $last = $e;
            $pdo = null;
        }
    }

    throw $last ?? new RuntimeException('Database connection failed');
}
