<?php

declare(strict_types=1);

namespace App\Model;

/**
 * What a worktree holds that is not in the repository yet. Three numbers,
 * because they are three ways of losing work and removing a worktree takes all
 * three: what was never committed, what was never pushed, and -- where the
 * branch tracks nothing -- everything on it.
 */
final readonly class WorktreeState
{
    public function __construct(
        /** Files changed, added or unknown in the working copy. */
        public int $changes,
        /** Null where it tracks nothing. */
        public ?int $ahead,
        /** Null where it tracks nothing. */
        public ?int $behind,
        /**
         * Read in the same loop as the three above, and for a reason of the same
         * kind: it is what says whether the worktree was built for the code that
         * is in it now. Empty where the checkout could not be read.
         */
        public string $head = '',
        /**
         * The Change-Id Gerrit hands out, and the issue number in "Resolves:
         * #12345". Both are trailers a project either writes or does not.
         */
        public string $change = '',
        public string $issue = '',
        /**
         * Whether what a build reads has changed since: the dependencies it
         * installs from, and the recipe it is built by. Not whether the checkout
         * moved -- every commit of one's own moves it.
         */
        public bool $rebuild = false,
        /**
         * A subject names a piece of work faster than a branch name does, and it
         * is what a graph of the repository shows at every tip.
         *
         * @var ?array{sha: string, subject: string}
         */
        public ?array $tip = null,
    ) {
    }
}
