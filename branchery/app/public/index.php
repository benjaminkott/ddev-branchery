<?php

declare(strict_types=1);

use App\Container;
use App\Http\Origin;
use App\Http\Response;

require_once dirname(__DIR__) . '/vendor/autoload.php';

// A warning printed into the response body corrupts the JSON around it and
// takes the status code with it. They belong in the server's log.
ini_set('display_errors', 'stderr');

$container = Container::fromEnvironment();
$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';

// Before anything is read or run: this API asks nobody who they are, so a
// request from another site is the one thing it can refuse on its own.
if (Origin::isForeign($_SERVER)) {
    Response::json(['error' => 'This API answers its own page only.'], 403)->send();

    exit;
}

// What a request becomes -- the answer and the refusal both -- is the router's;
// what is left here is the plumbing around it. The last catch is for what
// happens before there is a router at all: an environment this cannot be built
// from is still a request somebody is waiting on.
try {
    $response = $container->router()->dispatch(
        (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'),
        $path,
        (string) file_get_contents('php://input'),
        $_GET,
    );
} catch (Throwable $exception) {
    $response = Response::json(['error' => $exception->getMessage()], 500);
}

$response->send();
