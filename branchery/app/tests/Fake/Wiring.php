<?php

declare(strict_types=1);

namespace App\Tests\Fake;

use App\Service\DatabaseOperations;
use App\Service\DescribeInfo;
use App\Service\Git;
use App\Service\JobRunner;
use App\Service\Locks;
use App\Service\ManagedFiles;
use App\Service\NodeVersions;
use App\Service\PhpVersions;
use App\Service\Project;
use App\Service\ProjectDatabase;
use App\Service\Recipes;
use App\Service\Runtimes;
use App\Service\SshAgent;
use App\Service\Surroundings;
use App\Service\VersionMap;
use App\Service\VersionMap as Map;
use App\Service\WorktreeManager;
use App\Service\WorktreeRepository;
use Symfony\Component\Filesystem\Filesystem;

/**
 * The graph an operation runs in, over a directory that is thrown away
 * afterwards and a container that runs nothing.
 *
 * Written out rather than taken from App\Container: that one reads the
 * environment and decides which container the application runs on, which is the
 * one decision a test has to make for itself. What is kept from it is the
 * shape -- if the two ever disagree, this is wired wrongly.
 */
final class Wiring
{
    public readonly Project $project;
    public readonly RecordingContainer $web;
    public readonly Git $git;
    public readonly WorktreeRepository $worktrees;
    public readonly WorktreeManager $manager;
    public readonly JobRunner $jobs;
    public readonly ManagedFiles $files;
    private readonly Locks $locks;

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
        $this->files = new ManagedFiles((int) getmyuid(), (int) getmygid());
        // One of them for the whole graph, as App\Container has it: flock is per
        // open file, so a second Locks holding the same key blocks against the
        // first from inside the very process that holds it.
        $locks = $this->locks = new Locks($this->project, $this->files);
        $this->git = new Git($this->project, $this->web, $locks);
        $runtimes = new Runtimes($this->web);
        $php = new PhpVersions($this->project, $this->web, $this->map('php'), $runtimes, $locks);
        $node = new NodeVersions($this->web, $this->map('node'), $runtimes);
        $database = new ProjectDatabase($this->web);
        $recipes = new Recipes($root, \dirname(__DIR__, 2) . '/defaults');
        $this->worktrees = new WorktreeRepository(
            $this->project,
            $this->files,
            $php,
            $node,
            $this->git,
            $database,
            $recipes,
        );
        $this->jobs = new JobRunner($this->project, $this->files, '/opt/branchery/bin/console');
        $this->manager = new WorktreeManager(
            $this->project,
            $this->git,
            $this->worktrees,
            $recipes,
            $database,
            new DatabaseOperations($this->web, $database),
            $php,
            $node,
            $this->files,
            $this->web,
            new DescribeInfo($this->project, $this->worktrees, $database, $this->files),
            new Surroundings($this->project, $this->git, $this->files, $this->web),
            new SshAgent($this->web, $this->git),
            $locks,
            $this->jobs,
        );
    }

    private function map(string $tool): VersionMap
    {
        return new Map($this->project->stateDirectory() . '/' . $tool . '.map', $this->files, $this->locks);
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
