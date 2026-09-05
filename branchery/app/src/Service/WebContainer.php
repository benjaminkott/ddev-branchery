<?php

declare(strict_types=1);

namespace App\Service;

/**
 * Where the project's tools are run. This container deliberately ships none of
 * them: git, composer, the database clients and the PHP pools live in the web
 * container, and only there in the right environment.
 *
 * Stated as an interface because every operation ends in one of these calls,
 * and a class that can only reach a real container is one no test can stand
 * behind. What an operation does is the order of the commands it runs, and that
 * is a thing worth holding to -- see App\Tests\Fake\RecordingContainer.
 */
interface WebContainer
{
    /**
     * What the tools say is the only account of what actually happened, and the
     * one thing worth reading when an operation takes minutes or stops. Handed on
     * line by line as it arrives, not collected and shown afterwards.
     */
    public function listen(?\Closure $sink): void;

    /**
     * @param list<string>          $command
     * @param bool                  $stream      whether this is work whose output
     *                                           belongs in the log, as opposed to a
     *                                           question whose answer is read here
     * @param array<string, string> $environment what the command is told about the
     *                                           worktree it is running for
     */
    public function run(array $command, ?string $workingDirectory = null, bool $stream = false, array $environment = []): CommandResult;
}
