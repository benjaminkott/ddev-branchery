<?php

declare(strict_types=1);

namespace App\Tests\Fake;

use App\Config\Recipes;
use App\Git\Facts;
use App\Git\Git;
use App\Git\History;
use App\Git\Repository;
use App\Git\Runner;
use App\Git\SshAgent;
use App\Git\WorkingCopy;
use App\Http\ApiController;
use App\Http\Operations;
use App\Http\Snapshot;
use App\Http\State;
use App\Installation;
use App\Jobs\JobRunner;
use App\Jobs\Locks;
use App\Jobs\Records;
use App\ManagedFiles;
use App\Operation\BranchMoves;
use App\Operation\CarriedFiles;
use App\Operation\Checks;
use App\Operation\DataTransfer;
use App\Operation\Places;
use App\Operation\Provisioning;
use App\Operation\Removal;
use App\Operation\WorktreeManager;
use App\Project;
use App\Web\Databases;
use App\Web\DatabaseServer;
use App\Web\Exposure;
use App\Web\Runtimes;
use App\Worktree\CommitPages;
use App\Worktree\Description;
use App\Worktree\NodeVersions;
use App\Worktree\PhpVersions;
use App\Worktree\Surroundings;
use App\Worktree\Usage;
use App\Worktree\VersionMap;
use App\Worktree\VersionMap as Map;
use App\Worktree\Worktrees;
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
    public readonly Worktrees $worktrees;
    public readonly WorktreeManager $manager;
    public readonly JobRunner $jobs;
    public readonly ManagedFiles $files;
    public readonly ApiController $api;
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
        // One Runner for the whole graph, as App\Container has it: it is what
        // tells Facts that a command wrote, and a second one tells nobody.
        $runner = new Runner($this->project, $this->web);
        $this->git = new Git(
            $runner,
            new Facts($this->project, $runner),
            new History($runner),
            new WorkingCopy($runner),
            new Repository($this->project, $runner, $locks),
        );
        $runtimes = new Runtimes($this->web);
        $php = new PhpVersions($this->project, $this->web, $this->map('php'), $runtimes, $locks);
        $node = new NodeVersions($this->web, $this->map('node'), $runtimes);
        $database = new DatabaseServer($this->web);
        $recipes = new Recipes($root, \dirname(__DIR__, 2) . '/defaults');
        $this->worktrees = new Worktrees(
            $this->project,
            $this->files,
            $php,
            $node,
            $this->git,
            $database,
            $recipes,
        );
        $this->jobs = new JobRunner(
            $this->project,
            $this->files,
            new Records($this->project, $this->files),
            '/opt/branchery/bin/console',
        );

        // The pieces an operation is made of, wired as App\Container wires them.
        $databases = new Databases($this->web, $database);
        $describe = new Description($this->project, $this->worktrees, $database, $this->files);
        $surroundings = new Surroundings($this->project, $this->git, $this->files, $this->web);
        $places = new Places($this->project, $recipes, $php, $node, $database, $this->web, $this->files);
        $carried = new CarriedFiles($this->project, $this->git, $recipes, $this->web);
        $preflight = new Checks(
            $this->project,
            $this->git,
            $recipes,
            $php,
            $database,
            $databases,
            $this->worktrees,
            $carried,
            $this->jobs,
        );

        $this->manager = new WorktreeManager(
            $this->project,
            $this->git,
            $this->worktrees,
            $this->files,
            $locks,
            $preflight,
            $carried,
            new Provisioning(
                $this->project,
                $this->git,
                $this->worktrees,
                $recipes,
                $database,
                $databases,
                $php,
                $node,
                $surroundings,
                $describe,
                $places,
            ),
            new Removal(
                $this->project,
                $this->git,
                $this->worktrees,
                $this->files,
                $database,
                $databases,
                $php,
                $node,
                $surroundings,
                $describe,
                $preflight,
            ),
            new BranchMoves($this->git, $this->worktrees, new SshAgent($this->web, $this->git)),
            new DataTransfer(
                $this->project,
                $this->git,
                $recipes,
                $database,
                $databases,
                $surroundings,
                $this->worktrees,
                $places,
            ),
        );
        // The API over the same graph. What it answers with is the one thing the
        // interface is written against, and the shape of that is worth holding to
        // -- see ApiAnswersTest.
        $this->api = new ApiController(
            $this->project,
            $this->worktrees,
            $this->manager,
            $php,
            $this->jobs,
            $this->git,
            new Usage($this->project, $this->web, $database, $databases),
            new State(
                $this->project,
                $this->worktrees,
                $this->git,
                $php,
                $this->jobs,
                $recipes,
                new Installation($this->project, 'dev'),
                new Exposure($this->project, new Ports()),
                new Snapshot($this->project, $this->files),
            ),
            new Operations($locks, $this->jobs),
            new CommitPages($this->project, $this->git, $recipes),
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
