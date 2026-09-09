<?php

declare(strict_types=1);

namespace App;

use App\Command\AccountCommand;
use App\Command\AddCommand;
use App\Command\CheckReleasesCommand;
use App\Command\ConfigCommand;
use App\Command\DescribeCommand;
use App\Command\DiscardCommand;
use App\Command\DocsCommand;
use App\Command\ExampleCommand;
use App\Command\FetchCommand;
use App\Command\ForkCommand;
use App\Command\ListJobsCommand;
use App\Command\ListWorktreesCommand;
use App\Command\PhpCommand;
use App\Command\ProvisionCommand;
use App\Command\PruneCommand;
use App\Command\PullCommand;
use App\Command\RemoveCommand;
use App\Command\RestoreCommand;
use App\Command\ShowJobCommand;
use App\Command\SyncCommand;
use App\Config\Recipes;
use App\Git\Facts;
use App\Git\Git;
use App\Git\History;
use App\Git\Images;
use App\Git\Repository;
use App\Git\Runner;
use App\Git\SshAgent;
use App\Git\WorkingCopy;
use App\Http\ApiController;
use App\Http\Operations;
use App\Http\Router;
use App\Http\Snapshot;
use App\Http\State;
use App\Jobs\JobRunner;
use App\Jobs\Locks;
use App\Jobs\Records;
use App\Operation\BranchMoves;
use App\Operation\Checks;
use App\Operation\CopiedFiles;
use App\Operation\DataTransfer;
use App\Operation\Provisioning;
use App\Operation\Removal;
use App\Operation\WorktreeManager;
use App\Web\Databases;
use App\Web\DatabaseServer;
use App\Web\DockerContainer;
use App\Web\DockerPorts;
use App\Web\Exposure;
use App\Web\PublishedPorts;
use App\Web\Runtimes;
use App\Web\WebContainer;
use App\Worktree\CommitPages;
use App\Worktree\Description;
use App\Worktree\NodeVersions;
use App\Worktree\PhpVersions;
use App\Worktree\Places;
use App\Worktree\Surroundings;
use App\Worktree\Traces;
use App\Worktree\Usage;
use App\Worktree\VersionMap;
use App\Worktree\Worktrees;
use Symfony\Component\Console\Command\Command;

/**
 * What is wired to what. Written out rather than discovered: what this
 * application is made of fits on a page. The environment is read once, here, so
 * every default sits in one place.
 */
final class Container
{
    /** @var array<string, object> */
    private array $shared = [];

    /** @param array<string, string> $env */
    public function __construct(private readonly array $env)
    {
    }

    /**
     * A setting of this application and not a fact about any project, so it is
     * decided here and read from Project everywhere else -- a path written out
     * twice is a path that cannot be moved.
     */
    private const string WORKTREES = '.worktrees';

    /**
     * Where this application is installed: the image copies it to one place and
     * the working copy stands in another, and both are answered by asking the
     * code where it is rather than by naming either.
     *
     * Counted from this file, so a move of it is a change here -- and nothing
     * about that is a type or a call: what a wrong answer here does is leave the
     * shipped configurations unfindable and every background operation starting
     * a console that is not there, minutes later, in front of a developer. See
     * App\Tests\InstalledTest, which is what says so at the right moment.
     */
    private static function home(): string
    {
        return \dirname(__DIR__);
    }

    public static function fromEnvironment(): self
    {
        // Only the string entries: $_SERVER carries arrays too, and casting one
        // writes a warning into whatever the request was answering.
        $env = [];
        foreach ([$_ENV, $_SERVER, getenv()] as $source) {
            foreach ($source as $name => $value) {
                if (is_string($value)) {
                    $env[(string) $name] = $value;
                }
            }
        }

        return new self($env);
    }

    /**
     * The same graph, around the three things that cannot be read off an
     * environment: which project, which container the tools are run in, and what
     * is published to the machine.
     *
     * For tests, and it is here rather than beside them on purpose. Written out
     * there it was a second wiring of the same graph -- one that said of itself
     * that if the two ever disagreed it was the wrong one, with nothing to say
     * whether they had. Everything a test does not decide is this file's, which
     * is the only way the graph a test walks is the graph that runs.
     *
     * @param array<string, string> $env for the few settings that are read off
     *                                   one -- who the files written belong to
     */
    public static function around(Project $project, WebContainer $web, PublishedPorts $ports, array $env = []): self
    {
        $container = new self($env);
        $container->shared = [
            Project::class => $project,
            WebContainer::class => $web,
            PublishedPorts::class => $ports,
        ];

        return $container;
    }

    public function project(): Project
    {
        return $this->share(Project::class, function (): Project {
            $root = $this->string('BRANCHERY_PROJECT_ROOT', '/var/www/html');

            return new Project(
                projectRoot: $root,
                hostProjectRoot: $this->string('HOST_PROJECT_ROOT', $root),
                projectName: $this->string('DDEV_PROJECT', 'ddev'),
                worktrees: self::WORKTREES,
                domain: $this->string('DDEV_TLD', 'ddev.site'),
            );
        });
    }

    public function web(): WebContainer
    {
        // The interface is what everything asks for; this is the one place that
        // says which of them the application runs on.
        return $this->share(WebContainer::class, fn (): WebContainer => new DockerContainer(
            containerName: $this->string('BRANCHERY_WEB_CONTAINER', ''),
            hostProjectRoot: $this->project()->hostRoot(),
        ));
    }

    public function files(): ManagedFiles
    {
        return $this->share(ManagedFiles::class, fn (): ManagedFiles => new ManagedFiles(
            ownerUid: (int) $this->string('BRANCHERY_UID', '1000'),
            ownerGid: (int) $this->string('BRANCHERY_GID', '1000'),
        ));
    }

    /**
     * The one place a git command is built, and what tells whoever kept an answer
     * that one of them wrote. Shared, or a second Runner would leave the first
     * one's listeners out of a write.
     */
    public function gitRunner(): Runner
    {
        return $this->share(Runner::class, fn (): Runner => new Runner($this->project(), $this->web()));
    }

    public function gitFacts(): Facts
    {
        return $this->share(Facts::class, fn (): Facts => new Facts($this->project(), $this->gitRunner()));
    }

    public function git(): Git
    {
        return $this->share(Git::class, fn (): Git => new Git(
            $this->gitRunner(),
            $this->gitFacts(),
            new History($this->gitRunner()),
            new WorkingCopy($this->gitRunner()),
            new Repository($this->project(), $this->gitRunner(), $this->locks()),
            new Images($this->gitRunner(), $this->project()),
        ));
    }

    public function ssh(): SshAgent
    {
        return $this->share(SshAgent::class, fn (): SshAgent => new SshAgent($this->web(), $this->git()));
    }

    /** What the web container itself runs on, asked in one go -- see Runtimes. */
    public function runtimes(): Runtimes
    {
        return $this->share(Runtimes::class, fn (): Runtimes => new Runtimes($this->web()));
    }

    public function php(): PhpVersions
    {
        return $this->share(PhpVersions::class, fn (): PhpVersions => new PhpVersions(
            $this->project(),
            $this->web(),
            $this->versions('php'),
            $this->runtimes(),
            $this->locks(),
        ));
    }

    public function node(): NodeVersions
    {
        return $this->share(NodeVersions::class, fn (): NodeVersions => new NodeVersions(
            $this->web(),
            $this->versions('node'),
            $this->runtimes(),
        ));
    }

    /**
     * The file is named here rather than in the class that reads it, for the same
     * reason every other path is.
     */
    private function versions(string $tool): VersionMap
    {
        // Not shared on its own: the two services that read one are, so each map
        // is made once anyway.
        return new VersionMap($this->project()->stateDirectory() . '/' . $tool . '.map', $this->files(), $this->locks());
    }

    public function docs(): Docs
    {
        // Beside the application and not beside the project: the manual is part of
        // the version, and the image is what carries a version.
        return $this->share(Docs::class, fn (): Docs => new Docs(self::home() . '/docs'));
    }

    public function databaseServer(): DatabaseServer
    {
        return $this->share(DatabaseServer::class, fn (): DatabaseServer => new DatabaseServer($this->web()));
    }

    public function databases(): Databases
    {
        return $this->share(Databases::class, fn (): Databases => new Databases(
            $this->web(),
            $this->databaseServer(),
        ));
    }

    public function worktrees(): Worktrees
    {
        return $this->share(Worktrees::class, fn (): Worktrees => new Worktrees(
            $this->project(),
            $this->files(),
            $this->php(),
            $this->node(),
            $this->git(),
            $this->databaseServer(),
            $this->recipes(),
        ));
    }

    public function usage(): Usage
    {
        return $this->share(Usage::class, fn (): Usage => new Usage(
            $this->project(),
            $this->web(),
            $this->databaseServer(),
            $this->databases(),
        ));
    }

    /**
     * What has been released, which is the one question this application asks of
     * somewhere that is not this machine. Only the startup check calls it; the
     * page reads what that left behind.
     */
    public function releases(): Releases
    {
        return $this->share(Releases::class, fn (): Releases => new GithubReleases());
    }

    public function installation(): Installation
    {
        return $this->share(Installation::class, fn (): Installation => new Installation(
            $this->project(),
            self::version(),
        ));
    }

    /**
     * Written into the image by the build that made it. A working copy has no such
     * file, and "dev" says the version cannot be compared rather than inventing a
     * number to compare with.
     */
    private static function version(): string
    {
        $file = self::home() . '/VERSION';

        return is_file($file) ? trim((string) file_get_contents($file)) : 'dev';
    }

    /**
     * Asked of the daemon rather than of a configuration file: "bind_all_interfaces"
     * can be set for this machine and not for this project, and a project without
     * the router publishes for itself. What is true is what docker did.
     */
    public function ports(): PublishedPorts
    {
        return $this->share(PublishedPorts::class, fn (): PublishedPorts => new DockerPorts());
    }

    public function exposure(): Exposure
    {
        return $this->share(Exposure::class, fn (): Exposure => new Exposure($this->project(), $this->ports()));
    }

    public function locks(): Locks
    {
        return $this->share(Locks::class, fn (): Locks => new Locks($this->project(), $this->files()));
    }

    public function surroundings(): Surroundings
    {
        return $this->share(Surroundings::class, fn (): Surroundings => new Surroundings(
            $this->project(),
            $this->git(),
            $this->files(),
            $this->web(),
        ));
    }

    public function describe(): Description
    {
        return $this->share(Description::class, fn (): Description => new Description(
            $this->project(),
            $this->worktrees(),
            $this->databaseServer(),
            $this->files(),
        ));
    }

    /**
     * The shipped files sit beside the application in the image, which is what makes
     * them readable to whoever is writing their own: a configuration that can be
     * copied out of "defaults/typo3-app.yaml" is worth more than a class nobody
     * outside this repository will ever open.
     */
    public function recipes(): Recipes
    {
        return $this->share(Recipes::class, fn (): Recipes => new Recipes(
            $this->project()->root(),
            self::home() . '/defaults',
        ));
    }

    public function jobs(): JobRunner
    {
        return $this->share(JobRunner::class, fn (): JobRunner => new JobRunner(
            $this->project(),
            $this->files(),
            // Not shared on its own: the one service that reads the records is,
            // so there is one of these anyway.
            new Records($this->project(), $this->files()),
            // Background operations start the console of this very application.
            consoleBinary: self::home() . '/bin/console',
        ));
    }

    /**
     * What an operation is made of, one named thing at a time. The order they are
     * put in is WorktreeManager's, which is the whole of what it does.
     */
    public function places(): Places
    {
        return $this->share(Places::class, fn (): Places => new Places(
            $this->project(),
            $this->recipes(),
            $this->php(),
            $this->node(),
            $this->databaseServer(),
            $this->web(),
            $this->files(),
        ));
    }

    public function copied(): CopiedFiles
    {
        return $this->share(CopiedFiles::class, fn (): CopiedFiles => new CopiedFiles(
            $this->project(),
            $this->git(),
            $this->recipes(),
            $this->web(),
        ));
    }

    public function checks(): Checks
    {
        return $this->share(Checks::class, fn (): Checks => new Checks(
            $this->project(),
            $this->git(),
            $this->recipes(),
            $this->php(),
            $this->databaseServer(),
            $this->databases(),
            $this->worktrees(),
            $this->copied(),
            $this->jobs(),
        ));
    }

    public function provisioning(): Provisioning
    {
        return $this->share(Provisioning::class, fn (): Provisioning => new Provisioning(
            $this->project(),
            $this->git(),
            $this->worktrees(),
            $this->recipes(),
            $this->databaseServer(),
            $this->databases(),
            $this->php(),
            $this->node(),
            $this->surroundings(),
            $this->describe(),
            $this->places(),
        ));
    }

    public function removal(): Removal
    {
        return $this->share(Removal::class, fn (): Removal => new Removal(
            $this->project(),
            $this->git(),
            $this->files(),
            $this->databaseServer(),
            $this->databases(),
            // Not shared on its own: a removal is the only thing that forgets a
            // worktree, so there is one of these anyway.
            new Traces($this->surroundings(), $this->worktrees(), $this->php(), $this->node(), $this->describe()),
            $this->checks(),
        ));
    }

    public function branchMoves(): BranchMoves
    {
        return $this->share(BranchMoves::class, fn (): BranchMoves => new BranchMoves(
            $this->git(),
            $this->worktrees(),
            $this->ssh(),
        ));
    }

    public function dataTransfer(): DataTransfer
    {
        return $this->share(DataTransfer::class, fn (): DataTransfer => new DataTransfer(
            $this->project(),
            $this->git(),
            $this->recipes(),
            $this->databaseServer(),
            $this->databases(),
            $this->surroundings(),
            $this->worktrees(),
            $this->places(),
        ));
    }

    public function manager(): WorktreeManager
    {
        return $this->share(WorktreeManager::class, fn (): WorktreeManager => new WorktreeManager(
            $this->project(),
            $this->git(),
            $this->worktrees(),
            $this->files(),
            $this->locks(),
            $this->checks(),
            $this->copied(),
            $this->provisioning(),
            $this->removal(),
            $this->branchMoves(),
            $this->dataTransfer(),
        ));
    }

    /** The answer the whole page is drawn from, kept apart from the doors. */
    public function state(): State
    {
        return $this->share(State::class, fn (): State => new State(
            $this->project(),
            $this->worktrees(),
            $this->git(),
            $this->php(),
            $this->jobs(),
            $this->recipes(),
            $this->installation(),
            $this->exposure(),
            $this->snapshot(),
        ));
    }

    public function operations(): Operations
    {
        return $this->share(Operations::class, fn (): Operations => new Operations($this->locks(), $this->jobs()));
    }

    public function commitPages(): CommitPages
    {
        return $this->share(CommitPages::class, fn (): CommitPages => new CommitPages(
            $this->project(),
            $this->git(),
            $this->recipes(),
        ));
    }

    public function api(): ApiController
    {
        return $this->share(ApiController::class, fn (): ApiController => new ApiController(
            $this->project(),
            $this->worktrees(),
            $this->manager(),
            $this->php(),
            $this->jobs(),
            $this->git(),
            $this->usage(),
            $this->state(),
            $this->operations(),
            $this->commitPages(),
        ));
    }

    /** What a request becomes, and what it is dispatched to. */
    public function router(): Router
    {
        return $this->share(Router::class, fn (): Router => new Router($this->api()));
    }

    public function snapshot(): Snapshot
    {
        return $this->share(Snapshot::class, fn (): Snapshot => new Snapshot($this->project(), $this->files()));
    }

    /** @return list<Command> */
    public function commands(): array
    {
        return [
            new AddCommand($this->jobs(), $this->web(), $this->manager()),
            new ForkCommand($this->jobs(), $this->web(), $this->manager()),
            new ProvisionCommand($this->jobs(), $this->web(), $this->manager()),
            new RemoveCommand($this->jobs(), $this->web(), $this->manager()),
            new SyncCommand($this->jobs(), $this->web(), $this->manager()),
            new PullCommand($this->jobs(), $this->web(), $this->manager()),
            new RestoreCommand($this->jobs(), $this->web(), $this->manager()),
            new DiscardCommand($this->jobs(), $this->web(), $this->manager()),
            new AccountCommand($this->jobs(), $this->web(), $this->manager()),
            new FetchCommand($this->jobs(), $this->web(), $this->git(), $this->ssh()),
            new ConfigCommand($this->manager(), $this->worktrees(), $this->describe()),
            new ExampleCommand($this->recipes(), $this->project(), $this->files()),
            new DescribeCommand($this->describe()),
            new CheckReleasesCommand($this->releases(), $this->project(), $this->files()),
            new DocsCommand($this->docs()),
            new ListWorktreesCommand($this->worktrees()),
            new ListJobsCommand($this->jobs()),
            new ShowJobCommand($this->jobs()),
            new PruneCommand($this->manager()),
            new PhpCommand($this->manager(), $this->worktrees(), $this->php()),
        ];
    }

    private function string(string $name, string $fallback): string
    {
        $value = $this->env[$name] ?? '';

        return $value !== '' ? $value : $fallback;
    }

    /**
     * @template T of object
     *
     * @param class-string<T> $id
     * @param callable(): T   $make
     *
     * @return T
     */
    private function share(string $id, callable $make): object
    {
        // On a variable rather than on the return: a docblock that hangs on
        // nothing is demoted to a plain comment by the coding-style pass, and the
        // analyser then stops seeing the type it is here to state.
        /** @var T $instance */
        $instance = $this->shared[$id] ??= $make();

        return $instance;
    }
}
