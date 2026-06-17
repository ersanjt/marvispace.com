<?php
declare(strict_types=1);

/**
 * Load API config — web PHP reads public_html/api/config.local.php first.
 */
function app_config_paths(): array
{
    $apiDir = dirname(__DIR__);

    return [
        $apiDir . '/config.local.php',
        '/home/marvispace/api_config.php',
    ];
}

/** @return array{0: array, 1: ?string} */
function app_config_resolve(): array
{
    static $resolved = null;
    if ($resolved !== null) {
        return $resolved;
    }

    foreach (app_config_paths() as $path) {
        if (!is_readable($path)) {
            continue;
        }
        $loaded = require $path;
        if (!is_array($loaded) || empty($loaded['db'])) {
            continue;
        }
        $resolved = [$loaded, $path];
        return $resolved;
    }

    $resolved = [[], null];
    return $resolved;
}

function app_load_config(): array
{
    return app_config_resolve()[0];
}

function app_config_source(): ?string
{
    return app_config_resolve()[1];
}
