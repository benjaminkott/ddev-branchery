<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\BusyException;
use App\Http\MissingException;
use App\Http\Response;
use App\Service\Exposure;
use App\Service\Git;
use App\Service\GitOutput;
use App\Service\Installation;
use App\Service\JobRunner;
use App\Service\Locks;
use App\Service\PhpVersions;
use App\Service\Project;
use App\Service\Recipes;
use App\Service\Snapshot;
use App\Service\WorktreeManager;
use App\Service\WorktreeRepository;
use App\Service\WorktreeUsage;

/**
 * REST API of the management application. Long-running operations answer with
 * 202 and an operation id; their progress is polled through /api/jobs/{id}.
 * Which path reaches which method is written out in the router.
 */
final class ApiController
{
    public function __construct(
        private readonly Project $project,
        private readonly WorktreeRepository $worktrees,
        private readonly WorktreeManager $manager,
        private readonly PhpVersions $php,
        private readonly JobRunner $jobs,
        private readonly Git $git,
        private readonly Recipes $recipes,
        private readonly Locks $locks,
        private readonly Installation $installation,
        private readonly WorktreeUsage $usage,
        private readonly Snapshot $snapshot,
        private readonly Exposure $exposure,
    ) {
    }

    public function state(): Response
    {
        // Through the snapshot: this is the one answer the page asks for over and
        // over, and reading it is five process starts in the web container.
        return $this->snapshot->of(fn (): Response => $this->readState());
    }

    private function readState(): Response
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
        $name = $this->optionalName($payload['name'] ?? null);
        $branch = $this->text($payload, 'branch');

        if (!preg_match(self::BRANCH_PATTERN, $branch)) {
            return $this->error('Invalid branch name.');
        }

        $subject = $name ?? Project::slug($branch);

        $arguments = ['worktree:add', $branch];
        if (($payload['mode'] ?? 'branch') === 'fork') {
            $arguments = ['worktree:fork', $branch];
            $from = $this->text($payload, 'from');
            // Refused here rather than minutes later by the operation.
            if ($from !== '') {
                $this->assertWorktree($from);
            }
            if ($from !== '') {
                $arguments[] = '--from=' . $from;
            }
        }

        if ($name !== null) {
            $arguments[] = '--name=' . $name;
        }

        return $this->start($subject, $arguments);
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
        $branch = $this->text($query, 'branch');
        if (!preg_match(self::BRANCH_PATTERN, $branch)) {
            return $this->error('Invalid branch name.');
        }
        $fork = $this->text($query, 'mode') === 'fork';
        $from = $fork ? $this->text($query, 'from') : '';
        if ($from !== '') {
            $this->assertWorktree($from);
        }

        return Response::json($this->manager->foresee(
            $branch,
            $fork,
            $from === '' ? null : $from,
            $this->optionalName($query['name'] ?? null),
        ));
    }

    /** @param array<string, mixed> $payload */
    public function update(string $name, array $payload): Response
    {
        $this->assertWorktree($name);
        // Setting the version claims the worktree, and claiming waits: asked of one
        // whose dependencies are being installed, this request would hang for the
        // length of that instead of saying so.
        $this->assertFree($name);

        if (isset($payload['php'])) {
            try {
                $this->manager->setPhpVersion($name, $this->text($payload, 'php'));
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
        if (($payload['fresh'] ?? false) === true) {
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
        $from = $this->text($payload, 'from');
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

        return $this->logPage(
            $of,
            'HEAD',
            // Where the branch was cut from, so the list can say which commits are
            // this branch's own and where the base begins.
            $this->worktrees->baseOfCheckout($of)['branch'] ?? null,
            $query,
            $this->commitLink($of, $name),
        );
    }

    /**
     * One more commit than a page is read and not sent: whether there is a way
     * further is what the reader asks by looking, and asking git twice would be a
     * second process for one boolean.
     *
     * @param ?string              $of    the checkout, null for the project's own
     * @param ?string              $base  where the branch was cut from, by name
     * @param array<string, mixed> $query what stood behind the question mark
     * @param ?string              $where the address commits are read at, with
     *                                    {commit} in it
     */
    private function logPage(?string $of, string $ref, ?string $base, array $query, ?string $where): Response
    {
        $commits = $this->git->commits($of, self::COMMIT_PAGE + 1, max(0, (int) $this->text($query, 'skip')), $base, $ref);
        $more = \count($commits) > self::COMMIT_PAGE;

        return Response::json([
            'upstream' => $this->git->upstreamOf($of, $ref),
            'base' => $base,
            'more' => $more,
            'commits' => array_map(
                fn (array $commit): array => [...$commit, 'url' => $this->commitUrl($where, $commit['sha'])],
                $more ? \array_slice($commits, 0, self::COMMIT_PAGE) : $commits,
            ),
        ]);
    }

    /** How many commits a page of the log is. */
    private const int COMMIT_PAGE = 10;

    /** The only door a branch name reaches git through. */
    private const string BRANCH_PATTERN = '#^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$#';

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

        $where = $this->commitLink($of, $name);

        return Response::json([...$commit, 'url' => $this->commitUrl($where, $commit['sha'])]);
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
        $path = GitOutput::insideCheckout($this->text($query, 'path'));
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
     * The project's to say, under "links.commit": the shape of that address is the
     * forge's and not something an add-on can work out from a remote.
     */
    private function commitLink(?string $of, string $name): ?string
    {
        return $this->recipes->quietly($of === null
            ? $this->project->root()
            : $this->project->worktreeDirectory($name))->links()['commit'];
    }

    private function commitUrl(?string $where, string $sha): ?string
    {
        return $where === null ? null : str_replace('{commit}', rawurlencode($sha), $where);
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
        $path = GitOutput::insideCheckout($this->text($query, 'path'));
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
        $name = $this->text($query, 'branch');
        if (!preg_match(self::BRANCH_PATTERN, $name)) {
            return $this->error('Invalid branch name.');
        }
        $branch = $this->worktrees->branch($name);

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
        $name = $this->text($query, 'branch');
        if (!preg_match(self::BRANCH_PATTERN, $name)) {
            return $this->error('Invalid branch name.');
        }
        // The ref and not the name: a branch only on the remote is
        // "origin/feature/x" to git, and "feature/x" resolves to nothing.
        $ref = $this->git->refOf($name);
        if ($ref === null) {
            throw new MissingException('There is no such branch.');
        }

        return $this->logPage(
            null,
            $ref,
            $this->worktrees->baseOf($ref)['branch'] ?? null,
            $query,
            $this->commitLink(null, $this->project->name()),
        );
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

        $remote = trim((string) ($payload['remote'] ?? ''));
        if ($remote !== '' && !in_array($remote, $remotes, true)) {
            throw new MissingException('Unknown remote.');
        }

        return $this->accepted($this->jobs->start(
            $remote === '' ? ['git:fetch'] : ['git:fetch', $remote],
        ));
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
        return Response::json($this->jobs->state($id, max(0, (int) $this->text($query, 'since'))));
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

        return $this->start($name, $arguments);
    }

    /**
     * The refusal and the start under one lock: between the two the worktree is
     * free and nothing yet says an operation is coming, so two presses inside the
     * same moment both got past -- see Locks::STARTING. Held only for the writes
     * that make the job findable, which is what the next question reads.
     *
     * @param list<string> $arguments
     */
    private function start(string $name, array $arguments): Response
    {
        $starting = $this->locks->hold(Locks::STARTING);
        $this->assertFree($name);

        return $this->accepted($this->jobs->start($arguments, $name));
    }

    /**
     * A list where a name was expected is a malformed request, not a worktree
     * called "Array".
     *
     * @param array<string, mixed> $payload
     */
    private function text(array $payload, string $field): string
    {
        $value = $payload[$field] ?? '';

        return is_scalar($value) ? trim((string) $value) : '';
    }

    private function optionalName(mixed $value): ?string
    {
        $name = is_scalar($value) ? trim((string) $value) : '';
        if ($name === '') {
            return null;
        }
        if (!preg_match(Project::NAME_PATTERN, $name)) {
            throw new \InvalidArgumentException('The worktree name may only contain lowercase letters, digits and hyphens.');
        }

        return $name;
    }

    /**
     * Refuse a second operation on the same worktree, and only that: two worktrees
     * share nothing but the repository's own bookkeeping, which is held for the
     * moments that write it, deeper down.
     *
     * Asked of the lock rather than of a status file: an operation that died hard
     * leaves a status saying "running" that nothing clears, while a lock is let go
     * of by the kernel when its process ends.
     */
    private function assertFree(string $name): void
    {
        if ($this->locks->heldElsewhere(Locks::forWorktree($name))) {
            throw new BusyException(sprintf('Another operation on "%s" is still running.', $name));
        }
        // And the moment before the lock: an operation just started is a process
        // still booting, and takes the lock only once it has. Two presses inside
        // that moment would both be accepted.
        foreach ($this->jobs->running() as $job) {
            if ($job['subject'] === $name) {
                throw new BusyException(sprintf('Another operation on "%s" is still running.', $name));
            }
        }
    }

    private function accepted(string $job): Response
    {
        return Response::json(['job' => $job], 202, ['Location' => '/api/jobs/' . $job]);
    }

    private function error(string $message, int $status = 400): Response
    {
        return Response::json(['error' => $message], $status);
    }
}
