<?php

declare(strict_types=1);

namespace App\Model;

/** A checked-out branch together with everything that makes it run. */
final readonly class Worktree implements \JsonSerializable
{
    public function __construct(
        public string $name,
        public string $branch,
        /**
         * Not always the one it is on: a checkout is where a patch is tried, and
         * afterwards the worktree called "14-3", served at 14-3.… and with a
         * database named after it, is sitting on something else. Null for the
         * project's own checkout, which is nobody's to move.
         */
        public ?string $madeFor,
        public string $php,
        public ?string $minPhp,
        /**
         * Where the container has one at all. Nothing is served with it -- it is
         * what an `npm` line in the recipe was run with.
         */
        public ?string $node,
        /** Its own database on the project's server. */
        public string $database,
        public ?string $profile,
        public string $docroot,
        public string $url,
        /**
         * Where a worktree is opened all day, in the order the configuration
         * offers them. Derived from what it says rather than guessed at.
         *
         * @var list<array{name: string, url: string}>
         */
        public array $entrypoints,
        /**
         * Where it lies as the host sees it: whoever works in several worktrees
         * changes directory far more often than they open a page, and the
         * container's own view -- /var/www/html/... -- would be wrong for that.
         */
        public string $path,
        /**
         * What opens that directory on the machine the page is read on, in the
         * order they are offered. Empty where nothing does -- see App\Worktree\Editors.
         *
         * @var list<array{name: string, url: string}>
         */
        public array $editors = [],
        public int $changes = 0,
        /**
         * Null where the branch tracks nothing -- then it is not "in step" but
         * "nowhere else", which is a different answer entirely.
         */
        public ?int $ahead = null,
        public ?int $behind = null,
        public bool $ready = false,
        /** The project's own checkout -- it cannot be removed. */
        public bool $isProject = false,
        /** Removing the worktree would lose nothing that is not kept elsewhere. */
        public bool $merged = false,
        /**
         * What a review workflow leaves behind when a pull request is squashed
         * and its branch deleted -- and the commits are then nowhere in the base
         * under their own names.
         */
        public bool $gone = false,
        /**
         * A worktree is provisioned for the code that was in it at the time: its
         * dependencies come from that composer.lock and its schema from that
         * state of the application. Pull a fortnight of work in and both are for
         * other code, which nothing on the outside shows.
         */
        public ?int $builtAt = null,
        public bool $stale = false,
        /**
         * A build was begun here and never got to its end -- or is running now,
         * which is the same fact. "Built" used to mean a vendor directory, which
         * is what a build has after its first step, so a worktree whose asset
         * toolchain died looked exactly like a finished one.
         */
        public bool $incomplete = false,
        /**
         * As addresses rather than as numbers to copy somewhere. Null where the
         * commit says nothing, or where the project has not said where they live.
         */
        public ?string $review = null,
        public ?string $issue = null,
        /** The issue's number, which is what the way to it is called. */
        public ?string $issueId = null,
        /**
         * The branch, and the commit it stood on then. git remembers no parent
         * for a branch, so it is written down when the cut is made -- and null
         * for a worktree of a branch that already existed.
         */
        public ?string $forkedFrom = null,
        public ?string $forkedAt = null,
        /**
         * What a graph says with a lane, said in three words. Null for the trunk
         * itself, which is cut from nothing.
         *
         * @var ?array{branch: string, own: int, moved: int}
         */
        public ?array $base = null,
        /**
         * @var ?array{sha: string, subject: string}
         */
        public ?array $tip = null,
        /**
         * The login of this worktree: its own name, and the one development
         * password. Null where the configuration says nothing about how an
         * account is made -- there is then nothing to offer and nothing to state.
         *
         * "made" is the difference between a login that opens the application and
         * one that would if it were asked for: a worktree that inherited a
         * database inherited its accounts, and nobody here knows their passwords.
         *
         * @var ?array{user: string, password: string, made: bool}
         */
        public ?array $account = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            'name' => $this->name,
            'branch' => $this->branch,
            'madeFor' => $this->madeFor,
            'php' => $this->php,
            'minPhp' => $this->minPhp,
            'node' => $this->node,
            'database' => $this->database,
            'profile' => $this->profile,
            'docroot' => $this->docroot,
            'url' => $this->url,
            'entrypoints' => $this->entrypoints,
            'path' => $this->path,
            'editors' => $this->editors,
            'changes' => $this->changes,
            'ahead' => $this->ahead,
            'behind' => $this->behind,
            'ready' => $this->ready,
            'isProject' => $this->isProject,
            'merged' => $this->merged,
            'gone' => $this->gone,
            'builtAt' => $this->builtAt,
            'stale' => $this->stale,
            'incomplete' => $this->incomplete,
            'review' => $this->review,
            'issue' => $this->issue,
            'issueId' => $this->issueId,
            'forkedFrom' => $this->forkedFrom,
            'forkedAt' => $this->forkedAt,
            'base' => $this->base,
            'tip' => $this->tip,
            'account' => $this->account,
        ];
    }
}
