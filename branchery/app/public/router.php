<?php

/**
 * Router for the built-in PHP server in the management container.
 *
 * PHP answers the API and nothing else; the interface is a static file the
 * server hands out as it is, and the application in the browser owns every
 * address under it.
 */

declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/index.php';

    return true;
}

if ($path !== '/' && is_file(__DIR__ . $path)) {
    return false;
}

header('Content-Type: text/html; charset=utf-8');
readfile(__DIR__ . '/index.html');

return true;
