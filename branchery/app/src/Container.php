<?php

declare(strict_types=1);

namespace App;

use App\Command\AddCommand;
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
use App\Controller\ApiController;
use App\Git\Facts;
use App\Git\History;
use App\Git\Repository;
use App\Git\Runner;
use App\Git\WorkingCopy;
use App\Operation\BranchMoves;
use App\Operation\CarriedFiles;
use App\Operation\Contexts;
use App\Operation\DataTransfer;
use App\Operation\Preflight;
use App\Operation\Provisioning;
use App\Operation\Removal;
use App\Service\DatabaseOperations;
use App\Service\DescribeInfo;
use App\Service\DockerContainer;
use App\Service\Docs;
use App\Service\Git;
use App\Service\Installation;
use App\Service\JobRunner;
use App\Service\Locks;
use App\Service\ManagedFiles;
use App\Service\NodeVersions;
use App\Service\PhpVersions;
use App\Service\Project;
use App\Service\ProjectDatabase;
use App\Service\Recipes;
use App\Service\Runtimes;
use App\Service\Snapshot;
use App\Service\SshAgent;
use App\Service\Surroundings;
use App\Service\VersionMap;
use App\Service\WebContainer;
use App\Service\WorktreeManager;
use App\Service\WorktreeRepository;
use App\Service\WorktreeUsage;
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
     * The image copies it to one place and the working copy is in another; both are
     * answered by asking the code where it is rather than by naming either.
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

    public function database(): ProjectDatabase
    {
        return $this->share(ProjectDatabase::class, fn (): ProjectDatabase => new ProjectDatabase($this->web()));
    }

    public function databaseOperations(): DatabaseOperations
    {
        return $this->share(DatabaseOperations::class, fn (): DatabaseOperations => new DatabaseOperations(
            $this->web(),
            $this->database(),
        ));
    }

    public function worktrees(): WorktreeRepository
    {
        return $this->share(WorktreeRepository::class, fn (): WorktreeRepository => new WorktreeRepository(
            $this->project(),
            $this->files(),
            $this->php(),
            $this->node(),
            $this->git(),
            $this->database(),
            $this->recipes(),
        ));
    }

    public function usage(): WorktreeUsage
    {
        return $this->share(WorktreeUsage::class, fn (): WorktreeUsage => new WorktreeUsage(
            $this->project(),
            $this->web(),
            $this->database(),
            $this->databaseOperations(),
        ));
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

    public function describe(): DescribeInfo
    {
        return $this->share(DescribeInfo::class, fn (): DescribeInfo => new DescribeInfo(
            $this->project(),
            $this->worktrees(),
            $this->database(),
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
            // Background operations start the console of this very application.
            consoleBinary: self::home() . '/bin/console',
        ));
    }

    /**
     * What an operation is made of, one named thing at a time. The order they are
     * put in is WorktreeManager's, which is the whole of what it does.
     */
    public function contexts(): Contexts
    {
        return $this->share(Contexts::class, fn (): Contexts => new Contexts(
            $this->project(),
            $this->recipes(),
            $this->php(),
            $this->node(),
            $this->database(),
            $this->web(),
            $this->files(),
        ));
    }

    public function carried(): CarriedFiles
    {
        return $this->share(CarriedFiles::class, fn (): CarriedFiles => new CarriedFiles(
            $this->project(),
            $this->git(),
            $this->recipes(),
            $this->web(),
        ));
    }

    public function preflight(): Preflight
    {
        return $this->share(Preflight::class, fn (): Preflight => new Preflight(
            $this->project(),
            $this->git(),
            $this->recipes(),
            $this->php(),
            $this->database(),
            $this->databaseOperations(),
            $this->worktrees(),
            $this->carried(),
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
            $this->database(),
            $this->databaseOperations(),
            $this->php(),
            $this->node(),
            $this->surroundings(),
            $this->describe(),
            $this->contexts(),
        ));
    }

    public function removal(): Removal
    {
        return $this->share(Removal::class, fn (): Removal => new Removal(
            $this->project(),
            $this->git(),
            $this->worktrees(),
            $this->files(),
            $this->database(),
            $this->databaseOperations(),
            $this->php(),
            $this->node(),
            $this->surroundings(),
            $this->describe(),
            $this->preflight(),
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
            $this->database(),
            $this->databaseOperations(),
            $this->surroundings(),
            $this->worktrees(),
            $this->contexts(),
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
            $this->preflight(),
            $this->carried(),
            $this->provisioning(),
            $this->removal(),
            $this->branchMoves(),
            $this->dataTransfer(),
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
            $this->recipes(),
            $this->locks(),
            $this->installation(),
            $this->usage(),
            $this->snapshot(),
        ));
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
            new FetchCommand($this->jobs(), $this->web(), $this->git(), $this->ssh()),
            new ConfigCommand($this->manager(), $this->worktrees(), $this->describe()),
            new ExampleCommand($this->recipes(), $this->project(), $this->files()),
            new DescribeCommand($this->describe()),
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
