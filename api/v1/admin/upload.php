<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';

admin_require($pdo);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    json_error('Method not allowed', 405);
}

if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
    json_error('No file uploaded', 400);
}

$file = $_FILES['file'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    json_error('Upload failed', 400);
}

$maxBytes = 5 * 1024 * 1024;
if (($file['size'] ?? 0) > $maxBytes) {
    json_error('Image must be 5 MB or smaller', 400);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']) ?: '';
$allowed = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];

if (!isset($allowed[$mime])) {
    json_error('Only JPG, PNG, WebP, or GIF images are allowed', 400);
}

$ext = $allowed[$mime];
$baseDir = dirname(__DIR__, 3) . '/assets/images/products';
if (!is_dir($baseDir) && !mkdir($baseDir, 0755, true) && !is_dir($baseDir)) {
    json_error('Upload directory is not writable', 500);
}

$name = 'upload_' . gmdate('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$target = $baseDir . '/' . $name;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    json_error('Could not save uploaded file', 500);
}

chmod($target, 0644);

$url = '/assets/images/products/' . $name;
json_ok(['url' => $url, 'name' => $name], 201);
