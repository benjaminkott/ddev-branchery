<?php

declare(strict_types=1);

namespace App\Worktree;

use App\Config\Recipes;
use App\ManagedFiles;
use App\Project;
use App\Web\DatabaseServer;
use App\Web\WebContainer;

/**
 * What a recipe line is told about the worktree it runs for.
 *
 * One place, because a shipped configuration is written against these names --
 * BRANCHERY_DATABASE, BRANCHERY_BIN and the rest -- and that is what lets it be
 * a file in a project rather than a class in here. A second place building one
 * of these is a second set of names.
 */
final readonly class Places
{
    public function __construct(
        private Project $project,
        private Recipes $recipes,
        private PhpVersions $php,
        private NodeVersions $node,
        private DatabaseServer $database,
        private WebContainer $web,
        private ManagedFiles $files,
    ) {
    }

    public function of(string $name, string $branch): Place
    {
        // Quietly: a file with a typo in it is the operation's to fail on, at the
        // step that reads it, and not this method's to throw out of.
        $build = $this->recipes->quietly($this->project->worktreeDirectory($name));

        return new Place(
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
}
