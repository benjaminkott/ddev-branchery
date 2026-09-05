<?php

declare(strict_types=1);

namespace App\Web;

use App\CommandResult;
use Symfony\Component\Process\Process;

/**
 * Runs commands in the project's web container, through the Docker socket. This
 * ships no tools: git, composer, the database clients and the PHP pools live in
 * the web container, and only there in the right environment.
 */
final class DockerContainer implements WebContainer
{
    /** @var (\Closure(string): void)|null */
    private ?\Closure $sink = null;

    public function __construct(
        private readonly string $containerName,
        private readonly string $hostProjectRoot,
        private readonly int $timeout = 1800,
    ) {
    }

    /**
     * What the tools say is the only account of what actually happened, and the one
     * thing worth reading when an operation takes minutes or stops. Handed on line
     * by line as it arrives, not collected and shown afterwards.
     */
    public function listen(?\Closure $sink): void
    {
        $this->sink = $sink;
    }

    /**
     * @param list<string>          $command
     * @param bool                  $stream      whether this is work whose output
     *                                           belongs in the log, as opposed to a
     *                                           question whose answer is read here
     * @param array<string, string> $environment what the command is told about the
     *                                           worktree it is running for
     */
    public function run(array $command, ?string $workingDirectory = null, bool $stream = false, array $environment = []): CommandResult
    {
        $process = new Process($this->wrap($command, $workingDirectory, $environment));
        $process->setTimeout($this->timeout);

        $sink = $stream ? $this->sink : null;
        $pending = '';
        $process->run($sink === null ? null : static function (string $type, string $buffer) use ($sink, &$pending): void {
            // Only whole lines are passed on: a chunk can end in the middle of one,
            // and half a line in the log is worse than a late one.
            $pending .= $buffer;
            while (($break = strpos($pending, "\n")) !== false) {
                $line = self::settled(substr($pending, 0, $break));
                $pending = substr($pending, $break + 1);
                if ($line !== '') {
                    $sink($line);
                }
            }
        });
        if ($sink !== null && trim($pending) !== '') {
            $sink(self::settled($pending));
        }

        return new CommandResult(
            $process->getExitCode() ?? 1,
            trim($process->getOutput()),
            trim($process->getErrorOutput()),
        );
    }

    /**
     * git and composer draw their progress on one line, returning to its start for
     * every step. On a terminal that is one moving line; in a log it was ninety,
     * and the interface reads the log.
     */
    public static function settled(string $line): string
    {
        $last = strrpos($line, "\r");

        return rtrim($last === false ? $line : substr($line, $last + 1));
    }

    /**
     * @param list<string>          $command
     * @param array<string, string> $environment
     *
     * @return list<string>
     */
    private function wrap(array $command, ?string $workingDirectory, array $environment = []): array
    {
        return ['docker', 'exec', ...$this->execOptions($workingDirectory, $environment), $this->containerName, ...$command];
    }

    /**
     * @param array<string, string> $environment
     *
     * @return list<string>
     */
    private function execOptions(?string $workingDirectory, array $environment = []): array
    {
        $options = ['-e', 'HOST_PROJECT_ROOT=' . $this->hostProjectRoot];
        foreach ($environment as $name => $value) {
            $options[] = '-e';
            $options[] = $name . '=' . $value;
        }
        if ($workingDirectory !== null) {
            $options[] = '-w';
            $options[] = $workingDirectory;
        }

        return $options;
    }
}
