<?php

declare(strict_types=1);

namespace App\Jobs;

/**
 * How a step announces itself in a log, written and read in one place.
 *
 * It is a protocol between two processes and not a detail of either: the
 * operation writes these lines into its log file, and whoever asks about that
 * operation afterwards reads its list of steps back out of them. The writing
 * was a sprintf in StepReporter and the reading a regular expression in
 * JobRunner, with nothing between them -- so the format lived in two files and
 * was held to in neither.
 *
 * The seconds are counted from the start of the operation, which is what makes
 * a step's own duration knowable: what passed between its marker and the next.
 * They are optional in the reading, because an operation started before they
 * were written down does not carry them.
 */
final readonly class StepMarker
{
    private const string PATTERN = '/^##STEP (\d+)\/(\d+) (?:\+(\d+)s )?(.*)$/';

    /** One of them, as it goes into the log. */
    public static function line(int $no, int $total, int $seconds, string $label): string
    {
        return sprintf('##STEP %d/%d +%ds %s', $no, $total, $seconds, $label);
    }

    /**
     * One line, where it is a marker at all.
     *
     * @return ?array{no: int, total: int, seconds: int, label: string}
     */
    public static function read(string $line): ?array
    {
        return preg_match(self::PATTERN, $line, $hit) === 1 ? self::of($hit) : null;
    }

    /**
     * The last one in a stretch of log, which is the step being worked on: the
     * markers are the only thing of ours in a file the tools write into.
     *
     * @return ?array{no: int, total: int, seconds: int, label: string}
     */
    public static function last(string $log): ?array
    {
        $found = preg_match_all(self::PATTERN . 'm', $log, $matches, PREG_SET_ORDER);

        return $found === false || $found === 0 ? null : self::of($matches[$found - 1]);
    }

    /**
     * The markers as they are read rather than as they are matched. A log that is
     * only steps would otherwise arrive as an empty block.
     */
    public static function readable(string $log): string
    {
        return (string) preg_replace(self::PATTERN . 'm', '[$1/$2] $4', $log);
    }

    /**
     * @param array<int, string> $hit
     *
     * @return array{no: int, total: int, seconds: int, label: string}
     */
    private static function of(array $hit): array
    {
        return [
            'no' => (int) $hit[1],
            'total' => (int) $hit[2],
            'seconds' => (int) ($hit[3] ?? ''),
            'label' => trim($hit[4]),
        ];
    }
}
