<?php

declare(strict_types=1);

namespace App\Worktree;

/**
 * Everything written down about a worktree, forgotten in one go.
 *
 * A worktree is more than its checkout: a link it is served through, a map per
 * tool saying which version it runs on, its own record, and a line in what
 * "ddev describe" says. Each of those is written somewhere else, and a name
 * whose record survived its checkout is a name that cannot be used again -- so
 * the list stands here rather than at the far end of a removal, where a new
 * kind of record has to be remembered onto it.
 */
final readonly class Traces
{
    public function __construct(
        private Surroundings $surroundings,
        private Worktrees $worktrees,
        private PhpVersions $php,
        private NodeVersions $node,
        private Description $describe,
    ) {
    }

    public function forget(string $name): void
    {
        $this->surroundings->unlinkDocroot($name);
        $this->worktrees->forget($name);
        $this->php->forget($name);
        $this->node->forget($name);
        // Last, because what the project says about its worktrees is read out of
        // what the four above have just changed.
        $this->describe->refresh();
    }
}
