<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

admin_session_start();
if (empty($_SESSION['admin_id'])) {
    json_ok(['authenticated' => false]);
}

json_ok([
    'authenticated' => true,
    'email' => $_SESSION['admin_email'] ?? '',
]);
