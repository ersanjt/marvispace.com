<?php
declare(strict_types=1);

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
