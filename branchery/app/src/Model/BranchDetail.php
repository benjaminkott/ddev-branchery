<?php

declare(strict_types=1);

namespace App\Model;

/**
 * One branch, as the page about it reads it: what is asked when somebody wants
 * to look into a branch before checking it out. Everything a worktree would add
 * is absent because it does not exist, and drawing those fields with dashes in
 * them would claim something is missing.
 */
final readonly class BranchDetail implements \JsonSerializable
{
    public function __construct(
        public Branch $branch,
        /**
         * As the list says it about a worktree.
         *
         * @var ?array{branch: string, own: int, moved: int}
         */
        public ?array $base = null,
        /** Null where it tracks none. */
        public ?string $upstream = null,
        /** Commits it has that the upstream has not, and the other way round. */
        public ?int $ahead = null,
        public ?int $behind = null,
        /** Every commit is in the project's own branch. */
        public bool $merged = false,
        /** It tracked a remote branch and the remote has it no longer. */
        public bool $gone = false,
        /**
         * A branch with a worktree is read on that worktree's page, and this leads
         * there: the list this page is reached from holds only branches without
         * one, but an address outlives the list it was read in.
         */
        public ?string $worktree = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            ...$this->branch->jsonSerialize(),
            'base' => $this->base,
            'upstream' => $this->upstream,
            'ahead' => $this->ahead,
            'behind' => $this->behind,
            'merged' => $this->merged,
            'gone' => $this->gone,
            'worktree' => $this->worktree,
        ];
    }
}
