<?php

declare(strict_types=1);

use App\Container;
use App\Http\BusyException;
use App\Http\MissingException;
use App\Http\Origin;
use App\Http\Response;
use App\Http\Router;

require_once dirname(__DIR__) . '/vendor/autoload.php';

// A warning printed into the response body corrupts the JSON around it and
// takes the status code with it. They belong in the server's log.
ini_set('display_errors', 'stderr');

$router = new Router(Container::fromEnvironment());
$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';

// Before anything is read or run: this API asks nobody who they are, so a
// request from another site is the one thing it can refuse on its own.
if (Origin::isForeign($_SERVER)) {
    Response::json(['error' => 'This API answers its own page only.'], 403)->send();

    exit;
}

try {
    $response = $router->dispatch(
        (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'),
        $path,
        (string) file_get_contents('php://input'),
        $_GET,
    );
} catch (BusyException $exception) {
    // Nothing is wrong with the request or with this: the worktree it is about
    // is already being worked on. Said as a conflict, because a 500 reads as a
    // server that broke -- and this one is asking the caller to come back.
    $response = Response::json(['error' => $exception->getMessage()], 409);
} catch (MissingException $exception) {
    // What was asked about is not here, and the message says which of them:
    // a worktree that was removed, a branch that was pruned, a commit an old
    // address still names. Not a fault and not the caller's mistake.
    $response = Response::json(['error' => $exception->getMessage()], 404);
} catch (InvalidArgumentException $exception) {
    // What the caller asked for cannot be done, and the message says why.
    $response = Response::json(['error' => $exception->getMessage()], 400);
} catch (Throwable $exception) {
    $response = Response::json(['error' => $exception->getMessage()], 500);
}

$response->send();
