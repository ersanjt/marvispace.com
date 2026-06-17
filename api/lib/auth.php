<?php
declare(strict_types=1);

function admin_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name('MARVISPACE_ADMIN');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function admin_login(PDO $pdo, string $email, string $password): bool
{
    $email = strtolower(trim($email));
    if ($email === '' || $password === '') {
        return false;
    }

    $stmt = $pdo->prepare('SELECT id, password_hash FROM admin_users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        return false;
    }

    admin_session_start();
    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int) $row['id'];
    $_SESSION['admin_email'] = $email;
    return true;
}

function admin_logout(): void
{
    admin_session_start();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function admin_require(PDO $pdo): array
{
    admin_session_start();
    if (empty($_SESSION['admin_id'])) {
        json_error('Unauthorized', 401);
    }

    $stmt = $pdo->prepare('SELECT id, email FROM admin_users WHERE id = ? LIMIT 1');
    $stmt->execute([(int) $_SESSION['admin_id']]);
    $row = $stmt->fetch();
    if (!$row) {
        admin_logout();
        json_error('Unauthorized', 401);
    }

    return $row;
}

function admin_reset_password(PDO $pdo, array $config, string $email, string $recoveryCode, string $newPassword): bool
{
    return admin_reset_password_result($pdo, $config, $email, $recoveryCode, $newPassword)['ok'];
}

function admin_reset_password_result(PDO $pdo, array $config, string $email, string $recoveryCode, string $newPassword): array
{
    $email = strtolower(trim($email));
    $recoveryCode = trim($recoveryCode);
    $recoveryHash = $config['admin']['recovery_bcrypt'] ?? '';

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'error' => 'Valid admin email is required.', 'status' => 400];
    }

    if ($recoveryCode === '') {
        return ['ok' => false, 'error' => 'Recovery code is required.', 'status' => 400];
    }

    if (strlen($newPassword) < 8) {
        return ['ok' => false, 'error' => 'Password must be at least 8 characters.', 'status' => 400];
    }

    if ($recoveryHash === '') {
        return [
            'ok' => false,
            'error' => 'Password recovery is not configured on the server. Run: php install/patch-api-config.php',
            'status' => 503,
        ];
    }

    if (!password_verify($recoveryCode, $recoveryHash)) {
        return ['ok' => false, 'error' => 'Invalid recovery code.', 'status' => 401];
    }

    $stmt = $pdo->prepare('SELECT id FROM admin_users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    if (!$row) {
        return ['ok' => false, 'error' => 'No admin account exists for this email.', 'status' => 404];
    }

    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $upd = $pdo->prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?');
    $upd->execute([$hash, (int) $row['id']]);

    if (!admin_login($pdo, $email, $newPassword)) {
        return ['ok' => false, 'error' => 'Password updated but sign-in failed. Try signing in manually.', 'status' => 500];
    }

    return ['ok' => true, 'email' => $email];
}
