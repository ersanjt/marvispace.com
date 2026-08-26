<?php
/**
 * On-demand product image resize + WebP/JPEG cache.
 * @project MARVISPACE
 */
declare(strict_types=1);

function image_resize_project_root(): string
{
    return dirname(__DIR__, 2);
}

function image_resize_allowed_root(): string
{
    return realpath(image_resize_project_root() . '/assets/images/products') ?: '';
}

function image_resize_resolve_source(string $src): ?string
{
    $src = rawurldecode(trim($src));
    if ($src === '' || str_contains($src, '..') || str_contains($src, "\0")) {
        return null;
    }

    if (!str_starts_with($src, '/assets/images/products/')) {
        return null;
    }

    $root = image_resize_allowed_root();
    if ($root === '') {
        return null;
    }

    $full = realpath(image_resize_project_root() . $src);
    if ($full === false || !str_starts_with($full, $root . DIRECTORY_SEPARATOR)) {
        return null;
    }

    if (!is_file($full) || !is_readable($full)) {
        return null;
    }

    return $full;
}

function image_resize_load(string $path): ?GdImage
{
    $info = @getimagesize($path);
    if ($info === false) {
        return null;
    }

    return match ($info[2] ?? 0) {
        IMAGETYPE_JPEG => @imagecreatefromjpeg($path) ?: null,
        IMAGETYPE_PNG => @imagecreatefrompng($path) ?: null,
        IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? (@imagecreatefromwebp($path) ?: null) : null,
        IMAGETYPE_GIF => @imagecreatefromgif($path) ?: null,
        default => null,
    };
}

function image_resize_fit_width(GdImage $src, int $targetWidth): GdImage
{
    $srcW = imagesx($src);
    $srcH = imagesy($src);
    if ($srcW <= 0 || $srcH <= 0) {
        return $src;
    }

    if ($srcW <= $targetWidth) {
        $copy = imagecreatetruecolor($srcW, $srcH);
        imagecopy($copy, $src, 0, 0, 0, 0, $srcW, $srcH);
        return $copy;
    }

    $targetHeight = (int) max(1, round($srcH * ($targetWidth / $srcW)));
    $dst = imagecreatetruecolor($targetWidth, $targetHeight);
    imagealphablending($dst, true);
    imagesavealpha($dst, true);
    $white = imagecolorallocate($dst, 255, 255, 255);
    imagefilledrectangle($dst, 0, 0, $targetWidth, $targetHeight, $white);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $targetWidth, $targetHeight, $srcW, $srcH);
    return $dst;
}

function image_resize_encode(GdImage $img, string $format, int $quality): ?string
{
    ob_start();
    $ok = match ($format) {
        'webp' => function_exists('imagewebp') && imagewebp($img, null, $quality),
        'jpeg', 'jpg' => imagejpeg($img, null, $quality),
        default => false,
    };
    $bytes = ob_get_clean();
    return ($ok && $bytes !== false && $bytes !== '') ? $bytes : null;
}

function image_resize_cache_path(string $sourcePath, int $width, string $format, int $quality): string
{
    $mtime = (string) (@filemtime($sourcePath) ?: 0);
    $hash = hash('sha256', $sourcePath . '|' . $width . '|' . $format . '|' . $quality . '|' . $mtime);
    $ext = $format === 'webp' ? 'webp' : 'jpg';
    $dir = image_resize_project_root() . '/assets/images/.cache';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    return $dir . '/' . substr($hash, 0, 32) . '.' . $ext;
}

function image_resize_mime(string $format): string
{
    return $format === 'webp' ? 'image/webp' : 'image/jpeg';
}

function image_resize_redirect_original(string $src): void
{
    header('Cache-Control: no-store');
    header('Location: ' . $src, true, 302);
}

function image_resize_handle_request(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        http_response_code(405);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
        return;
    }

    // Large camera JPEGs (8–12MB) need more RAM than default PHP limits.
    @ini_set('memory_limit', '512M');
    @ini_set('max_execution_time', '60');

    $src = (string) ($_GET['src'] ?? '');

    if (!extension_loaded('gd')) {
        $resolved = image_resize_resolve_source($src);
        if ($resolved) {
            image_resize_redirect_original($src);
            return;
        }
        http_response_code(503);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'Image processing unavailable']);
        return;
    }

    $width = (int) ($_GET['w'] ?? 560);
    $width = max(48, min(1920, $width));
    $quality = (int) ($_GET['q'] ?? 85);
    $quality = max(60, min(95, $quality));
    $format = strtolower((string) ($_GET['f'] ?? 'webp'));
    if (!in_array($format, ['webp', 'jpeg', 'jpg'], true)) {
        $format = 'webp';
    }
    if ($format === 'webp' && !function_exists('imagewebp')) {
        $format = 'jpeg';
    }

    $sourcePath = image_resize_resolve_source($src);
    if ($sourcePath === null) {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'Image not found']);
        return;
    }

    $cachePath = image_resize_cache_path($sourcePath, $width, $format, $quality);
    if (is_file($cachePath) && is_readable($cachePath)) {
        header('Content-Type: ' . image_resize_mime($format));
        header('Cache-Control: public, max-age=31536000, immutable');
        header('X-Image-Cache: HIT');
        readfile($cachePath);
        return;
    }

    // Prefer Imagick for huge sources when available (lower peak memory).
    $bytes = image_resize_with_imagick($sourcePath, $width, $format, $quality);
    if ($bytes === null) {
        $info = @getimagesize($sourcePath);
        $fileSize = (int) (@filesize($sourcePath) ?: 0);
        $pixels = (int) (($info[0] ?? 0) * ($info[1] ?? 0));
        // GD fatals (OOM) on large camera JPEGs — skip and serve original.
        $tooLargeForGd = $fileSize > 3_500_000 || $pixels > 14_000_000;
        if ($tooLargeForGd) {
            image_resize_redirect_original($src);
            return;
        }

        $loaded = image_resize_load($sourcePath);
        if ($loaded === null) {
            // Serve original instead of blank/500 so the storefront still shows the product.
            image_resize_redirect_original($src);
            return;
        }

        $resized = image_resize_fit_width($loaded, $width);
        imagedestroy($loaded);

        $bytes = image_resize_encode($resized, $format, $quality);
        imagedestroy($resized);
    }

    if ($bytes === null) {
        image_resize_redirect_original($src);
        return;
    }

    @file_put_contents($cachePath, $bytes, LOCK_EX);

    header('Content-Type: ' . image_resize_mime($format));
    header('Cache-Control: public, max-age=31536000, immutable');
    header('X-Image-Cache: MISS');
    echo $bytes;
}

/**
 * Resize with Imagick when available — better for multi-megabyte camera JPEGs.
 */
function image_resize_with_imagick(string $sourcePath, int $width, string $format, int $quality): ?string
{
    if (!extension_loaded('imagick') || !class_exists('Imagick')) {
        return null;
    }

    try {
        $img = new Imagick($sourcePath);
        if (method_exists($img, 'autoOrient')) {
            $img->autoOrient();
        }
        $srcW = $img->getImageWidth();
        if ($srcW > $width) {
            $img->resizeImage($width, 0, Imagick::FILTER_LANCZOS, 1);
        }
        $img->stripImage();
        if ($format === 'webp') {
            $img->setImageFormat('webp');
        } else {
            $img->setImageFormat('jpeg');
            $img->setImageCompression(Imagick::COMPRESSION_JPEG);
        }
        $img->setImageCompressionQuality($quality);
        $bytes = $img->getImageBlob();
        $img->clear();
        $img->destroy();
        return ($bytes !== false && $bytes !== '') ? $bytes : null;
    } catch (Throwable) {
        return null;
    }
}
