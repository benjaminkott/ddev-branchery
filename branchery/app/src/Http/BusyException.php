<?php

declare(strict_types=1);

namespace App\Http;

/**
 * The worktree this was asked about is already being worked on. Its own kind,
 * because it is neither the caller's mistake nor a fault: the request is well
 * formed and the answer is "not yet". A client that retries on conflict and
 * gives up on server errors would get exactly the wrong one from a 500.
 */
final class BusyException extends \RuntimeException
{
}
