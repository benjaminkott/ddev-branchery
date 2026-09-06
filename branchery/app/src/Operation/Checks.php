<?php

declare(strict_types=1);

namespace App\Operation;

use App\Config\Build;
use App\Config\Recipe;
use App\Config\Recipes;
use App\Git\Git;
use App\Jobs\JobRunner;
use App\Jobs\StepReporter;
use App\Project;
use App\Text;
use App\Web\Databases;
use App\Web\DatabaseServer;
use App\Worktree\PhpVersions;
use App\Worktree\Worktrees;

/**
 * What is asked before a worktree exists.
 *
 * Every one of these could be found out later, and every one of them found out
 * later leaves a checkout standing half built: a version the image has no pool
 * for, a lock file composer will refuse, a database somebody else's data is in.
 * Asked here, the answer costs nothing -- which is also what lets the summary
 * in the dialog say beforehand what the operation would say after the press.
 */
final readonly class Checks
{
    public function __construct(
        private Project $project,
        private Git $git,
        private Recipes $recipes,
        private PhpVersions $php,
        private DatabaseServer $database,
        private Databases $databases,
        private Worktrees $worktrees,
        private CopiedFiles $copied,
        private JobRunner $jobs,
    ) {
    }

    /**
     * The branch's own file where it carries one, the project's where it does not,
     * and the shipped file either of them names.
     */
    public function asked(string $ref): Build
    {
        $said = $this->git->fileAt($ref, Recipe::FILE);

        return $said === null
            ? $this->recipes->for($this->project->root())
            : $this->recipes->build(Recipe::fromString($said));
    }

    /**
     * First of every operation, because at this point there is no worktree, branch
     * or database yet. Where the version is pointed at rather than written down,
     * the answer comes after the checkout.
     */
    public function phpFor(Build $build, string $subject, StepReporter $reporter): ?string
    {
        $asked = $build->php();
        $said = $asked?->number;
        if ($said === null) {
            // Pointed at is not nothing asked for: saying "the project's own" here was
            // read as the decision.
            $reporter->note($asked === null
                ? 'No version asked for; the project\'s own applies.'
                : sprintf('The version is written in %s; it is read once the checkout is there.', (string) $asked->read));

            return null;
        }

        $available = $this->php->available();
        if (!in_array($said, $available, true)) {
            throw new \RuntimeException(sprintf('%s asks for PHP %s, and the web image has no pool for it -- only %s. Nothing was created.', $subject, $said, implode(', ', $available)));
        }
        $reporter->note(sprintf('Asks for PHP %s.', $said));

        return $said;
    }

    public function checkLockAt(Build $build, string $ref, StepReporter $reporter): void
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
    public function checkLockCarried(Build $build, string $base, ?string $from, string $name, StepReporter $reporter): void
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
            if (is_file($file) && in_array('composer.lock', $this->copied->of($from, $directory), true)) {
                $source = $from !== null ? sprintf('worktree "%s"', $from) : 'the project checkout';
                $lock = (string) file_get_contents($file);
                $what = sprintf('The composer.lock carried over from %s', $source);
                $where = sprintf('in %s', $source);
            }
        }

        $this->checkLock($build, $json, $lock, $what, $where, $reporter);
    }

    /** How a worktree that stands here already says it is built. */
    public function buildFor(string $name): Build
    {
        return $this->recipes->for($this->project->worktreeDirectory($name));
    }

    /** What the project itself is served with, where nothing else is asked for. */
    public function projectPhp(): string
    {
        return $this->php->projectVersion();
    }

    /** The same question, of the two files a worktree that stands here already has. */
    public function checkLockIn(string $name, Build $build, StepReporter $reporter): void
    {
        $directory = $this->project->worktreeDirectory($name);

        $this->checkLock(
            $build,
            is_file($directory . '/composer.json') ? (string) file_get_contents($directory . '/composer.json') : null,
            is_file($directory . '/composer.lock') ? (string) file_get_contents($directory . '/composer.lock') : null,
            'composer.lock in this worktree',
            'in it',
            $reporter,
        );
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
     * Another worktree whose name is cut to the same one, or a database left on the
     * server. An empty one is taken over without a word; one with tables in it is
     * somebody's data, and this is the last moment saying so costs nothing.
     */
    public function assertDatabaseFree(string $name, StepReporter $reporter): void
    {
        $database = $this->database->nameFor($name);

        foreach ($this->worktrees->names() as $existing) {
            if ($existing !== $name && $this->database->nameFor($existing) === $database) {
                throw new \RuntimeException(sprintf('"%s" and the existing worktree "%s" would both be given the database %s. Pick a different name for this one (--name).', $name, $existing, $database));
            }
        }

        $tables = $this->databases->tables($database);
        if ($tables > 0) {
            // Our prefix, no worktree of that name: one of ours that outlived it.
            throw new \RuntimeException(sprintf('The database %s already exists and holds %s. It is left over from a worktree that is not here any more -- "ddev branchery database:prune" lists what that is, "ddev branchery database:prune --drop" removes it. Or create this worktree under a different name (--name). Nothing was created.', $database, Text::count($tables, 'table')));
        }

        $reporter->note(sprintf('Database: %s%s', $database, $tables === 0 ? ' (exists, empty)' : ''));
    }

    /**
     * Kept, a record would become the history of whatever is given that name next.
     * Done on removal and again here, which sweeps up the one operation the first
     * pass cannot take: its own removal, still running while it runs.
     */
    public function forgetOperations(string $name, StepReporter $reporter): void
    {
        $forgotten = $this->jobs->forget($name);
        if ($forgotten > 0) {
            $reporter->note(sprintf('Forgot the record of %s under this name.', Text::count($forgotten, 'earlier operation')));
        }
    }

    private function branchIn(string $name): string
    {
        return $this->git->inWorktree($name, 'rev-parse', '--abbrev-ref', 'HEAD')->output;
    }
}
