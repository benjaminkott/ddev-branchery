<?php

declare(strict_types=1);

namespace App;

/**
 * The releases of this add-on, read from GitHub.
 *
 * The repository is named here and not derived from the image in the compose
 * file: a project may point that at a registry of its own -- tools/deploy.sh
 * does exactly that -- and the question is still what this add-on has released.
 *
 * Unauthenticated, which GitHub allows sixty times an hour per address. A check
 * runs once per container start, so the limit is only reachable by a machine
 * restarting projects all day; being refused then reads the same as having no
 * network, and both are answered with null rather than with a guess.
 */
final readonly class GithubReleases implements Releases
{
    private const string ENDPOINT = 'https://api.github.com/repos/benjaminkott/ddev-branchery/releases/latest';

    /** Short on purpose: nothing waits for this, but the process should not linger. */
    private const int TIMEOUT = 5;

    public function latest(): ?string
    {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                // GitHub refuses a request without one, and it should say who is asking.
                'header' => "User-Agent: branchery\r\nAccept: application/vnd.github+json\r\n",
                'timeout' => self::TIMEOUT,
                // A rate limit answers 403 with a body; without this the warning is all
                // that arrives and the status cannot be told from a broken connection.
                'ignore_errors' => true,
            ],
        ]);

        $body = @file_get_contents(self::ENDPOINT, false, $context);
        if ($body === false) {
            return null;
        }

        $answer = json_decode($body, true);
        if (!\is_array($answer) || !\is_string($answer['tag_name'] ?? null)) {
            return null;
        }

        $tag = trim($answer['tag_name']);

        return $tag === '' ? null : $tag;
    }
}
