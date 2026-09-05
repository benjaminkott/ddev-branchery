<?php

declare(strict_types=1);

namespace App\Tests\Fake;

use App\Service\CommandResult;
use App\Service\WebContainer;

/**
 * A web container that runs nothing and remembers everything.
 *
 * Every operation ends in one of these calls, so what an operation does is the
 * order of the commands it runs. That order is what this holds on to: a step
 * dropped, a lock taken too late, a removal that stops asking what it is about
 * to throw away -- none of them shows up in a type and all of them show up here.
 *
 * A command nobody said anything about succeeds saying nothing, which is what
 * most of them do. What a test cares about it answers by name.
 */
final class RecordingContainer implements WebContainer
{
    /**
     * Every command, in the order they were run.
     *
     * @var list<list<string>>
     */
    public array $ran = [];

    /** @var list<array{string, CommandResult}> */
    private array $answers = [];

    /** @var (\Closure(string): void)|null */
    private ?\Closure $sink = null;

    /**
     * What to say to a command whose line carries $match. The first one that
     * matches answers, so a test may put the special case before the general one.
     */
    public function answer(string $match, string $output = '', int $exitCode = 0, string $errorOutput = ''): self
    {
        $this->answers[] = [$match, new CommandResult($exitCode, $output, $errorOutput)];

        return $this;
    }

    public function listen(?\Closure $sink): void
    {
        $this->sink = $sink;
    }

    /**
     * @param list<string>          $command
     * @param array<string, string> $environment
     */
    public function run(array $command, ?string $workingDirectory = null, bool $stream = false, array $environment = []): CommandResult
    {
        $this->ran[] = $command;
        $result = $this->answerTo(implode(' ', $command));

        // As the real one does: what work writes goes into the operation's log,
        // and a step whose output never arrives reads as a step that did nothing.
        $sink = $this->sink;
        if ($stream && $sink !== null && $result->output !== '') {
            foreach (explode("\n", $result->output) as $line) {
                $sink($line);
            }
        }

        return $result;
    }

    private function answerTo(string $line): CommandResult
    {
        foreach ($this->answers as [$match, $result]) {
            if (str_contains($line, $match)) {
                return $result;
            }
        }

        return new CommandResult(0, '');
    }

    /**
     * What was run, one line each -- which is the form an expectation is written
     * in and the form a failure is read in.
     *
     * @return list<string>
     */
    public function lines(): array
    {
        return array_map(static fn (array $command): string => implode(' ', $command), $this->ran);
    }

    /** Where in the order a command carrying $match stands, or null for never. */
    public function at(string $match): ?int
    {
        foreach ($this->lines() as $index => $line) {
            if (str_contains($line, $match)) {
                return $index;
            }
        }

        return null;
    }

    public function ran(string $match): bool
    {
        return $this->at($match) !== null;
    }
}
