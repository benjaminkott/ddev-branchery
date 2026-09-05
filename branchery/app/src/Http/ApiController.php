<?php

declare(strict_types=1);

namespace App\Http;

use App\Git\Git;
use App\Git\GitOutput;
use App\Jobs\JobRunner;
use App\Operation\WorktreeManager;
use App\Project;
use App\Worktree\CommitPages;
use App\Worktree\PhpVersions;
use App\Worktree\Usage;
use App\Worktree\Worktrees;

/**
 * REST API of the management application. Long-running operations answer with
 * 202 and an operation id; their progress is polled through /api/jobs/{id}.
 * Which path reaches which method is written out in the router.
 *
 * What is left here is one method per door and nothing else. What every door
 * needs -- reading what the caller wrote, beginning an operation, a page of a
 * log -- stands beside it, because written out at each door those were the
 * same rule as many times as there are doors, and a door that forgot one of
 * them was a door nothing could see was wrong.
 */
final class ApiController
{
    public function __construct(
        private readonly Project $project,
        private readonly Worktrees $worktrees,
        private readonly WorktreeManager $manager,
        private readonly PhpVersions $php,
        private readonly JobRunner $jobs,
        private readonly Git $git,
        private readonly Usage $usage,
        private readonly State $state,
        private readonly Operations $starting,
        private readonly CommitPages $pages,
    ) {
    }

    public function state(): Response
    {
        return $this->state->answer();
    }

    public function list(): Response
    {
        return Response::json($this->worktrees->all());
    }

    /** The space owned by one worktree, excluding resources the project shares. */
    public function usage(string $name): Response
    {
        $this->assertWorktree($name);

        return Response::json($this->usage->of($name));
    }

    /** @param array<string, mixed> $payload */
    public function create(array $payload): Response
    {
        $asked = Parameters::of($payload);
        $name = $asked->name();
        $branch = $asked->branch();
        $subject = $name ?? Project::slug($branch);

        $arguments = ['worktree:add', $branch];
        if ($asked->text('mode') === 'fork') {
            $arguments = ['worktree:fork', $branch];
            $from = $asked->text('from');
            if ($from !== '') {
                // Refused here rather than minutes later by the operation.
                $this->assertWorktree($from);
                $arguments[] = '--from=' . $from;
            }
        }

        if ($name !== null) {
            $arguments[] = '--name=' . $name;
        }

        return $this->starting->on($subject, $arguments);
    }

    /**
     * The same questions the operation's first step asks, answered to the summary
     * in the dialog: which version it will be served with, and what would stop the
     * build -- a lock file composer refuses, a pool the image has not, a database
     * left over under this name.
     *
     * @param array<string, mixed> $query
     */
    public function preview(array $query): Response
    {
        $asked = Parameters::of($query);
        $branch = $asked->branch();
        $fork = $asked->text('mode') === 'fork';
        $from = $fork ? $asked->text('from') : '';
        if ($from !== '') {
            $this->assertWorktree($from);
        }

        return Response::json($this->manager->foresee($branch, $fork, $from === '' ? null : $from, $asked->name()));
    }

    /** @param array<string, mixed> $payload */
    public function update(string $name, array $payload): Response
    {
        $this->assertWorktree($name);
        // Setting the version claims the worktree, and claiming waits: asked of one
        // whose dependencies are being installed, this request would hang for the
        // length of that instead of saying so.
        $this->starting->assertFree($name);

        $asked = Parameters::of($payload);
        if ($asked->has('php')) {
            try {
                $this->manager->setPhpVersion($name, $asked->text('php'));
            } catch (\InvalidArgumentException $exception) {
                return $this->error($exception->getMessage());
            }

            return Response::json(['ok' => true]);
        }

        return $this->error('Nothing to change.');
    }

    /**
     * With "fresh" the database goes with it -- the caller has been asked before it
     * gets this far.
     *
     * @param array<string, mixed> $payload
     */
    public function provision(string $name, array $payload = []): Response
    {
        $arguments = ['worktree:provision', $name];
        if (Parameters::of($payload)->flag('fresh')) {
            $arguments[] = '--fresh';
        }

        return $this->operate($name, $arguments);
    }

    /**
     * What it overwrites is gone, so nothing else is touched here: the caller has
     * been asked before it gets this far.
     *
     * @param array<string, mixed> $payload
     */
    public function sync(string $name, array $payload = []): Response
    {
        $from = Parameters::of($payload)->text('from');
        if ($from !== '') {
            $this->assertWorktree($from);
        }
        if ($from === $name) {
            return $this->error('A worktree cannot take its data from itself.');
        }

        return $this->operate(
            $name,
            $from === '' ? ['database:sync', $name] : ['database:sync', $name, '--from=' . $from],
        );
    }

    /**
     * Nothing is asked of the caller first, because nothing here can be lost: the
     * operation moves the branch or refuses to, and says which.
     */
    public function pull(string $name): Response
    {
        return $this->operate($name, ['worktree:pull', $name]);
    }

    /**
     * Refused where the worktree is on that branch already, which is the only thing
     * the caller could get wrong.
     */
    public function restore(string $name): Response
    {
        return $this->operate($name, ['worktree:restore', $name]);
    }

    /**
     * The caller has been asked before it gets this far -- it is the one operation
     * whose whole subject is losing something.
     */
    public function discard(string $name): Response
    {
        return $this->operate($name, ['worktree:discard', $name]);
    }

    /**
     * What turns "1 unpushed" into the commit it is. The upstream comes along
     * because the question asked before dropping commits has to name what the
     * branch would be put back onto, and that is not always the one of the same name.
     *
     * @param array<string, mixed> $query
     */
    public function commits(string $name, array $query = []): Response
    {
        $of = $this->checkoutOf($name);

        return Response::json($this->pages->page(
            $of,
            'HEAD',
            // Where the branch was cut from, so the list can say which commits are
            // this branch's own and where the base begins.
            $this->worktrees->baseOfCheckout($of)['branch'] ?? null,
            Parameters::of($query)->number('skip'),
            $name,
        ));
    }

    /**
     * The page behind one subject: the message as it was written, the commits
     * before it, and the files it touched. Not the changes themselves -- those are
     * a door each, a commit touching two hundred files being unreadable in full.
     */
    public function commit(string $name, string $sha): Response
    {
        $of = $this->checkoutOf($name);
        $revision = GitOutput::asSha($sha);
        if ($revision === null) {
            return $this->error('That is not a commit hash.');
        }
        $commit = $this->git->commit($of, $revision);
        if ($commit === null) {
            // Not an error about a command that failed: an address with a sha in it
            // outlives the branch it was read on.
            throw new MissingException('This branch has no such commit.');
        }

        return Response::json([...$commit, 'url' => $this->pages->urlOf($of, $name, $commit['sha'])]);
    }

    /**
     * @param array<string, mixed> $query
     */
    public function commitDiff(string $name, string $sha, array $query): Response
    {
        $of = $this->checkoutOf($name);
        $revision = GitOutput::asSha($sha);
        if ($revision === null) {
            return $this->error('That is not a commit hash.');
        }
        $path = GitOutput::insideCheckout(Parameters::of($query)->text('path'));
        if ($path === null) {
            return $this->error('The path has to name a file inside the checkout.');
        }
        // The same answer the page about the commit gives for a sha this branch no
        // longer carries -- not git's "bad object", which would read as a fault of
        // the server.
        if (!$this->git->hasCommit($of, $revision)) {
            throw new MissingException('This branch has no such commit.');
        }

        return Response::json(['path' => $path, ...$this->git->commitDiff($of, $revision, $path)]);
    }

    /**
     * The row says "12 uncommitted", and whether that is the afternoon's work or a
     * stray cache file is a question only the paths answer.
     */
    public function changes(string $name): Response
    {
        $of = $this->checkoutOf($name);

        return Response::json(['changes' => $this->git->changes($of)]);
    }

    /**
     * @param array<string, mixed> $query
     */
    public function changeDiff(string $name, array $query): Response
    {
        $of = $this->checkoutOf($name);
        $path = GitOutput::insideCheckout(Parameters::of($query)->text('path'));
        if ($path === null) {
            return $this->error('The path has to name a file inside the checkout.');
        }

        return Response::json(['path' => $path, ...$this->git->diff($of, $path)]);
    }

    /**
     * Null for the project's own and the name for a worktree, the way git is asked.
     * A name that is neither is refused here rather than answered with `false`,
     * which made this three things at once.
     */
    private function checkoutOf(string $name): ?string
    {
        if ($name === $this->project->name()) {
            return null;
        }
        $this->assertWorktree($name);

        return $name;
    }

    /** The worktree this is about, or the refusal for a name that is none. */
    private function assertWorktree(string $name): void
    {
        if (!$this->worktrees->exists($name)) {
            throw new MissingException('Unknown worktree.');
        }
    }

    /**
     * The one door under a worktree that does not refuse a name it does not know: a
     * history outlives the thing it is about, and its last entry is usually the
     * removal.
     */
    public function worktreeJobs(string $name): Response
    {
        return Response::json($this->jobs->history($name));
    }

    public function remove(string $name): Response
    {
        return $this->operate($name, ['worktree:remove', $name]);
    }

    public function branches(): Response
    {
        return Response::json($this->worktrees->availableBranches());
    }

    /**
     * The question it answers is the one that otherwise costs a worktree: what is on
     * this branch, where did it come from, is it in the trunk already. Nothing here
     * needs a checkout -- one repository holds every branch's commits.
     *
     * @param array<string, mixed> $query
     */
    public function branch(array $query): Response
    {
        $branch = $this->worktrees->branch(Parameters::of($query)->branch());

        if ($branch === null) {
            throw new MissingException('There is no such branch.');
        }

        return Response::json($branch);
    }

    /**
     * Read out of the project's own checkout, the branch having none of its own.
     *
     * @param array<string, mixed> $query
     */
    public function branchCommits(array $query): Response
    {
        $asked = Parameters::of($query);
        // The ref and not the name: a branch only on the remote is
        // "origin/feature/x" to git, and "feature/x" resolves to nothing.
        $ref = $this->git->refOf($asked->branch());
        if ($ref === null) {
            throw new MissingException('There is no such branch.');
        }

        return Response::json($this->pages->page(
            null,
            $ref,
            $this->worktrees->baseOf($ref)['branch'] ?? null,
            $asked->number('skip'),
            $this->project->name(),
        ));
    }

    /**
     * A name is only taken when the repository knows it: what may reach git here is
     * one of the strings git itself just listed, never one the request brought along.
     *
     * @param array<string, mixed> $payload
     */
    public function fetch(array $payload = []): Response
    {
        $remotes = $this->git->remotes();
        if ($remotes === []) {
            return $this->error('The repository has no remote to fetch from.');
        }

        $remote = Parameters::of($payload)->text('remote');
        if ($remote !== '' && !in_array($remote, $remotes, true)) {
            throw new MissingException('Unknown remote.');
        }

        return $this->starting->alone($remote === '' ? ['git:fetch'] : ['git:fetch', $remote]);
    }

    public function phpVersions(): Response
    {
        return Response::json($this->php->available());
    }

    /**
     * Asked once a second while an operation runs, so it is asked for what has
     * happened since rather than for everything again -- "since" is what the last
     * answer reported as its size.
     *
     * @param array<string, mixed> $query
     */
    public function job(string $id, array $query = []): Response
    {
        return Response::json($this->jobs->state($id, Parameters::of($query)->number('since')));
    }

    /**
     * Every one begins the same way: the worktree has to be there, and nothing else
     * may be working on it.
     *
     * @param list<string> $arguments
     */
    private function operate(string $name, array $arguments): Response
    {
        $this->assertWorktree($name);

        return $this->starting->on($name, $arguments);
    }

    private function error(string $message, int $status = 400): Response
    {
        return Response::json(['error' => $message], $status);
    }
}
