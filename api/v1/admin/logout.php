<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';

if ($method === 'POST') {
    admin_logout();
    json_ok(['loggedOut' => true]);
}

json_error('Method not allowed', 405);
