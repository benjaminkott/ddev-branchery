<?php

declare(strict_types=1);

namespace App\Config;

use App\Jobs\StepReporter;

/**
 * What builds one worktree: the project's own file, over the shipped one it
 * names.
 *
 * Two recipes and no inheritance beyond that. The project's is read first and
 * decides everything it speaks about; where a moment says "before" or "after",
 * what the shipped one does runs in between. A project that has written no file
 * at all has none, and a worktree is then a checkout and an empty database.
 */
final readonly class Build
{
    public function __construct(
        private Recipe $own,
        /** What it is built on, or a recipe that says nothing. */
        private Recipe $shipped,
        private ?string $shippedName,
    ) {
    }

    /** What this worktree is built as, where it is built as anything named. */
    public function name(): ?string
    {
        return $this->shippedName;
    }

    /** Whether anything at all was said about how to build this. */
    public function isEmpty(): bool
    {
        return $this->shippedName === null && $this->own->isEmpty();
    }

    /**
     * The checkout's own root where nobody says otherwise: guessing at "public,
     * web, htdocs" is exactly the kind of guess this stopped making.
     */
    public function docroot(): string
    {
        return $this->own->docroot ?? $this->shipped->docroot ?? '';
    }

    /** Where the project's own binaries are. */
    public function bin(): string
    {
        return $this->own->bin ?? $this->shipped->bin ?? 'vendor/bin';
    }

    /** The version this checkout is to be served with, where one is named. */
    public function php(): ?string
    {
        return $this->own->php ?? $this->shipped->php;
    }

    /**
     * For a project whose branches do not all want the same one.
     *
     * @return ?array{read: string, match: string}
     */
    public function phpRead(): ?array
    {
        return $this->own->phpRead ?? $this->shipped->phpRead;
    }

    /** Nothing is served with it; it is what `npm` in a recipe line runs under. */
    public function node(): ?string
    {
        return $this->own->node ?? $this->shipped->node;
    }

    /**
     * @return ?array{read: string, match: string}
     */
    public function nodeRead(): ?array
    {
        return $this->own->nodeRead ?? $this->shipped->nodeRead;
    }

    /**
     * "/" is how a project says it has none although the file it is built on says
     * it has: a path that is nothing.
     */
    public function backend(): ?string
    {
        $said = $this->own->backend ?? $this->shipped->backend;

        return $said === null || $said === '/' ? null : $said;
    }

    /**
     * Per key, because one may be said without the other: a site built with TYPO3
     * may track its issues in its own tracker while its patches go to Gerrit.
     *
     * @return array{review: ?string, issue: ?string, commit: ?string}
     */
    public function links(): array
    {
        return [
            'review' => $this->own->links['review'] ?? $this->shipped->links['review'],
            'issue' => $this->own->links['issue'] ?? $this->shipped->links['issue'],
            'commit' => $this->own->links['commit'] ?? $this->shipped->links['commit'],
        ];
    }

    /** @return ?list<string> */
    public function carry(): ?array
    {
        return $this->own->carry ?? $this->shipped->carry;
    }

    /** @return list<string> */
    public function carryExcept(): array
    {
        return $this->own->carryExcept !== [] ? $this->own->carryExcept : $this->shipped->carryExcept;
    }

    /**
     * Key by key -- a project that only changes where the data comes from keeps the
     * paths the shipped file names.
     *
     * @return array{from: ?string, bring: list<string>, addresses: list<string>}
     */
    public function data(): array
    {
        $own = $this->own->data;
        $base = $this->shipped->data;

        return [
            'from' => $own['from'] ?? $base['from'],
            'bring' => $own['bring'] !== [] ? $own['bring'] : $base['bring'],
            'addresses' => $own['addresses'] !== [] ? $own['addresses'] : $base['addresses'],
        ];
    }

    /** Whether anything happens at this moment. */
    public function does(string $moment): bool
    {
        return $this->lines($moment) !== [];
    }

    /**
     * Asked so that what composer will refuse can be said before it is run. The line
     * is handed back rather than a yes, because what it says decides what counts --
     * an install without the development requirements is not missing them.
     */
    public function composerInstall(): ?string
    {
        foreach ($this->lines('install') as $command) {
            $line = $command->kind === 'composer' ? 'composer ' . $command->line : $command->line;
            if (preg_match('/(?:^|[\s\/])composer(?:\.phar)?(?:\s+--?\S+)*\s+(?:install|i)(?:\s|$)/', $line) === 1) {
                return $line;
            }
        }

        return null;
    }

    /**
     * A line that fails stops the operation: it is in the file because the worktree
     * is not finished without it. Unless it says "optional: true" -- worth having
     * and not worth the build, as an asset toolchain is for a branch whose work is
     * PHP -- and the operation then ends in a warning rather than a tick.
     *
     * Without a reporter where the caller reports nothing at all: those moments are
     * not a build and have no log.
     */
    public function at(string $moment, WorktreeContext $context, ?StepReporter $reporter = null): void
    {
        foreach ($this->lines($moment) as $command) {
            try {
                if ($command->kind === 'composer') {
                    $context->composer(...$command->arguments());
                } else {
                    $context->shell($command->line);
                }
            } catch (\RuntimeException $failure) {
                if (!$command->optional) {
                    throw $failure;
                }
                // The message names the line already, both for composer and for a shell
                // line -- see WorktreeContext.
                $reporter?->warn(sprintf('The recipe calls this line optional, and the build went on without it. %s', $failure->getMessage()));
            }
        }
    }

    /**
     * The project's plan with the inherited slot filled in: `null` is where what
     * this is built on does its own work.
     *
     * @return list<RecipeCommand>
     */
    private function lines(string $moment): array
    {
        $lines = [];
        foreach ($this->own->plan($moment) as $command) {
            if ($command !== null) {
                $lines[] = $command;

                continue;
            }
            foreach ($this->shipped->plan($moment) as $inherited) {
                if ($inherited !== null) {
                    $lines[] = $inherited;
                }
            }
        }

        return $lines;
    }
}
