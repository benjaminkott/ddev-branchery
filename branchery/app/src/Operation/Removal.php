<?php

declare(strict_types=1);

namespace App\Operation;

use App\Git\Git;
use App\Jobs\StepReporter;
use App\ManagedFiles;
use App\Project;
use App\Text;
use App\Web\Databases;
use App\Web\DatabaseServer;
use App\Worktree\Traces;
use App\Worktree\Worktrees;

/**
 * Taking a worktree away, and everything that was made for it.
 *
 * Written out here rather than folded into the operations that make one,
 * because what it touches is the honest list of what a worktree is: a database,
 * a checkout, git's entry for it, the branch where it cut one, and everything
 * written down about it -- which is Traces, so that a new kind of record is
 * forgotten by being added there and not by being remembered here. Anything left
 * behind is a name that cannot be used again.
 *
 * What it does not take, unless it is told to, is work: uncommitted changes and
 * commits nothing else holds are refused or left standing, because a removal
 * typed on the command line is asked nothing first.
 *
 * The one step that must get through even when the one before it did not is the
 * directory: git refuses to remove a worktree holding a submodule or a locked
 * one, and its entry is then stale, which pruning clears.
 */
final readonly class Removal
{
    public function __construct(
        private Project $project,
        private Git $git,
        private ManagedFiles $files,
        private DatabaseServer $database,
        private Databases $databases,
        private Traces $traces,
        private Worktrees $worktrees,
        private Checks $preflight,
    ) {
    }

    /** With $force, the work that is only in this worktree goes with it. */
    public function run(string $name, StepReporter $reporter, bool $force = false): void
    {
        $branch = $this->git->inWorktree($name, 'rev-parse', '--abbrev-ref', 'HEAD')->output;
        $meta = $this->worktrees->metadata($name);
        $madeFor = (string) ($meta['branch'] ?? '');
        $deleting = $branch !== '' && $branch === $madeFor && Worktrees::ownsBranch($meta) ? $branch : null;
        $orphaned = $force ? 0 : $this->refuseLosing($name, $branch, $deleting);
        $held = null;
        if ($deleting !== null && $orphaned !== 0) {
            $held = $orphaned === null
                ? sprintf('The branch %s stays: git could not say whether its commits are anywhere else.', $deleting)
                : sprintf('The branch %s stays, because it holds commits that are nowhere else (%s). "git branch -D %s" lets go of them.', $deleting, Text::count($orphaned, 'commit'), $deleting);
            $deleting = null;
        }

        $reporter->expect(3);
        $reporter->step('Removing database');
        $this->databases->drop($this->database->nameFor($name));

        $reporter->step('Removing worktree');
        $removed = $this->git->removeWorktree($name);
        // The directory goes either way: git refuses one holding a submodule or
        // one that is locked, and its entry is then stale, which pruning clears.
        // Said in the log, a step ticking green over an error being unreadable.
        $this->files->remove($this->project->worktreeDirectory($name));
        $this->git->pruneWorktrees();
        if (!$removed->isSuccessful()) {
            $reporter->note(sprintf('git would not remove the worktree (%s); the directory was removed and the entry pruned.', $removed->message()));
        }
        $problems = [];
        if ($deleting !== null) {
            $deleted = $this->git->deleteBranch($deleting);
            if (!$deleted->isSuccessful()) {
                $problems[] = sprintf('The branch %s is still here: %s', $deleting, $deleted->message());
            }
        } elseif ($held !== null) {
            $reporter->note($held);
        } else {
            $this->sayKept($branch, $madeFor, $reporter);
        }

        $reporter->step('Cleaning up');
        $this->preflight->forgetOperations($name, $reporter);
        $this->traces->forget($name);
        // A branch left behind is the one thing here the developer has to know
        // about, so the operation fails though the rest is done.
        if ($problems !== []) {
            throw new \RuntimeException(implode(' ', $problems));
        }
        $reporter->finish();
    }

    /**
     * Refused before anything is touched, so a refusal leaves the worktree whole.
     * Answers how many commits would go with the branch being deleted -- which
     * then stays instead, since keeping it loses nothing and the rest can go.
     */
    private function refuseLosing(string $name, string $branch, ?string $deleting): ?int
    {
        $changes = $this->git->changeCount($name);
        if ($changes > 0) {
            throw new \RuntimeException(sprintf('"%s" has uncommitted changes (%s), and removing it would lose them. Commit or stash them, or remove it with --force.', $name, Text::count($changes, 'file')));
        }
        $orphaned = $this->git->orphanedBy($name, $deleting);
        // A detached checkout: its commits are held by nothing a removal could keep.
        if ($branch === 'HEAD' && $orphaned !== null && $orphaned > 0) {
            throw new \RuntimeException(sprintf('"%s" is on no branch, and its commits are held by no branch, tag or remote (%s). Put a branch on them, or remove it with --force.', $name, Text::count($orphaned, 'commit')));
        }

        return $deleting === null ? 0 : $orphaned;
    }

    /**
     * Only the branch the worktree cut goes with it: one that was here before is
     * the developer's, and one it wandered onto was never the worktree's at all.
     */
    private function sayKept(string $branch, string $madeFor, StepReporter $reporter): void
    {
        // "HEAD" is what git calls a detached checkout's branch.
        $on = $branch !== 'HEAD' ? $branch : '';
        if ($on !== '' && $on === $madeFor) {
            $reporter->note(sprintf('The branch %s stays: it was here before the worktree.', $on));

            return;
        }
        $kept = array_values(array_unique(array_filter([$on, $madeFor], static fn (string $name): bool => $name !== '')));
        if ($kept !== []) {
            $reporter->note(sprintf('%s %s: the worktree is not on the branch it was made for.', implode(' and ', $kept), count($kept) === 1 ? 'stays' : 'stay'));
        }
    }
}
