<?php

declare(strict_types=1);

namespace App\Operation;

use App\Config\Recipes;
use App\Database\DatabaseOperations;
use App\Database\ProjectDatabase;
use App\Git\Git;
use App\Jobs\StepReporter;
use App\Project;
use App\Text;
use App\Worktree\Surroundings;
use App\Worktree\WorktreeRepository;

/**
 * Fetching a worktree's data again, and what is left on the server when a
 * worktree is not.
 *
 * The data is replaced rather than added to, and the configuration that reads
 * it comes along: a site points at its root page by uid, and those uids came
 * with the data. What comes after is the code's turn -- the data was written by
 * another state of it, and half of it would be read against a shape it does not
 * have.
 *
 * The worktrees are claimed by the caller, both of them where there are two.
 */
final readonly class DataTransfer
{
    public function __construct(
        private Project $project,
        private Git $git,
        private Recipes $recipes,
        private ProjectDatabase $database,
        private DatabaseOperations $databases,
        private Surroundings $surroundings,
        private WorktreeRepository $worktrees,
        private Contexts $contexts,
    ) {
    }

    public function sync(string $name, ?string $from, string $branch, StepReporter $reporter): void
    {
        $source = $from !== null ? $this->database->nameFor($from) : ProjectDatabase::PROJECT_DATABASE;
        $target = $this->database->nameFor($name);
        $context = $this->contexts->of($name, $branch);

        $build = $this->recipes->for($this->project->worktreeDirectory($name));
        $data = $build->data();

        $reporter->expect(4);
        $reporter->step(sprintf('Copying %s into %s', $source, $target));
        $this->reportDistance($branch, $from, $reporter);
        $this->databases->replace($source, $target);

        // A site points at its root page by uid, and those uids came with the
        // data -- so what reads them comes along, its addresses put back on ours.
        $reporter->step('Putting the addresses back');
        $this->surroundings->bring($from, $name, $data['bring']);
        $this->surroundings->retargetSites($name, $context->url, $data['addresses'], $reporter);

        // The data was written by another state of the code, and half of it would
        // be read against a shape it does not have.
        $reporter->step('Fitting the data to this code');
        $build->at('migrate', $context, $reporter);

        $reporter->step('Flushing caches');
        $build->at('flush', $context, $reporter);
        $reporter->finish();
    }

    /**
     * A checkout deleted by hand, an operation that broke off, the add-on
     * uninstalled. Nothing but this would ever mention them again.
     *
     * @return array<string, int> database name => number of tables in it
     */
    public function orphaned(): array
    {
        $taken = [];
        foreach ($this->worktrees->names() as $name) {
            $taken[$this->database->nameFor($name)] = true;
        }

        $orphans = [];
        foreach ($this->databases->owned() as $database) {
            if (!isset($taken[$database])) {
                $orphans[$database] = $this->databases->tables($database);
            }
        }

        return $orphans;
    }

    /** Only ever what this add-on made. */
    public function drop(string $database): void
    {
        if (!str_starts_with($database, ProjectDatabase::PREFIX)) {
            throw new \InvalidArgumentException(sprintf('"%s" is not a database of this add-on.', $database));
        }

        $this->databases->drop($database);
    }

    /**
     * What the branch changed since -- a column that moved, a setting read
     * differently -- surfaces as errors in a worktree the reader believes is
     * freshly set up. Said up front, so those errors are explicable.
     */
    private function reportDistance(string $branch, ?string $from, StepReporter $reporter): void
    {
        $source = $from !== null
            ? $this->git->inWorktree($from, 'rev-parse', '--abbrev-ref', 'HEAD')->output
            : $this->git->currentBranch();
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
}
