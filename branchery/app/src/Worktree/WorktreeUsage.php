<?php

declare(strict_types=1);

namespace App\Worktree;

use App\Database\DatabaseOperations;
use App\Database\ProjectDatabase;
use App\Project;
use App\Web\WebContainer;

/** Measures what belongs to one worktree rather than to the project as a whole. */
final readonly class WorktreeUsage
{
    public function __construct(
        private Project $project,
        private WebContainer $web,
        private ProjectDatabase $database,
        private DatabaseOperations $databases,
    ) {
    }

    /** @return array{files: int, database: int, total: int} */
    public function of(string $name): array
    {
        // The worktree's .git is a pointer into the project's repository, so
        // this deliberately counts the checkout and its generated files but
        // not the shared object store.
        $measured = $this->web->run(['du', '-sk', '--', '.'], $this->project->worktreeDirectory($name));
        if (!$measured->isSuccessful()) {
            throw new \RuntimeException(sprintf('Measuring the files: %s', $measured->message()));
        }

        $fields = preg_split('/\s+/', trim($measured->output)) ?: [];
        if (!isset($fields[0]) || !ctype_digit($fields[0])) {
            throw new \RuntimeException('Measuring the files returned no size.');
        }

        $files = (int) $fields[0] * 1024;
        $database = $this->databases->size($this->database->nameFor($name));

        return ['files' => $files, 'database' => $database, 'total' => $files + $database];
    }
}
