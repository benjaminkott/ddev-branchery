<?php

declare(strict_types=1);

namespace App\Service;

use App\Model\Worktree;
use App\Text;

/**
 * Creates worktrees, branches them off, provisions them and removes them again.
 * Every operation is a sequence of steps, and the one that stops takes the rest
 * with it. What a worktree gets besides its code belongs to Surroundings.
 */
final readonly class WorktreeManager
{
    /** Marks the project checkout as the source. */
    private const string PROJECT_SOURCE = '@project';

    public function __construct(
        private Project $project,
        private Git $git,
        private WorktreeRepository $worktrees,
        private Recipes $recipes,
        private ProjectDatabase $database,
        private DatabaseOperations $databaseOperations,
        private PhpVersions $php,
        private NodeVersions $node,
        private ManagedFiles $files,
        private WebContainer $web,
        private DescribeInfo $describe,
        private Surroundings $surroundings,
        private SshAgent $ssh,
        private Locks $locks,
        private JobRunner $jobs,
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
        $build = $this->phpAsked($startPoint);
        $php = $this->phpFor($build, sprintf('Branch "%s"', $branch), $reporter);
        $this->checkLockAt($build, $startPoint, $reporter);
        $this->assertDatabaseFree($name, $reporter);
        $this->forgetOperations($name, $reporter);

        $reporter->step(sprintf('Checking out worktree (%s)', $here ? $branch . ', as it stands here' : $startPoint));
        $this->files->ensureIgnoredDirectory($this->project->worktreesDirectory());
        $result = $here
            ? $this->git->addExistingBranch($name, $branch)
            : $this->git->addNewBranch($name, $branch, $startPoint);
        if (!$result->isSuccessful()) {
            throw new \RuntimeException($result->message());
        }

        $this->provisionInternal($name, $branch, self::PROJECT_SOURCE, $php, $reporter);

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
        $build = $this->phpAsked($base);
        $php = $this->phpFor($build, sprintf('Branch "%s"', $newBranch), $reporter);
        $this->checkLockCarried($build, $base, $from, $name, $reporter);
        $this->assertDatabaseFree($name, $reporter);
        $this->forgetOperations($name, $reporter);

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
        $directory = $this->project->worktreeDirectory($name);
        $without = $this->leftBehind($directory);
        $entries = $this->carried($from, $directory, $without);
        // How many, not which: ignore rules that name files make a thousand lines.
        $reporter->note($entries === [] ? 'Nothing to carry over.' : sprintf('%s carried over.', Text::count(\count($entries), 'entry', 'entries')));
        foreach ($entries as $entry) {
            $reporter->detail($entry);
        }
        $source = $from !== null
            ? $this->project->hostWorktreeDirectory($from)
            : $this->project->hostRoot();
        $target = $this->project->hostWorktreeDirectory($name);
        // tar and not cp, for the one thing cp cannot do: leave out something that
        // lies *inside* what is being copied, such as ".Build/var". Anchored, so a
        // path means the one place it names.
        $excludes = implode(' ', array_map(
            static fn (string $path): string => '--exclude=' . escapeshellarg($path),
            $without,
        ));
        // One archive rather than a container round trip per entry. What is not
        // there is left out here, so tar is never asked for something it would
        // refuse the whole run over.
        $here = $from !== null ? $this->project->worktreeDirectory($from) : $this->project->root();
        $present = array_values(array_filter($entries, static fn (string $entry): bool => file_exists($here . '/' . $entry)));
        if ($present !== []) {
            // pipefail, and checked: a copy that stops halfway leaves half a vendor
            // directory under a tick saying the worktree is ready.
            $copied = $this->web->run(['bash', '-c', sprintf(
                'set -o pipefail; cd %1$s && tar -cf - --anchored %2$s -- %3$s | (cd %4$s && tar -xf -)',
                escapeshellarg($source),
                $excludes,
                implode(' ', array_map('escapeshellarg', $present)),
                escapeshellarg($target),
            )]);
            if (!$copied->isSuccessful()) {
                throw new \RuntimeException(sprintf('Carrying over the unversioned files: %s', $copied->message()));
            }
        }

        $this->provisionInternal($name, $newBranch, $from ?? self::PROJECT_SOURCE, $php, $reporter);

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

        $directory = $this->project->worktreeDirectory($name);

        $reporter->expect(7);
        $reporter->step('Reading what the worktree needs');
        $build = $this->recipes->for($directory);
        $php = $this->phpFor($build, sprintf('Worktree "%s"', $name), $reporter);
        $this->checkLock(
            $build,
            is_file($directory . '/composer.json') ? (string) file_get_contents($directory . '/composer.json') : null,
            is_file($directory . '/composer.lock') ? (string) file_get_contents($directory . '/composer.lock') : null,
            'composer.lock in this worktree',
            'in it',
            $reporter,
        );

        $this->provisionInternal(
            $name,
            $branch,
            null,
            $php,
            $reporter,
            $fresh,
        );

        return $this->worktrees->get($name) ?? throw new \RuntimeException('Worktree disappeared.');
    }

    public function remove(string $name, StepReporter $reporter): void
    {
        $claim = $this->claimExisting($name, $reporter);

        $reporter->expect(3);
        $branch = $this->branchIn($name);

        $reporter->step('Removing database');
        $this->databaseOperations->drop($this->database->nameFor($name));

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
        $this->forgetOperations($name, $reporter);
        $this->describe->refresh();
        // A branch left behind is the one thing here the developer has to know
        // about, so the operation fails though the rest is done.
        if ($problems !== []) {
            throw new \RuntimeException(implode(' ', $problems));
        }
        $reporter->finish();
    }

    /** Only refresh the generated configuration, without rebuilding. */
    public function reconfigure(string $name): void
    {
        $claim = $this->claimExisting($name);
        $branch = $this->madeFor($name);
        $directory = $this->project->worktreeDirectory($name);
        $build = $this->recipes->for($directory);

        $context = $this->context($name, $branch);
        $this->git->repairPaths($name);
        $build->at('configure', $context);
        // Generated configuration like any other: they carry the address and the
        // path the debugger maps, and both can have moved.
        $this->surroundings->writeEditorConfiguration($name, $context->url);
        // What the configuration says now and not what was stored at build time:
        // this is how a moved docroot reaches the link.
        $docroot = $build->docroot();
        $this->worktrees->store($name, ['docroot' => $docroot]);
        $this->surroundings->linkDocroot($name, $docroot);
        $this->surroundings->retargetSites($name, $context->url, $build->data()['addresses']);
        $build->at('flush', $context);
        $this->describe->refresh();
    }

    public function setPhpVersion(string $name, string $version): void
    {
        $claim = $this->claimExisting($name);
        $worktree = $this->worktrees->get($name) ?? throw new \RuntimeException('Worktree disappeared.');

        if (!$this->php->isAllowed($version, $worktree->minPhp)) {
            throw new \InvalidArgumentException(sprintf('The dependencies of this worktree require at least PHP %s. With %s every request would abort.', $worktree->minPhp, $version));
        }
        if (!in_array($version, $this->php->available(), true)) {
            throw new \InvalidArgumentException(sprintf('The web image has no php-fpm for PHP %s.', $version));
        }

        $this->php->assign($name, $version);
        $this->worktrees->store($name, ['php' => $version]);

        // Compiled caches can hold traces of the version it ran on before.
        $this->recipes->quietly($this->project->worktreeDirectory($name))
            ->at('flush', $this->context($name, $worktree->branch));
        $this->describe->refresh();
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
        $build = $this->phpAsked($ref);
        try {
            $php = $this->phpFor($build, sprintf('Branch "%s"', $branch), $reporter);
            if ($fork) {
                $this->checkLockCarried($build, $ref, $from, $name, $reporter);
            } else {
                $this->checkLockAt($build, $ref, $reporter);
            }
            $this->assertDatabaseFree($name, $reporter);
        } catch (\RuntimeException $refusal) {
            $refusals[] = $refusal->getMessage();
        }

        // Where the version is pointed at rather than written down, nothing can be
        // said until the checkout is there to read it from.
        $readFrom = $build->phpRead()['read'] ?? null;

        return [
            'php' => $php ?? ($readFrom === null ? $this->php->projectVersion() : null),
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

    private function checkLockAt(Build $build, string $ref, StepReporter $reporter): void
    {
        $this->checkLock(
            $build,
            $this->git->fileAt($ref, 'composer.json'),
            $this->git->fileAt($ref, 'composer.lock'),
            sprintf('composer.lock on %s', $ref),
            'on that branch, committed,',
            $reporter,
        );
    }

    /**
     * Not always a file the branch has: a project that keeps composer.lock out of
     * its repository still has one on disk, and the fork carries it over like
     * everything else git ignores. Read from where it will actually come from.
     */
    private function checkLockCarried(Build $build, string $base, ?string $from, string $name, StepReporter $reporter): void
    {
        $json = $this->git->fileAt($base, 'composer.json');
        $lock = $this->git->fileAt($base, 'composer.lock');
        $branch = $from !== null ? $this->branchIn($from) : $this->git->currentBranch();
        $what = sprintf('composer.lock on %s', $branch);
        $where = sprintf('on %s, committed,', $branch);

        if ($lock === null) {
            $sourceDirectory = $from !== null ? $this->project->worktreeDirectory($from) : $this->project->root();
            $file = $sourceDirectory . '/composer.lock';
            $directory = $this->project->worktreeDirectory($name);
            if (is_file($file) && in_array('composer.lock', $this->carried($from, $directory, $this->leftBehind($directory)), true)) {
                $source = $from !== null ? sprintf('worktree "%s"', $from) : 'the project checkout';
                $lock = (string) file_get_contents($file);
                $what = sprintf('The composer.lock carried over from %s', $source);
                $where = sprintf('in %s', $source);
            }
        }

        $this->checkLock($build, $json, $lock, $what, $where, $reporter);
    }

    /**
     * A warning and not a refusal: the lock file is fixed in a checkout, and for a
     * branch only on the remote this worktree is the one place to fix it.
     *
     * @param ?string $json  composer.json as the worktree will have it
     * @param ?string $lock  composer.lock as the worktree will have it, or null
     *                       where composer resolves the dependencies itself
     * @param string  $what  the lock file, named by where it comes from
     * @param string  $where where the fix is made, as the end of a sentence
     */
    private function checkLock(Build $build, ?string $json, ?string $lock, string $what, string $where, StepReporter $reporter): void
    {
        $line = $build->composerInstall();
        if ($line === null || $json === null || $lock === null) {
            return;
        }
        $missing = LockFile::missing($json, $lock, !str_contains($line, '--no-dev'));
        if ($missing === []) {
            return;
        }
        $reporter->warn(sprintf(
            '%s lacks %s, which composer.json requires. composer install refuses such a lock file, so the build will stop at the dependencies -- "composer update %s" %s puts it right.',
            $what,
            implode(', ', $missing),
            implode(' ', $missing),
            $where,
        ));
    }

    /**
     * First of every operation, because at this point there is no worktree, branch
     * or database yet -- found out later it leaves a checkout standing half-built.
     * Where the version is pointed at rather than written down, the answer comes
     * after the checkout.
     */
    private function phpFor(Build $build, string $subject, StepReporter $reporter): ?string
    {
        $said = $build->php();
        if ($said === null) {
            // Pointed at is not nothing asked for: saying "the project's own" here was
            // read as the decision.
            $where = $build->phpRead();
            $reporter->note($where === null
                ? 'No version asked for; the project\'s own applies.'
                : sprintf('The version is written in %s; it is read once the checkout is there.', $where['read']));

            return null;
        }

        $available = $this->php->available();
        if (!in_array($said, $available, true)) {
            throw new \RuntimeException(sprintf('%s asks for PHP %s, and the web image has no pool for it -- only %s. Nothing was created.', $subject, $said, implode(', ', $available)));
        }
        $reporter->note(sprintf('Asks for PHP %s.', $said));

        return $said;
    }

    /**
     * The branch's own file where it carries one, the project's where it does not,
     * and the shipped file either of them names.
     */
    private function phpAsked(string $ref): Build
    {
        $said = $this->git->fileAt($ref, Recipe::FILE);

        return $said === null
            ? $this->recipes->for($this->project->root())
            : $this->recipes->build(Recipe::fromString($said));
    }

    /**
     * A checkout deleted by hand, an operation that broke off, the add-on
     * uninstalled. Nothing but this would ever mention them again.
     *
     * @return array<string, int> database name => number of tables in it
     */
    public function orphanedDatabases(): array
    {
        $taken = [];
        foreach ($this->worktrees->names() as $name) {
            $taken[$this->database->nameFor($name)] = true;
        }

        $orphans = [];
        foreach ($this->databaseOperations->owned() as $database) {
            if (!isset($taken[$database])) {
                $orphans[$database] = $this->databaseOperations->tables($database);
            }
        }

        return $orphans;
    }

    /** Only ever what this add-on made. */
    public function dropDatabase(string $database): void
    {
        if (!str_starts_with($database, ProjectDatabase::PREFIX)) {
            throw new \InvalidArgumentException(sprintf('"%s" is not a database of this add-on.', $database));
        }

        $this->databaseOperations->drop($database);
    }

    /**
     * Kept, it would become the history of whatever is given that name next. Done
     * on removal and again on creation, which sweeps up the one operation the first
     * pass cannot take: its own removal, still running while it runs.
     */
    private function forgetOperations(string $name, StepReporter $reporter): void
    {
        $forgotten = $this->jobs->forget($name);
        if ($forgotten > 0) {
            $reporter->note(sprintf('Forgot the record of %s under this name.', Text::count($forgotten, 'earlier operation')));
        }
    }

    /**
     * Another worktree whose name is cut to the same one, or a database left on the
     * server. An empty one is taken over without a word; one with tables in it is
     * somebody's data, and this is the last moment saying so costs nothing.
     */
    private function assertDatabaseFree(string $name, StepReporter $reporter): void
    {
        $database = $this->database->nameFor($name);

        foreach ($this->worktrees->names() as $existing) {
            if ($existing !== $name && $this->database->nameFor($existing) === $database) {
                throw new \RuntimeException(sprintf('"%s" and the existing worktree "%s" would both be given the database %s. Pick a different name for this one (--name).', $name, $existing, $database));
            }
        }

        $tables = $this->databaseOperations->tables($database);
        if ($tables > 0) {
            // Our prefix, no worktree of that name: one of ours that outlived it.
            throw new \RuntimeException(sprintf('The database %s already exists and holds %s. It is left over from a worktree that is not here any more -- "ddev branchery database:prune" lists what that is, "ddev branchery database:prune --drop" removes it. Or create this worktree under a different name (--name). Nothing was created.', $database, Text::count($tables, 'table')));
        }

        $reporter->note(sprintf('Database: %s%s', $database, $tables === 0 ? ' (exists, empty)' : ''));
    }

    /**
     * The fetch and the move, and deliberately not the rest of a build -- the list
     * already has a word for new code against an old vendor directory, and a
     * catch-up that costs minutes is one nobody makes.
     *
     * Refused where moving the branch would be more than moving it, git answering
     * that with "Not possible to fast-forward" and nothing about what to do.
     */
    public function pull(string $name, StepReporter $reporter): void
    {
        $claim = $this->claimExisting($name, $reporter);

        $branch = $this->branchIn($name);
        $upstream = $this->git->upstreamOf($name);
        if ($upstream === null) {
            throw new \RuntimeException(sprintf('"%s" follows no remote branch, so there is nothing to bring in. Push it once and it will.', $branch));
        }

        $reporter->expect(2);
        $this->bringUpToDate($name, $branch, $upstream, $reporter);
        $reporter->finish();
    }

    /**
     * The way back out of trying a patch, after which the worktree called "14-3",
     * served at 14-3.… and holding a database named after it, is on something else.
     * The branch it leaves stays where it is: this moves the checkout, not the work.
     */
    public function restoreBranch(string $name, StepReporter $reporter): void
    {
        $claim = $this->claimExisting($name, $reporter);

        $meta = $this->worktrees->metadata($name);
        $wanted = (string) ($meta['branch'] ?? '');
        if ($wanted === '') {
            throw new \RuntimeException(sprintf('Nothing was written down about which branch "%s" was made for, so there is nowhere to go back to.', $name));
        }

        $left = $this->branchIn($name);
        if ($left === $wanted) {
            throw new \RuntimeException(sprintf('"%s" is on %s already.', $name, $wanted));
        }

        // git would refuse this itself, but with a path rather than the name. The
        // key is a worktree name, and one made of digits comes back as an integer.
        $elsewhere = array_search($wanted, $this->git->worktreeBranches(), true);
        if ($elsewhere !== false && (string) $elsewhere !== $name) {
            throw new \RuntimeException(sprintf('%s is checked out in "%s". A branch can only be in one worktree at a time.', $wanted, (string) $elsewhere));
        }

        $reporter->expect(3);
        $reporter->step(sprintf('Going back to %s', $wanted));
        $switched = $this->git->switchBranch($name, $wanted);
        if (!$switched->isSuccessful()) {
            throw new \RuntimeException($switched->message());
        }
        $reporter->note(sprintf('%s stays where it is; nothing committed on it is lost.', $left));

        // Worth having with nothing to bring in: a branch that was never pushed is
        // exactly the kind a worktree is made for.
        $upstream = $this->git->upstreamOf($name);
        if ($upstream === null) {
            $reporter->note(sprintf('%s follows no remote branch, so there is nothing to bring in.', $wanted));
            $reporter->finish();

            return;
        }

        $this->bringUpToDate($name, $wanted, $upstream, $reporter);
        $reporter->finish();
    }

    /**
     * A press of its own and not a corner of the catch-up, because rebasing or
     * letting go is not the tool's choice to make. The commits are left in no
     * branch and `git reflog` finds them until git collects; uncommitted work has
     * no such second chance, so an unclean working copy is refused.
     */
    public function discardUnpushed(string $name, StepReporter $reporter): void
    {
        $claim = $this->claimExisting($name, $reporter);

        $branch = $this->branchIn($name);
        $upstream = $this->git->upstreamOf($name);
        if ($upstream === null) {
            throw new \RuntimeException(sprintf('"%s" follows no remote branch. Everything on it is here and nowhere else, so there is nothing to put it back onto.', $branch));
        }

        // Only what the reset would write over: an untracked file stays.
        $changes = $this->git->modifiedCount($name);
        if ($changes > 0) {
            throw new \RuntimeException(sprintf('%s in this worktree were never committed, and putting the branch back would write over them. Commit or stash them first.', Text::count($changes, 'change')));
        }

        $reporter->expect(2);
        $this->fetchUpstream($upstream, $reporter);

        $reporter->step(sprintf('Putting %s back on %s', $branch, $upstream));
        $distance = $this->git->tracking($name);
        $ahead = $distance[0] ?? 0;
        $behind = $distance[1] ?? 0;
        if ($ahead === 0 && $behind === 0) {
            $reporter->note(sprintf('%s is already what %s has.', $branch, $upstream));
            $reporter->finish();

            return;
        }

        $dropped = $this->git->unpushed($name);
        $reset = $this->git->resetToUpstream($name);
        if (!$reset->isSuccessful()) {
            throw new \RuntimeException($reset->message());
        }

        foreach ($dropped as $commit) {
            $reporter->note(sprintf('Dropped %s %s', $commit['sha'], $commit['subject']));
        }
        if ($ahead > 0) {
            $reporter->note(sprintf('%s no longer in any branch. "git reflog" in this worktree still finds them until git next collects.', Text::count($ahead, 'commit')));
        }
        $reporter->finish();
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
     * Shared by the two operations that end in them. It neither claims the worktree
     * nor finishes the report: only the caller knows how many steps there are.
     */
    private function bringUpToDate(string $name, string $branch, string $upstream, StepReporter $reporter): void
    {
        $this->fetchUpstream($upstream, $reporter);

        $reporter->step(sprintf('Moving %s onto %s', $branch, $upstream));
        $distance = $this->git->tracking($name);
        $ahead = $distance[0] ?? 0;
        $behind = $distance[1] ?? 0;
        if ($ahead > 0 && $behind > 0) {
            throw new \RuntimeException(sprintf('%s and %s have gone their own ways -- %s here, %s there. Merging or rebasing that is yours to decide, in the worktree itself.', $branch, $upstream, Text::count($ahead, 'commit'), Text::count($behind, 'commit')));
        }
        if ($behind === 0) {
            $reporter->note(sprintf('%s is already what %s has.', $branch, $upstream));

            return;
        }

        $moved = $this->git->fastForward($name);
        if (!$moved->isSuccessful()) {
            throw new \RuntimeException($moved->message());
        }

        // What was built is now built from something else; the row says so from
        // here on, and offers provisioning again.
        $reporter->note(sprintf('%s brought in. The dependencies and the database are still the ones of before.', Text::count($behind, 'commit')));
    }

    /**
     * A remote name cannot hold a slash and a branch name can, so what stands
     * before the first one is the remote -- "origin" out of "origin/feature/search".
     */
    private function fetchUpstream(string $upstream, StepReporter $reporter): void
    {
        $remote = strstr($upstream, '/', true) ?: $upstream;
        $reporter->step(sprintf('Updating %s', $remote));
        $fetched = $this->git->fetch($remote);
        if (!$fetched->isSuccessful()) {
            throw new \RuntimeException($this->ssh->explain($remote, $fetched->message(), $reporter));
        }
    }

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

        $branch = $this->madeFor($name);
        $source = $from !== null ? $this->database->nameFor($from) : ProjectDatabase::PROJECT_DATABASE;
        $target = $this->database->nameFor($name);
        $context = $this->context($name, $branch);

        $build = $this->recipes->for($this->project->worktreeDirectory($name));
        $data = $build->data();

        $reporter->expect(4);
        $reporter->step(sprintf('Copying %s into %s', $source, $target));
        $this->reportDistance($branch, $from, $reporter);
        $this->databaseOperations->replace($source, $target);

        // A site points at its root page by uid, and those uids came with the
        // data -- so what reads them comes along, its addresses put back on ours.
        $reporter->step('Putting the addresses back');
        $this->surroundings->bring($from, $name, $data['bring']);
        $this->retargetSites($name, $context->url, $data['addresses'], $reporter);

        // The data was written by another state of the code, and half of it would
        // be read against a shape it does not have.
        $reporter->step('Fitting the data to this code');
        $build->at('migrate', $context, $reporter);

        $reporter->step('Flushing caches');
        $build->at('flush', $context, $reporter);
        $reporter->finish();
    }

    /**
     * What the branch changed since -- a column that moved, a setting read
     * differently -- surfaces as errors in a worktree the reader believes is
     * freshly set up. Said up front, so those errors are explicable.
     */
    private function reportDistance(string $branch, ?string $from, StepReporter $reporter): void
    {
        $source = $from !== null ? $this->branchIn($from) : $this->git->currentBranch();
        if ($branch === '' || $source === '' || $branch === $source) {
            return;
        }

        // A branch that never met the other makes rev-list fail rather than count,
        // and a warning is not worth ending an operation over.
        $distance = $this->git->run('rev-list', '--count', $branch . '..' . $source);
        if (!$distance->isSuccessful()) {
            return;
        }

        $behind = (int) $distance->output;
        if ($behind > 0) {
            $reporter->note(sprintf(
                'This branch is %s behind %s, and the data was written by that state of the code. What does not fit will show as errors.',
                Text::count($behind, 'commit'),
                $source,
            ));
        }
    }

    private function provisionInternal(
        string $name,
        string $branch,
        ?string $copyFrom,
        ?string $php,
        StepReporter $reporter,
        bool $fresh = false,
    ): void {
        $directory = $this->project->worktreeDirectory($name);
        // Written down first, so an operation that stops halfway still leaves a
        // worktree the list can name -- including that it is being built, cleared
        // only at the far end of this method. Otherwise a checkout whose npm step
        // died looks exactly like a finished one.
        $this->worktrees->store($name, ['name' => $name, 'branch' => $branch, 'building' => time()]);
        // The point at which the worktree exists on disk; before it there is
        // nothing to resume.
        $reporter->resumeWith(sprintf('ddev branchery worktree:provision %s', $name));

        $reporter->step('Reading how this is built');
        $build = $this->recipes->for($directory);
        $docroot = $build->docroot();
        $reporter->note(sprintf(
            '%s%s',
            $build->name() ?? ($build->isEmpty() ? 'No configuration: this is a checkout and an address.' : 'The project\'s own configuration'),
            $docroot !== '' ? sprintf(' (docroot: %s)', $docroot) : '',
        ));
        $this->worktrees->store($name, [
            'profile' => $build->name(),
            'docroot' => $docroot,
            'database' => $this->database->nameFor($name),
        ]);
        $this->surroundings->linkDocroot($name, $docroot);

        $reporter->step('Choosing the versions');
        $this->choosePhpVersion($name, $build, $php, $reporter);
        $this->chooseNodeVersion($name, $build, $reporter);

        $context = $this->context($name, $branch);

        $reporter->step('Installing dependencies');
        $build->at('install', $context, $reporter);

        $reporter->step('Writing the configuration');
        $build->at('configure', $context, $reporter);
        $this->surroundings->writeEditorConfiguration($name, $context->url);

        $reporter->step(sprintf('Preparing the database (%s)', $context->databaseName));
        if ($fresh) {
            // Asked for in the interface with what it costs written out.
            $reporter->note(sprintf('Dropping %s -- the application is installed anew.', $context->databaseName));
            $this->databaseOperations->drop($context->databaseName);
        }
        $this->databaseOperations->create($context->databaseName);

        $data = $build->data();
        // Nothing is copied unless the configuration asks for it: a database a
        // checkout cannot read is worse than an empty one.
        $sourceDatabase = match (true) {
            $copyFrom === null, $data['from'] !== 'source' => null,
            $copyFrom === self::PROJECT_SOURCE => ProjectDatabase::PROJECT_DATABASE,
            default => $this->database->nameFor($copyFrom),
        };
        // Asked for and nothing to take: a fresh installation is what it needs.
        if ($sourceDatabase !== null && $this->databaseOperations->tables($sourceDatabase) <= 0) {
            $reporter->note(sprintf('%s holds no data; the application is installed instead.', $sourceDatabase));
            $sourceDatabase = null;
        }

        if ($sourceDatabase !== null) {
            $reporter->note(sprintf('Copying the database from %s', $sourceDatabase));
            $this->databaseOperations->copy($sourceDatabase, $context->databaseName);
            // A site points at its root page by uid, and those uids came with the
            // data -- so what reads them comes along, its addresses put on ours.
            $this->surroundings->bring(
                $copyFrom === self::PROJECT_SOURCE ? null : $copyFrom,
                $name,
                $data['bring'],
            );
            $this->retargetSites($name, $context->url, $data['addresses'], $reporter);
            $this->fitOrInstall($build, $context, $reporter);
        } elseif ($this->databaseOperations->tables($context->databaseName) > 0 && $build->does('migrate')) {
            // Data of its own is what is being worked on, so it is fitted to the code
            // rather than installed over -- which the application refuses anyway,
            // making "build this again" an offer only an empty worktree could take up.
            $reporter->note('The database already holds an installation; fitting it to this code.');
            $build->at('migrate', $context, $reporter);
        } else {
            $build->at('setup', $context, $reporter);
        }

        $reporter->step('Finishing up');
        $build->at('flush', $context, $reporter);
        $this->reportEmptyDocroot($directory, $docroot, $reporter);
        // The commit this was built for: a checkout that has moved on since has
        // dependencies and a schema made for other code.
        $this->worktrees->store($name, [
            'builtHead' => $this->git->inWorktree($name, 'rev-parse', 'HEAD')->output,
            'builtAt' => time(),
            // The one place it is cleared: everything above can stop, and somebody
            // has to be told when it did.
            'building' => null,
        ]);
        $this->describe->refresh();
        $reporter->finish();
    }

    /**
     * Everything git ignores is the answer that needs no project to write it down,
     * and it is also how a cache built for other code arrives in a checkout it is
     * wrong for -- so a project may say instead.
     *
     * @param list<string> $left what does not travel, see leftBehind()
     *
     * @return list<string>
     */
    private function carried(?string $from, string $directory, array $left): array
    {
        return array_values(array_filter(
            $this->recipes->for($directory)->carry() ?? $this->git->ignoredEntries($from),
            static fn (string $entry): bool => !self::isUnder($entry, $left),
        ));
    }

    /**
     * At whatever depth it sits, because a project may keep its caches inside
     * something it does need. A project that says what travels is taken at its
     * word; the worktrees directory, .git and .ddev are refused either way --
     * carried over, the first would be every worktree inside the one being made.
     *
     * @return list<string>
     */
    private function leftBehind(string $directory): array
    {
        $build = $this->recipes->for($directory);
        $ours = ['.git', '.ddev', $this->project->worktreesName()];

        return $build->carry() !== null ? $ours : [...$build->carryExcept(), ...$ours];
    }

    /**
     * @param list<string> $names
     */
    private static function isUnder(string $path, array $names): bool
    {
        foreach ($names as $name) {
            if ($path === $name || str_starts_with($path, $name . '/')) {
                return true;
            }
        }

        return false;
    }

    /**
     * A site configuration under version control is the project's file, so nothing
     * is written into it -- which leaves the worktree served at an address its own
     * sites do not name, and that is said.
     *
     * @param list<string> $addresses
     */
    private function retargetSites(string $name, string $url, array $addresses, StepReporter $reporter): void
    {
        foreach ($this->surroundings->retargetSites($name, $url, $addresses) as $kept) {
            $reporter->note(sprintf(
                '%s is under version control and is left as the branch has it. This worktree answers at %s'
                . ' -- configuration.md, "Where the addresses come from", says how a project points its sites there.',
                $kept,
                WorktreeContext::hostOf($url),
            ));
        }
    }

    /**
     * Worth trying for every worktree and not worth failing for: what was copied is
     * a copy, so nothing is lost either way. Only the attempt can decide -- whether
     * an application can fit one state of its data to another state of its code is
     * written nowhere readable beforehand.
     */
    private function fitOrInstall(Build $build, WorktreeContext $context, StepReporter $reporter): void
    {
        // Only where something will actually run: a project with no "migrate"
        // would be told about an attempt nobody makes.
        if ($build->does('migrate')) {
            $reporter->note('Fitting the copied data to this code. If the data does not fit, this is the step where it shows.');
        }

        try {
            $build->at('migrate', $context, $reporter);
        } catch (\RuntimeException) {
            // Said and not quoted: what failed wrote its own account into the log a
            // moment ago, and repeating it makes two walls of text.
            $reporter->note('The data does not fit this code -- what the attempt said stands above.');
            $reporter->note('Installing the application instead; the copied data is dropped.');
            $this->databaseOperations->drop($context->databaseName);
            $this->databaseOperations->create($context->databaseName);
            $build->at('setup', $context, $reporter);
        }
    }

    /**
     * A build that never ran, a branch without the site in it, a docroot the
     * configuration names wrongly. Otherwise the operation ends with a tick over a
     * link that says "Forbidden", which reads as a broken tool. A note and not a
     * failure: the worktree is there to put something in.
     */
    private function reportEmptyDocroot(string $directory, string $docroot, StepReporter $reporter): void
    {
        $served = $docroot !== '' ? $directory . '/' . $docroot : $directory;
        if (!is_dir($served)) {
            $reporter->warn(sprintf('The directory to serve, %s, is not there; the address will answer an error until it is.', $docroot !== '' ? $docroot : '.'));

            return;
        }

        foreach (['index.php', 'index.html', 'index.htm'] as $index) {
            if (is_file($served . '/' . $index)) {
                return;
            }
        }

        $reporter->warn(sprintf('%s holds no index file, so the address will answer 403 until something puts one there.', $docroot !== '' ? $docroot : 'The worktree'));
    }

    private function choosePhpVersion(
        string $name,
        Build $build,
        ?string $required,
        StepReporter $reporter,
    ): void {
        // What was read before anything existed comes first -- the answer the
        // operation was allowed to refuse on. What is pointed at can only be
        // answered now, with the checkout in front of us.
        $wanted = $required ?? $build->php() ?? $this->versionWritten($name, $build->phpRead(), 'PHP', $reporter);
        $project = $this->php->projectVersion();

        // Said rather than passed over: it would otherwise be the one setting in
        // the recipe that silently does nothing.
        if ($wanted !== null && $wanted !== $project && !in_array($wanted, $this->php->available(), true)) {
            $reporter->warn(sprintf('The checkout asks for PHP %s, which the web image has no pool for; the project\'s own version applies.', $wanted));
            $wanted = null;
        }
        if ($wanted !== null && $wanted !== $project) {
            $reporter->note(sprintf('Served with PHP %s, in a pool of its own.', $wanted));
            $this->php->assign($name, $wanted);
            $this->worktrees->store($name, ['php' => $wanted]);

            return;
        }
        // A pool assigned by an earlier build would otherwise outlive the line in
        // the recipe that asked for it.
        $assigned = $this->php->assignedTo($name);
        if ($assigned !== null) {
            $reporter->note(sprintf('PHP %s is no longer asked for.', $assigned));
            $this->php->forget($name);
        }
        // Said either way: this decision is the first one asked about when a
        // worktree answers wrongly.
        $reporter->note(sprintf('Served with the project\'s own PHP %s.', $project));
        $this->worktrees->store($name, ['php' => $this->php->forWorktree($name)]);
    }

    /**
     * Where a repository builds each branch against its own -- the TYPO3 core says
     * so in its test runner -- the configuration points at the file and the pattern
     * rather than at a number that would be wrong on the next branch.
     *
     * @param ?array{read: string, match: string} $where what the recipe points at
     * @param string                              $what  PHP or Node, as the notes name it
     */
    private function versionWritten(string $name, ?array $where, string $what, StepReporter $reporter): ?string
    {
        if ($where === null) {
            return null;
        }
        // Every outcome is said: a file missing from this branch, a pattern that
        // no longer matches and a version that was read are three different
        // answers to "why is it built with this".
        $file = $this->project->worktreeDirectory($name) . '/' . $where['read'];
        if (!is_file($file)) {
            $reporter->note(sprintf('%s is not in this checkout, so there is no %s version to read from it.', $where['read'], $what));

            return null;
        }
        $version = Recipe::versionIn((string) file_get_contents($file), $where['match']);
        $reporter->note($version === null
            ? sprintf('Nothing in %s matches the pattern %s.', $where['read'], $where['match'])
            : sprintf('%s says %s %s.', $where['read'], $what, $version));

        return $version;
    }

    /**
     * Nothing is served with it, so unlike a PHP pool there is nothing to refuse
     * beforehand. A version not in the cache is fetched once, into a cache that
     * belongs to the project rather than to the worktree.
     */
    private function chooseNodeVersion(string $name, Build $build, StepReporter $reporter): void
    {
        // The recipe first, then where it points, and only then the checkout's own
        // files -- which n reads itself.
        $said = $build->node() ?? $this->versionWritten($name, $build->nodeRead(), 'Node', $reporter);
        $wanted = $said ?? ($this->node->writtenIn($this->project->worktreeDirectory($name)) ? 'auto' : null);
        $project = $this->node->projectVersion();

        if ($wanted !== null) {
            $found = $this->node->lookUp($wanted, $this->project->hostWorktreeDirectory($name));
            if ($found === null) {
                // A version that could not be fetched builds the worktree with another,
                // and an assets build that fails says nothing about why.
                $reporter->warn(sprintf(
                    'The Node version %s could not be fetched; %s applies.',
                    $wanted === 'auto' ? 'the checkout asks for' : $wanted,
                    $project === null ? 'whatever the container brings' : sprintf("the container's own %s", $project),
                ));
            } elseif ($found['version'] !== $project) {
                $reporter->note(sprintf('Built with Node %s.', $found['version']));
                $this->node->assign($name, $found['version']);

                return;
            } else {
                $reporter->note(sprintf("Built with the container's own Node %s.", $project));
            }
        }

        // A version assigned by an earlier build would otherwise outlive the file
        // that asked for it.
        $assigned = $this->node->assignedTo($name);
        if ($assigned !== null) {
            $reporter->note(sprintf('Node %s is no longer asked for.', $assigned));
            $this->node->forget($name);
        }
    }

    private function context(string $name, string $branch): WorktreeContext
    {
        // What the configuration says goes into the environment of every command
        // it runs. A shipped configuration is written against these names, which
        // is what lets it be a file rather than a class.
        $build = $this->recipes->quietly($this->project->worktreeDirectory($name));

        return new WorktreeContext(
            name: $name,
            branch: $branch,
            url: $this->project->urlFor($name),
            directory: $this->project->worktreeDirectory($name),
            hostDirectory: $this->project->hostWorktreeDirectory($name),
            phpBinary: $this->php->binaryFor($name),
            nodeDirectory: $this->node->directoryFor($name),
            binDirectory: $build->bin(),
            docroot: $build->docroot(),
            database: $this->database,
            databaseName: $this->database->nameFor($name),
            web: $this->web,
            files: $this->files,
            tld: $this->project->tld(),
        );
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
