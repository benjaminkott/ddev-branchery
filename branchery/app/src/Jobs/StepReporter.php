<?php

declare(strict_types=1);

namespace App\Jobs;

use Symfony\Component\Console\Formatter\OutputFormatter;

/**
 * Reports the progress of an operation.
 *
 * Two readers, one stream, and every line is written in both forms at once: the
 * marker the interface turns into a list of steps, which StepMarker spells, and
 * the readable form a terminal shows. Which of the two goes where is the
 * writer's to decide -- decided here, an operation run from a terminal left a
 * log the interface could not read a single step out of.
 */
final class StepReporter
{
    private int $total = 0;
    private int $current = 0;
    private readonly float $startedAt;

    /**
     * What the operation could not do although it went on.
     *
     * @var list<string>
     */
    private array $concerns = [];

    /** What would take an operation that stopped from where it stopped. */
    private ?string $resume = null;

    /**
     * Given every line twice: as the log has it, and as a terminal shows it.
     *
     * @var callable(string, string): void
     */
    private $writer;

    /**
     * @param bool $verbose whether the reader asked for every line ("-v"):
     *                      what is said either way is what the operation did,
     *                      what is said only then is what it did it to
     */
    public function __construct(?callable $writer = null, private readonly bool $verbose = false)
    {
        $this->writer = $writer ?? static function (string $line): void {
            echo $line, "\n";
            flush();
        };
        $this->startedAt = microtime(true);
    }

    public function expect(int $total): void
    {
        $this->total = $total;
        $this->current = 0;
    }

    public function step(string $label): void
    {
        ++$this->current;
        ($this->writer)(
            StepMarker::line($this->current, $this->total, $this->elapsed(), self::text($label)),
            sprintf('<fg=cyan;options=bold>[%d/%d]</> <options=bold>%s</>', $this->current, $this->total, self::text($label)),
        );
    }

    public function finish(string $label = 'Done'): void
    {
        // The step it is on, not the number it expected: an operation that ends
        // early has fewer steps than it announced, and a marker for one it never
        // took would be read as a step of its own. In the colour of what it ended
        // as -- a green tick over work half done is the ending nobody reads twice.
        ($this->writer)(
            StepMarker::line($this->current, $this->current, $this->elapsed(), self::text($label)),
            sprintf(
                $this->concerns === [] ? '<fg=green;options=bold>✓ %s</>' : '<fg=yellow;options=bold>⚠ %s</>',
                self::text($label),
            ),
        );
    }

    /** Seconds since the operation began. */
    private function elapsed(): int
    {
        return (int) round(microtime(true) - $this->startedAt);
    }

    public function note(string $message): void
    {
        ($this->writer)('→ ' . self::text($message), sprintf('<fg=cyan>→</> %s', self::text($message)));
    }

    /**
     * A note that takes back part of what the operation promises: the pool the
     * checkout asked for is not there, a line the recipe called optional failed.
     * Kept, so whoever writes the closing line can say what it stands on --
     * otherwise the operation ends in a green tick over an address that cannot work.
     */
    public function warn(string $message): void
    {
        $this->concerns[] = $message;
        ($this->writer)('⚠ ' . self::text($message), sprintf('<fg=yellow;options=bold>⚠</> %s', self::text($message)));
    }

    /**
     * @return list<string>
     */
    public function concerns(): array
    {
        return $this->concerns;
    }

    /**
     * Said by the operation itself and only once there is something to resume: a
     * worktree that exists on disk and is not finished. Whoever ends the operation
     * has to say it, at the moment the reader is looking.
     */
    public function resumeWith(string $command): void
    {
        $this->resume = $command;
    }

    public function resume(): ?string
    {
        return $this->resume;
    }

    /**
     * The list of what a fork carries over is a thousand paths in a project whose
     * ignore rules name files. The note says what travels in one line; this is the
     * line per entry, under "-v".
     */
    public function detail(string $message): void
    {
        if (!$this->verbose) {
            return;
        }
        ($this->writer)('  ' . self::text($message), sprintf('  <fg=gray>%s</>', self::text($message)));
    }

    /**
     * A line one of the tools wrote, as it wrote it: what sets these apart is that
     * they carry no mark and no colour.
     */
    public function output(string $line): void
    {
        ($this->writer)(self::text($line), self::text($line));
    }

    /**
     * Text from somewhere else, so a tool writing "<info>" is read as the word it
     * is and not as markup. The console resolves this again on the way out.
     */
    private static function text(string $value): string
    {
        return OutputFormatter::escape($value);
    }
}
