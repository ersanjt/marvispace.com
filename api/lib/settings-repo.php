<?php
declare(strict_types=1);

require_once __DIR__ . '/mail.php';

const FAVICON_DEFAULT_URL = '/favicon.svg';
const FAVICON_DEFAULT_TYPE = 'image/svg+xml';
const FAVICON_DIR_REL = '/assets/images/site';

function setting_get(PDO $pdo, string $key, string $default = ''): string
{
    $stmt = $pdo->prepare('SELECT setting_value FROM site_settings WHERE setting_key = ? LIMIT 1');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? (string) $row['setting_value'] : $default;
}

function setting_set(PDO $pdo, string $key, string $value): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    $stmt->execute([$key, $value]);
}

function favicon_public(PDO $pdo): array
{
    $url = setting_get($pdo, 'favicon_url', FAVICON_DEFAULT_URL);
    $type = setting_get($pdo, 'favicon_type', FAVICON_DEFAULT_TYPE);

    if ($url === '') {
        $url = FAVICON_DEFAULT_URL;
        $type = FAVICON_DEFAULT_TYPE;
    }

    return [
        'url' => $url,
        'type' => $type,
        'isCustom' => $url !== FAVICON_DEFAULT_URL,
    ];
}

function settings_admin_get(PDO $pdo): array
{
    return [
        'favicon' => favicon_public($pdo),
        'notifications' => notifications_admin_get($pdo),
    ];
}

function notifications_admin_get(PDO $pdo): array
{
    return mail_notify_settings($pdo);
}

function notifications_save(PDO $pdo, array $input): array
{
    if (array_key_exists('adminEmail', $input)) {
        $email = strtolower(trim((string) $input['adminEmail']));
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Enter a valid notification email');
        }
        setting_set($pdo, 'notify_admin_email', $email);
    }

    if (array_key_exists('notifyOrders', $input)) {
        setting_set($pdo, 'notify_orders', !empty($input['notifyOrders']) ? '1' : '0');
    }

    if (array_key_exists('notifyNewsletter', $input)) {
        setting_set($pdo, 'notify_newsletter', !empty($input['notifyNewsletter']) ? '1' : '0');
    }

    return notifications_admin_get($pdo);
}

function mail_notify_settings(PDO $pdo): array
{
    $cfg = mail_config();
    $email = strtolower(trim(setting_get($pdo, 'notify_admin_email', '')));

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $email = trim((string) ($cfg['admin_notify'] ?? ''));
    }

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        try {
            $row = $pdo->query('SELECT email FROM admin_users ORDER BY id ASC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
            if ($row && !empty($row['email']) && filter_var($row['email'], FILTER_VALIDATE_EMAIL)) {
                $email = strtolower((string) $row['email']);
            }
        } catch (Throwable $e) {
            /* ignore */
        }
    }

    $smtpPass = (string) ($cfg['smtp']['pass'] ?? '');

    return [
        'adminEmail' => $email,
        'notifyOrders' => setting_get($pdo, 'notify_orders', '1') === '1',
        'notifyNewsletter' => setting_get($pdo, 'notify_newsletter', '1') === '1',
        'smtpConfigured' => $smtpPass !== '',
        'mailFrom' => (string) ($cfg['from'] ?? ''),
        'configFallback' => trim(setting_get($pdo, 'notify_admin_email', '')) === '',
    ];
}

function favicon_site_dir(): string
{
    return dirname(__DIR__, 2) . FAVICON_DIR_REL;
}

function favicon_clear_custom_files(): void
{
    $dir = favicon_site_dir();
    if (!is_dir($dir)) {
        return;
    }

    foreach (glob($dir . '/favicon.*') ?: [] as $file) {
        if (is_file($file)) {
            @unlink($file);
        }
    }
}

function favicon_mime_map(): array
{
    return [
        'image/svg+xml' => ['ext' => 'svg', 'type' => 'image/svg+xml'],
        'image/png' => ['ext' => 'png', 'type' => 'image/png'],
        'image/webp' => ['ext' => 'webp', 'type' => 'image/webp'],
        'image/x-icon' => ['ext' => 'ico', 'type' => 'image/x-icon'],
        'image/vnd.microsoft.icon' => ['ext' => 'ico', 'type' => 'image/x-icon'],
    ];
}

function favicon_save_upload(PDO $pdo, string $tmpPath, string $mime): array
{
    $map = favicon_mime_map();
    if (!isset($map[$mime])) {
        throw new InvalidArgumentException('Only SVG, PNG, WebP, or ICO favicons are allowed');
    }

    $info = $map[$mime];
    $dir = favicon_site_dir();
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException('Favicon directory is not writable');
    }

    favicon_clear_custom_files();

    $filename = 'favicon.' . $info['ext'];
    $target = $dir . '/' . $filename;
    if (!copy($tmpPath, $target)) {
        throw new RuntimeException('Could not save favicon');
    }
    chmod($target, 0644);

    $url = FAVICON_DIR_REL . '/' . $filename . '?v=' . time();
    setting_set($pdo, 'favicon_url', $url);
    setting_set($pdo, 'favicon_type', $info['type']);

    return favicon_public($pdo);
}

function favicon_reset(PDO $pdo): array
{
    favicon_clear_custom_files();
    setting_set($pdo, 'favicon_url', FAVICON_DEFAULT_URL);
    setting_set($pdo, 'favicon_type', FAVICON_DEFAULT_TYPE);
    return favicon_public($pdo);
}
