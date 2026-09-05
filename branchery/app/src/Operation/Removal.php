<?php

declare(strict_types=1);

namespace App\Operation;

use App\Git\Git;
use App\Jobs\StepReporter;
use App\ManagedFiles;
use App\Project;
use App\Web\Databases;
use App\Web\DatabaseServer;
use App\Worktree\Description;
use App\Worktree\NodeVersions;
use App\Worktree\PhpVersions;
use App\Worktree\Surroundings;
use App\Worktree\Worktrees;

/**
 * Taking a worktree away, and everything that was made for it.
 *
 * Written out here rather than folded into the operations that make one,
 * because what it touches is the honest list of what a worktree is: a database,
 * a checkout, git's entry for it, the branch, the link it was served through,
 * two version maps, its record, and what "ddev describe" says. Anything left
 * behind is a name that cannot be used again.
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
        private Worktrees $worktrees,
        private ManagedFiles $files,
        private DatabaseServer $database,
        private Databases $databases,
        private PhpVersions $php,
        private NodeVersions $node,
        private Surroundings $surroundings,
        private Description $describe,
        private Checks $preflight,
    ) {
    }

    public function run(string $name, StepReporter $reporter): void
    {
        $reporter->expect(3);
        $branch = $this->git->inWorktree($name, 'rev-parse', '--abbrev-ref', 'HEAD')->output;

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
        // "HEAD" is what git calls a detached checkout's branch; deleting one by
        // that name only writes an error into the log.
        $problems = [];
        if ($branch !== '' && $branch !== 'HEAD') {
            $deleted = $this->git->deleteBranch($branch);
            if (!$deleted->isSuccessful()) {
                $problems[] = sprintf('The branch %s is still here: %s', $branch, $deleted->message());
            }
        }

        $reporter->step('Cleaning up');
        $this->surroundings->unlinkDocroot($name);
        $this->worktrees->forget($name);
        $this->php->forget($name);
        $this->node->forget($name);
        $this->preflight->forgetOperations($name, $reporter);
        $this->describe->refresh();
        // A branch left behind is the one thing here the developer has to know
        // about, so the operation fails though the rest is done.
        if ($problems !== []) {
            throw new \RuntimeException(implode(' ', $problems));
        }
        $reporter->finish();
    }
}
