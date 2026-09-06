<?php

declare(strict_types=1);

namespace App\Http;

use App\Config\Recipes;
use App\Git\Git;
use App\Installation;
use App\Jobs\JobRunner;
use App\Project;
use App\Web\Exposure;
use App\Worktree\PhpVersions;
use App\Worktree\Worktrees;

/**
 * The one answer the whole page is drawn from.
 *
 * Every other door here is about one thing and is asked for when a reader
 * presses something; this one is asked for over and over, by every tab that
 * stands open, and it reaches eight of the things this application is made of.
 * That is what it is: not a door among the others but the shape of the page,
 * and it is worth reading as one page rather than as a field in the middle of
 * a controller.
 */
final readonly class State
{
    public function __construct(
        private Project $project,
        private Worktrees $worktrees,
        private Git $git,
        private PhpVersions $php,
        private JobRunner $jobs,
        private Recipes $recipes,
        private Installation $installation,
        private Exposure $exposure,
        private Snapshot $snapshot,
    ) {
    }

    public function answer(): Response
    {
        // Through the snapshot: this is the one answer the page asks for over and
        // over, and reading it is five process starts in the web container.
        return $this->snapshot->of(fn (): Response => $this->read());
    }

    private function read(): Response
    {
        // The list before the project's own row, although it is drawn under it:
        // asked in this order the second question is answered out of what the first
        // already read -- see Git::distances().
        $worktrees = $this->worktrees->all();

        return Response::json([
            'tld' => $this->project->tld(),
            // Where the remote is nowhere to be looked at, this is the only name the
            // project has.
            'projectName' => $this->project->name(),
            'branch' => $this->git->currentBranch(),
            'project' => $this->worktrees->project(),
            'worktrees' => $worktrees,
            'branches' => $this->worktrees->availableBranches(),
            'remotes' => $this->git->remotes(),
            'repository' => $this->git->repositoryUrl(),
            'phpVersions' => $this->php->available(),
            // Everything running, not one of them: several worktrees can be worked on
            // at once, and the list marks the rows that are.
            'runningJobs' => $this->jobs->running(),
            // Read here rather than thrown: a recipe with a typo in it must show as a
            // sentence the developer can act on, not as a page that does not come up.
            'recipeProblem' => $this->recipes->problem(),
            // A project that has said nothing at all: its worktrees are a checkout and
            // an address, which is worth saying once at the top of the page.
            'unconfigured' => $this->recipes->saysNothing(),
            // Updated to another version and waiting for a restart. Said here, or a
            // developer who updated sees nothing change and cannot find out why.
            'updateWaiting' => $this->installation->updateWaiting(),
            // The one thing this application's safety rests on, asked rather than
            // assumed: null while the port is the developer's own machine's, and
            // otherwise what put it on the network beside them.
            'exposed' => $this->exposure->beyondThisMachine(),
        ]);
    }
}
