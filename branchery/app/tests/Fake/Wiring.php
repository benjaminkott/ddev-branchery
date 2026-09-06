<?php

declare(strict_types=1);

namespace App\Tests\Fake;

use App\Container;
use App\Git\Git;
use App\Http\ApiController;
use App\Jobs\JobRunner;
use App\ManagedFiles;
use App\Operation\WorktreeManager;
use App\Project;
use App\Worktree\Worktrees;
use Symfony\Component\Filesystem\Filesystem;

/**
 * The graph an operation runs in, over a directory that is thrown away
 * afterwards and a container that runs nothing.
 *
 * It is App\Container's graph and not one of its own. What is decided here is
 * only what a test has to decide -- the project, the container the tools would
 * be run in, and what is published to the machine -- and everything behind
 * those is the wiring the application itself runs on, so a test cannot walk a
 * graph the application does not have.
 */
final class Wiring
{
    public readonly Project $project;
    public readonly RecordingContainer $web;
    public readonly Git $git;
    public readonly Worktrees $worktrees;
    public readonly WorktreeManager $manager;
    public readonly JobRunner $jobs;
    public readonly ManagedFiles $files;
    public readonly ApiController $api;

    public function __construct(public readonly string $root)
    {
        (new Filesystem())->mkdir($root);

        $this->project = new Project(
            projectRoot: $root,
            hostProjectRoot: $root,
            projectName: 'blog',
            worktrees: '.worktrees',
            domain: 'ddev.site',
        );
        $this->web = new RecordingContainer();

        $container = Container::around($this->project, $this->web, new Ports(), [
            // What a test writes belongs to whoever ran it. The application's own
            // default is the developer on the host, which is not who this is.
            'BRANCHERY_UID' => (string) getmyuid(),
            'BRANCHERY_GID' => (string) getmygid(),
        ]);

        $this->git = $container->git();
        $this->worktrees = $container->worktrees();
        $this->manager = $container->manager();
        $this->jobs = $container->jobs();
        $this->files = $container->files();
        // The API over the same graph. What it answers with is the one thing the
        // interface is written against, and the shape of that is worth holding to
        // -- see ApiAnswersTest.
        $this->api = $container->api();
    }

    public function remove(): void
    {
        (new Filesystem())->remove($this->root);
    }

    /** What a project says about how its worktrees are built. */
    public function recipe(string $yaml): void
    {
        (new Filesystem())->mkdir($this->root . '/.ddev');
        file_put_contents($this->root . '/.ddev/branchery.yaml', $yaml);
    }

    /**
     * A worktree that is already there, as far as everything that only asks the
     * directory is concerned.
     */
    public function worktree(string $name): string
    {
        $directory = $this->project->worktreeDirectory($name);
        (new Filesystem())->mkdir($directory);

        return $directory;
    }
}
