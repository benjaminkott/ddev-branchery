<?php

declare(strict_types=1);

namespace App\Git;

use App\CommandResult;
use App\Jobs\Locks;
use App\Project;

/**
 * Everything that changes the repository: worktrees made and taken away,
 * branches cut, deleted and moved, and the fetch that writes the remote refs.
 *
 * Every one of these holds Locks::REPOSITORY, and holds it for the moment the
 * write takes rather than for the operation around it -- that is what lets two
 * worktrees be built at the same time while git's own bookkeeping is only ever
 * written by one of them.
 *
 * None of them says anything about dropping what was read before: the Runner
 * tells whoever kept an answer, which is why a method added here cannot forget.
 */
final readonly class Repository
{
    public function __construct(
        private Project $project,
        private Runner $runner,
        private Locks $locks,
    ) {
    }

    public function fetch(string $remote): CommandResult
    {
        // Writes the remote refs every worktree reads.
        $lock = $this->locks->hold(Locks::REPOSITORY);

        return $this->runner->work('fetch', $remote, '--prune');
    }

    /**
     * The one operation here that takes something away: unpushed commits are left
     * in no branch, findable through `git reflog` and only for a while.
     */
    public function resetToUpstream(string $name): CommandResult
    {
        return $this->runner->workInWorktree($name, 'reset', '--hard', '@{upstream}');
    }

    /**
     * `--ff-only`, so a branch that has moved on its own is refused rather than
     * merged or rebased: which of the two it should be is the developer's call.
     */
    public function fastForward(string $name): CommandResult
    {
        return $this->runner->workInWorktree($name, 'merge', '--ff-only', '@{upstream}');
    }

    /**
     * `switch` and not `checkout`: it refuses a path given by mistake, and says no
     * where the working copy would have to be carried along or written over.
     */
    public function switchBranch(string $name, string $branch): CommandResult
    {
        $lock = $this->locks->hold(Locks::REPOSITORY);

        return $this->runner->workInWorktree($name, 'switch', $branch);
    }

    /**
     * Exactly as it stands. `worktree add -B` would reset the branch onto its
     * remote and drop unpushed commits silently.
     */
    public function addExistingBranch(string $name, string $branch): CommandResult
    {
        return $this->checkOut($name, ['worktree', 'add', $this->pathFor($name), $branch]);
    }

    /** A worktree of a branch that does not exist yet, cut at a start point. */
    public function addNewBranch(string $name, string $branch, string $startPoint): CommandResult
    {
        return $this->checkOut($name, ['worktree', 'add', '-b', $branch, $this->pathFor($name), $startPoint]);
    }

    /**
     * What git says is handed back: it refuses one holding a submodule or one that
     * is locked, and the caller decides what to do with the directory.
     */
    public function removeWorktree(string $name): CommandResult
    {
        $lock = $this->locks->hold(Locks::REPOSITORY);

        return $this->runner->work('worktree', 'remove', '--force', $this->project->hostWorktreeDirectory($name));
    }

    public function pruneWorktrees(): void
    {
        $lock = $this->locks->hold(Locks::REPOSITORY);
        $this->runner->work('worktree', 'prune');
    }

    public function deleteBranch(string $branch): CommandResult
    {
        $lock = $this->locks->hold(Locks::REPOSITORY);

        return $this->runner->work('branch', '-D', $branch);
    }

    private function pathFor(string $name): string
    {
        return $this->project->hostWorktreeDirectory($name);
    }

    /**
     * @param list<string> $arguments
     */
    private function checkOut(string $name, array $arguments): CommandResult
    {
        // Writes the repository's list of worktrees and creates the branch. Over
        // in a moment, so the lock is here and not around the operation.
        $lock = $this->locks->hold(Locks::REPOSITORY);
        // A worktree deleted by hand is still in git's list, and blocks adding one
        // at the same path.
        $this->runner->work('worktree', 'prune');
        $result = $this->runner->work(...$arguments);
        if ($result->isSuccessful()) {
            $this->repairPaths($name);
        }

        return $result;
    }

    /**
     * git resolves symlinks when adding a worktree, so the container path ends up
     * in its bookkeeping and the host counts the worktree prunable. Both references
     * are reset to the host path here.
     */
    public function repairPaths(string $name): void
    {
        $hostRoot = $this->project->hostRoot();
        $seenHere = $this->project->root();
        if ($hostRoot === $seenHere) {
            return;
        }

        // Quoted for the shell, a project path being the developer's to choose, and
        // escaped for sed, which reads "&" in a replacement as the text it matched.
        $from = GitOutput::sedPattern($seenHere);
        $to = GitOutput::sedReplacement($hostRoot);
        $result = $this->runner->shell(sprintf(
            'gitfile=%s/.git; ' .
            '[ -f "$gitfile" ] || exit 0; ' .
            'sed -i %s "$gitfile" && ' .
            'admin=$(sed -n "s|^gitdir: ||p" "$gitfile") && ' .
            '{ [ ! -f "$admin/gitdir" ] || sed -i %s "$admin/gitdir"; }',
            escapeshellarg($this->project->hostWorktreeDirectory($name)),
            escapeshellarg(sprintf('s|^gitdir: %s|gitdir: %s|', $from, $to)),
            escapeshellarg(sprintf('s|^%s|%s|', $from, $to)),
        ));
        // git's own bookkeeping was edited by hand here rather than by git, so
        // what was read of it before is said to be old the same way.
        $this->runner->wrote();
        // Unrepaired, the host counts the worktree prunable and finds it on no
        // branch. Neither says why, so this does.
        if (!$result->isSuccessful()) {
            throw new \RuntimeException(sprintf('Repairing the paths of the worktree "%s": %s', $name, $result->message()));
        }
    }
}
