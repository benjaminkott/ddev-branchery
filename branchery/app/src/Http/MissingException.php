<?php

declare(strict_types=1);

namespace App\Http;

/**
 * What was asked about is not here. Its own kind for the reason BusyException
 * is: the request is well formed and the answer is that there is no such thing
 * -- a worktree somebody removed, a commit an address a week old still names. A
 * 400 would say the caller wrote something wrong.
 *
 * Thrown rather than returned: a reader that answered "the project's own
 * checkout", "this worktree" or "no such thing" in one value left five callers
 * writing out the same lines to turn the third into a refusal.
 */
final class MissingException extends \RuntimeException
{
}
