<?php

declare(strict_types=1);

namespace App\Worktree;

use App\ManagedFiles;
use App\Project;
use App\Web\DatabaseServer;

/**
 * Puts the worktrees into "ddev describe". DDEV reads x-ddev.describe-url-port
 * and x-ddev.describe-info per service and prints them in that service's row.
 *
 * What is written is not the shipped compose file but the rendered one DDEV
 * keeps beside it: the sources are merged once, at "ddev start", so a change to
 * them would only show after a restart. That file is DDEV's, so exactly one
 * thing is touched in it and the rest is left byte for byte.
 */
final readonly class Description
{
    /** The service in whose row the worktrees belong. */
    private const string SERVICE = 'branchery';

    public function __construct(
        private Project $project,
        private Worktrees $worktrees,
        private DatabaseServer $database,
        private ManagedFiles $files,
    ) {
    }

    public function refresh(): void
    {
        $file = $this->project->ddevComposeFile();
        if (!is_file($file)) {
            return;     // Nothing rendered yet -- the next start writes it.
        }

        $contents = (string) file_get_contents($file);
        $patched = $this->withExtension($contents, $this->extension());
        if ($patched === null || $patched === $contents) {
            return;
        }

        $this->files->write($file, $patched);
    }

    /**
     * The addresses go into the URL column, which is the wide one; the count goes
     * into the info column, which is a quarter of the terminal and wraps anything
     * longer.
     */
    private function extension(): string
    {
        $names = $this->worktrees->names();

        $addresses = ['Interface: ddev branchery launch'];
        if ($names !== []) {
            $addresses[] = 'Worktrees:';
            foreach ($names as $name) {
                $addresses[] = ' - ' . $this->line($name);
            }
        }

        return implode("\n", [
            '    x-ddev:',
            ...$this->literal('describe-url-port', $addresses),
            ...$this->literal('describe-info', [$this->summary(\count($names))]),
        ]);
    }

    /**
     * The metadata is enough -- git is not asked. This runs on every change and once
     * at start, and a row in a table is a display of the state, not the place to
     * establish it.
     */
    private function line(string $name): string
    {
        $meta = $this->worktrees->metadata($name);
        $facts = [];

        if (isset($meta['php']) && $meta['php'] !== '') {
            $facts[] = 'PHP ' . $meta['php'];
        }
        if (isset($meta['database']) && (string) $meta['database'] !== '') {
            $facts[] = $this->database->nameFor($name);
        }

        // The worktree's name and not the branch: the address is the docroot link,
        // which is named after the worktree. Built from the branch, this row named
        // an address nothing answers.
        $address = rtrim($this->project->urlFor($name), '/');

        return $facts === [] ? $address : sprintf('%s (%s)', $address, implode(', ', $facts));
    }

    private function summary(int $count): string
    {
        return match ($count) {
            0 => 'No worktrees',
            1 => '1 worktree',
            default => $count . ' worktrees',
        };
    }

    /**
     * A literal block -- the only style that carries several lines without bringing
     * quoting rules of its own. Its first line never starts with a space, so the
     * indentation stays unambiguous, and control characters are dropped: what goes
     * in here is branch names.
     *
     * @param list<string> $lines
     *
     * @return list<string>
     */
    private function literal(string $key, array $lines): array
    {
        $block = ['      ' . $key . ': |-'];
        foreach ($lines as $line) {
            $block[] = rtrim('        ' . preg_replace('/[[:cntrl:]]/', '', $line));
        }

        return $block;
    }

    /**
     * Touches nothing else: this file has been through DDEV's renderer, escaped
     * dollar signs and all, and reading it in and writing it back out would put its
     * own stamp on every line.
     */
    private function withExtension(string $contents, string $extension): ?string
    {
        $lines = explode("\n", $contents);
        $start = array_search('  ' . self::SERVICE . ':', $lines, true);
        if (!\is_int($start)) {
            return null;    // Not our file, or not the shape we know.
        }

        // A service ends where the next key at the same or a lower level begins.
        $end = \count($lines);
        for ($index = $start + 1; $index < \count($lines); ++$index) {
            if (preg_match('/^ {0,3}\S/', $lines[$index]) === 1) {
                $end = $index;
                break;
            }
        }

        $body = [];
        for ($index = $start + 1; $index < $end; ++$index) {
            if ($lines[$index] === '    x-ddev:') {
                // Skip what belongs to it: everything indented deeper.
                while ($index + 1 < $end && preg_match('/^ {5,}\S/', $lines[$index + 1]) === 1) {
                    ++$index;
                }
                continue;
            }
            $body[] = $lines[$index];
        }

        array_splice($lines, $start + 1, $end - $start - 1, [...$body, ...explode("\n", $extension)]);

        return implode("\n", $lines);
    }
}
