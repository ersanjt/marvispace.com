<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/lib/bootstrap.php';
require_once dirname(__DIR__, 2) . '/lib/settings-repo.php';

admin_require($pdo);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    json_ok(settings_admin_get($pdo));
}

if ($method === 'POST') {
    if (!empty($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
        $file = $_FILES['file'];
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            json_error('Upload failed', 400);
        }

        $maxBytes = 512 * 1024;
        if (($file['size'] ?? 0) > $maxBytes) {
            json_error('Favicon must be 512 KB or smaller', 400);
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']) ?: '';

        try {
            $favicon = favicon_save_upload($pdo, $file['tmp_name'], $mime);
            json_ok(['favicon' => $favicon], 201);
        } catch (InvalidArgumentException $e) {
            json_error($e->getMessage(), 400);
        } catch (RuntimeException $e) {
            json_error($e->getMessage(), 500);
        }
    }

    $body = read_json_body();
    if (!empty($body['resetFavicon'])) {
        json_ok(['favicon' => favicon_reset($pdo)]);
    }

    json_error('No file uploaded', 400);
}

json_error('Method not allowed', 405);
