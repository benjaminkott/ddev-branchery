<?php

declare(strict_types=1);

namespace App\Operation;

use App\Git\Git;
use App\Jobs\Lock;
use App\Jobs\Locks;
use App\Jobs\StepReporter;
use App\ManagedFiles;
use App\Model\Worktree;
use App\Project;
use App\Worktree\Worktrees;

/**
 * Every operation on a worktree, as the order of its steps.
 *
 * What is written here is that order and nothing else: which question is asked
 * before which thing is made, which lock is held while it is, and which step
 * stops the rest. That order is what an operation *is* -- the checkout before
 * anything is installed into it, the question before a database is dropped, the
 * branch deleted after the checkout it was in -- and it is the one thing about
 * this application that neither the types nor the analyser can say a word
 * about. So it stands on one page, and everything it is made of lives in
 * App\Operation, one named thing at a time.
 */
final readonly class WorktreeManager
{
    public function __construct(
        private Project $project,
        private Git $git,
        private Worktrees $worktrees,
        private ManagedFiles $files,
        private Locks $locks,
        private Checks $preflight,
        private CopiedFiles $copied,
        private Provisioning $provisioning,
        private Removal $removal,
        private BranchMoves $branches,
        private DataTransfer $data,
    ) {
    }

    /**
     * Held here and not by the caller, so no way in can forget it. The repository
     * is deliberately not held: it is taken only for the moments that write its
     * bookkeeping, so operations on different worktrees run side by side.
     */
    private function claim(string $name, ?StepReporter $reporter = null): Lock
    {
        return $this->locks->hold(
            Locks::forWorktree($name),
            // Only where it actually has to wait -- silence for as long as somebody
            // else's build takes reads as a tool that has stopped.
            static fn () => $reporter?->note(sprintf('Waiting: another operation on "%s" is still running.', $name)),
        );
    }

    /** Claimed before it is asked whether it is still there -- see assertExists(). */
    private function claimExisting(string $name, ?StepReporter $reporter = null): Lock
    {
        Project::assertName($name);
        $claim = $this->claim($name, $reporter);
        $this->assertExists($name);

        return $claim;
    }

    /**
     * Copying out of a checkout being rebuilt is how half of one state arrives in
     * another. Always in the same order, so two operations cannot each hold what
     * the other waits for.
     *
     * @return list<Lock>
     */
    private function claimWith(string $name, ?string $source, ?StepReporter $reporter = null): array
    {
        $names = $source === null || $source === $name ? [$name] : [$name, $source];
        sort($names);

        return array_map(fn (string $held): Lock => $this->claim($held, $reporter), $names);
    }

    public function add(string $branch, ?string $name, StepReporter $reporter): Worktree
    {
        $name = $name ?: Project::slug($branch);
        $claim = $this->claim($name, $reporter);
        $this->assertNew($name, $branch);

        $startPoint = $this->startPointFor($branch);
        $here = $startPoint === $branch;

        $reporter->expect(8);
        $reporter->step('Reading what the branch needs');
        $build = $this->preflight->asked($startPoint);
        $php = $this->preflight->phpFor($build, sprintf('Branch "%s"', $branch), $reporter);
        $this->preflight->checkLockAt($build, $startPoint, $reporter);
        $this->preflight->assertDatabaseFree($name, $reporter);
        $this->preflight->forgetOperations($name, $reporter);

        $reporter->step(sprintf('Checking out worktree (%s)', $here ? $branch . ', as it stands here' : $startPoint));
        $this->files->ensureIgnoredDirectory($this->project->worktreesDirectory());
        $result = $here
            ? $this->git->addExistingBranch($name, $branch)
            : $this->git->addNewBranch($name, $branch, $startPoint);
        if (!$result->isSuccessful()) {
            throw new \RuntimeException($result->message());
        }

        $this->provisioning->run($name, $branch, Provisioning::PROJECT_SOURCE, $php, $reporter);

        return $this->worktrees->get($name) ?? throw new \RuntimeException('Worktree disappeared.');
    }

    /** Without a source the project checkout applies, and its data is carried over. */
    public function fork(string $newBranch, ?string $from, ?string $name, StepReporter $reporter): Worktree
    {
        if ($from !== null) {
            Project::assertName($from);
        }
        $name = $name ?: Project::slug($newBranch);
        $claims = $this->claimWith($name, $from, $reporter);
        $this->assertNew($name, $newBranch);
        if ($from !== null) {
            $this->assertExists($from);
        }

        if ($this->git->hasRef('refs/heads/' . $newBranch)) {
            throw new \InvalidArgumentException(sprintf('Branch "%s" already exists.', $newBranch));
        }
        // And one only on the remote: git would cut a local branch of that name
        // without a word, and the first push collides with it.
        if ($this->git->refOf($newBranch) !== null) {
            throw new \InvalidArgumentException(sprintf('Branch "%s" already exists on the remote. "worktree:add %s" checks it out.', $newBranch, $newBranch));
        }

        $base = $this->baseFor($from);

        $reporter->expect(9);
        $reporter->step('Reading what the branch needs');
        $build = $this->preflight->asked($base);
        $php = $this->preflight->phpFor($build, sprintf('Branch "%s"', $newBranch), $reporter);
        $this->preflight->checkLockCarried($build, $base, $from, $name, $reporter);
        $this->preflight->assertDatabaseFree($name, $reporter);
        $this->preflight->forgetOperations($name, $reporter);

        $reporter->step(sprintf('Creating branch "%s" (%s)', $newBranch, substr($base, 0, 11)));
        $this->files->ensureIgnoredDirectory($this->project->worktreesDirectory());
        $result = $this->git->addNewBranch($name, $newBranch, $base);
        if (!$result->isSuccessful()) {
            throw new \RuntimeException($result->message());
        }
        // git keeps no parent for a branch, and "what did I branch this off" is
        // the first question asked about a worktree a fortnight later.
        $origin = $from !== null ? $this->branchIn($from) : $this->git->currentBranch();
        $this->worktrees->store($name, ['forkedFrom' => $origin, 'forkedAt' => $base]);
        $reporter->note(sprintf('Branched from %s at %s.', $origin, substr($base, 0, 11)));

        // What git ignores is what gets carried, so nothing is missing in a
        // project this add-on knows nothing about.
        $reporter->step('Carrying over unversioned files');
        $this->copied->copy($from, $name, $reporter);

        $this->provisioning->run($name, $newBranch, $from ?? Provisioning::PROJECT_SOURCE, $php, $reporter);

        return $this->worktrees->get($name) ?? throw new \RuntimeException('Worktree disappeared.');
    }

    /**
     * With `$fresh` the database goes with it and the application is installed into
     * an empty one; without it the data stays and is fitted to the code.
     */
    public function provision(string $name, bool $fresh, StepReporter $reporter): Worktree
    {
        $claim = $this->claimExisting($name, $reporter);
        $branch = $this->madeFor($name);

        $reporter->expect(7);
        $reporter->step('Reading what the worktree needs');
        $build = $this->preflight->buildFor($name);
        $php = $this->preflight->phpFor($build, sprintf('Worktree "%s"', $name), $reporter);
        $this->preflight->checkLockIn($name, $build, $reporter);

        $this->provisioning->run($name, $branch, null, $php, $reporter, $fresh);

        return $this->worktrees->get($name) ?? throw new \RuntimeException('Worktree disappeared.');
    }

    public function remove(string $name, StepReporter $reporter): void
    {
        $claim = $this->claimExisting($name, $reporter);

        $this->removal->run($name, $reporter);
    }

    /** Only refresh the generated configuration, without rebuilding. */
    public function reconfigure(string $name): void
    {
        $claim = $this->claimExisting($name);

        $this->provisioning->reconfigure($name, $this->madeFor($name));
    }

    public function setPhpVersion(string $name, string $version): void
    {
        $claim = $this->claimExisting($name);

        $this->provisioning->setPhpVersion($name, $version);
    }

    /**
     * The fetch and the move, and deliberately not the rest of a build -- the list
     * already has a word for new code against an old vendor directory, and a
     * catch-up that costs minutes is one nobody makes.
     */
    public function pull(string $name, StepReporter $reporter): void
    {
        $claim = $this->claimExisting($name, $reporter);

        $this->branches->pull($name, $reporter);
    }

    public function restoreBranch(string $name, StepReporter $reporter): void
    {
        $claim = $this->claimExisting($name, $reporter);

        $this->branches->restore($name, $reporter);
    }

    public function discardUnpushed(string $name, StepReporter $reporter): void
    {
        $claim = $this->claimExisting($name, $reporter);

        $this->branches->discard($name, $reporter);
    }

    /** What it overwrites is gone: the caller has been asked before it gets here. */
    public function syncDatabase(string $name, ?string $from, StepReporter $reporter): void
    {
        Project::assertName($name);
        if ($from !== null) {
            Project::assertName($from);
        }
        // Its own data as the source means dropping it and copying it back out of
        // nothing.
        if ($from === $name) {
            throw new \InvalidArgumentException('A worktree cannot take its data from itself.');
        }
        $claims = $this->claimWith($name, $from, $reporter);
        // Asked once the worktree is ours: one that waited behind a removal would
        // otherwise rebuild what the removal just took away.
        $this->assertExists($name);
        if ($from !== null) {
            $this->assertExists($from);
        }

        $this->data->sync($name, $from, $this->madeFor($name), $reporter);
    }

    /**
     * @return array<string, int> database name => number of tables in it
     */
    public function orphanedDatabases(): array
    {
        return $this->data->orphaned();
    }

    public function dropDatabase(string $database): void
    {
        $this->data->drop($database);
    }

    /**
     * What creating a worktree would find out first, without creating it: a version
     * the image has no pool for, a database left over, a lock file composer will
     * refuse. The same code the first step runs, so the summary says beforehand
     * what the operation would say after the press.
     *
     * A refusal is a warning here and not an exception: the reader decides.
     *
     * @return array{php: ?string, readFrom: ?string, warnings: list<string>}
     */
    public function foresee(string $branch, bool $fork, ?string $from, ?string $name): array
    {
        if ($from !== null) {
            Project::assertName($from);
            $this->assertExists($from);
        }
        $name = $name ?: Project::slug($branch);
        $reporter = new StepReporter(static function (): void {});
        $refusals = [];
        // The one refusal about the name itself, said here rather than a press later.
        try {
            $this->project->assertNotItself($name);
        } catch (\InvalidArgumentException $refusal) {
            $refusals[] = $refusal->getMessage();
        }
        $php = null;

        $ref = $fork ? $this->baseFor($from) : $this->startPointFor($branch);
        $build = $this->preflight->asked($ref);
        try {
            $php = $this->preflight->phpFor($build, sprintf('Branch "%s"', $branch), $reporter);
            if ($fork) {
                $this->preflight->checkLockCarried($build, $ref, $from, $name, $reporter);
            } else {
                $this->preflight->checkLockAt($build, $ref, $reporter);
            }
            $this->preflight->assertDatabaseFree($name, $reporter);
        } catch (\RuntimeException $refusal) {
            $refusals[] = $refusal->getMessage();
        }

        // Where the version is pointed at rather than written down, nothing can be
        // said until the checkout is there to read it from.
        $readFrom = $build->phpRead()['read'] ?? null;

        return [
            'php' => $php ?? ($readFrom === null ? $this->preflight->projectPhp() : null),
            'readFrom' => $readFrom,
            'warnings' => [...$reporter->concerns(), ...$refusals],
        ];
    }

    /**
     * A branch that is here is taken as it stands; pointing it back at its remote
     * is how unpushed commits disappear.
     */
    private function startPointFor(string $branch): string
    {
        return $this->git->refOf($branch)
            ?? throw new \InvalidArgumentException(sprintf('Branch "%s" is unknown.', $branch));
    }

    private function baseFor(?string $from): string
    {
        return $from !== null
            ? $this->git->inWorktree($from, 'rev-parse', 'HEAD')->output
            : $this->git->run('rev-parse', 'HEAD')->output;
    }

    private function branchIn(string $name): string
    {
        return $this->git->inWorktree($name, 'rev-parse', '--abbrev-ref', 'HEAD')->output;
    }

    /**
     * Falling back to the one it is on. A checkout that wandered onto a patch is
     * still the worktree of the branch it is named after, and keeps that address,
     * database and record.
     */
    private function madeFor(string $name): string
    {
        return (string) ($this->worktrees->metadata($name)['branch'] ?? $this->branchIn($name));
    }

    /**
     * Asked after the worktree is ours, because the operation this one waits behind
     * may be the removal -- metadata, a docroot link and a database would then be
     * written for a directory that had just gone.
     */
    private function assertExists(string $name): void
    {
        if (!$this->worktrees->exists($name)) {
            throw new \InvalidArgumentException(sprintf('Worktree "%s" does not exist.', $name));
        }
    }

    private function assertNew(string $name, string $branch): void
    {
        if ($name === '') {
            throw new \InvalidArgumentException(sprintf('No name can be derived from "%s".', $branch));
        }
        // The same rule the interface applies, asked again because the command
        // line is the other door: the name becomes a hostname, a directory and a
        // database name.
        if (preg_match(Project::NAME_PATTERN, $name) !== 1) {
            throw new \InvalidArgumentException(sprintf('"%s" is not a name a worktree can have: lowercase letters, digits and hyphens only.', $name));
        }
        $this->project->assertNotItself($name);
        if ($this->worktrees->exists($name)) {
            throw new \InvalidArgumentException(sprintf('Worktree "%s" already exists.', $name));
        }
    }
}
