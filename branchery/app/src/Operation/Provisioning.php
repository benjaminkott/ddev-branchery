<?php

declare(strict_types=1);

namespace App\Operation;

use App\Config\Build;
use App\Config\Recipe;
use App\Config\Recipes;
use App\Config\WorktreeContext;
use App\Database\DatabaseOperations;
use App\Database\ProjectDatabase;
use App\Git\Git;
use App\Jobs\StepReporter;
use App\Project;
use App\Runtime\NodeVersions;
use App\Runtime\PhpVersions;
use App\Worktree\DescribeInfo;
use App\Worktree\Surroundings;
use App\Worktree\WorktreeRepository;

/**
 * Building a worktree that already stands on disk.
 *
 * This is the pipeline the three operations that make one all end in, and its
 * order is the whole of what it is: the configuration read before the versions
 * are chosen, the versions before the dependencies installed against them, the
 * database prepared before anything is put in it. A step that moves is a
 * worktree built out of something other than what it says.
 *
 * Marked as being built from the first line of it, so an operation that stops
 * halfway leaves a worktree the list can name -- and the mark is cleared at the
 * far end and nowhere else.
 */
final readonly class Provisioning
{
    public function __construct(
        private Project $project,
        private Git $git,
        private WorktreeRepository $worktrees,
        private Recipes $recipes,
        private ProjectDatabase $database,
        private DatabaseOperations $databases,
        private PhpVersions $php,
        private NodeVersions $node,
        private Surroundings $surroundings,
        private DescribeInfo $describe,
        private Contexts $contexts,
    ) {
    }

    /** Marks the project checkout as the source of the data. */
    public const string PROJECT_SOURCE = '@project';

    public function run(
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

        $context = $this->contexts->of($name, $branch);

        $reporter->step('Installing dependencies');
        $build->at('install', $context, $reporter);

        $reporter->step('Writing the configuration');
        $build->at('configure', $context, $reporter);
        $this->surroundings->writeEditorConfiguration($name, $context->url);

        $reporter->step(sprintf('Preparing the database (%s)', $context->databaseName));
        if ($fresh) {
            // Asked for in the interface with what it costs written out.
            $reporter->note(sprintf('Dropping %s -- the application is installed anew.', $context->databaseName));
            $this->databases->drop($context->databaseName);
        }
        $this->databases->create($context->databaseName);

        $data = $build->data();
        // Nothing is copied unless the configuration asks for it: a database a
        // checkout cannot read is worse than an empty one.
        $sourceDatabase = match (true) {
            $copyFrom === null, $data['from'] !== 'source' => null,
            $copyFrom === self::PROJECT_SOURCE => ProjectDatabase::PROJECT_DATABASE,
            default => $this->database->nameFor($copyFrom),
        };
        // Asked for and nothing to take: a fresh installation is what it needs.
        if ($sourceDatabase !== null && $this->databases->tables($sourceDatabase) <= 0) {
            $reporter->note(sprintf('%s holds no data; the application is installed instead.', $sourceDatabase));
            $sourceDatabase = null;
        }

        if ($sourceDatabase !== null) {
            $reporter->note(sprintf('Copying the database from %s', $sourceDatabase));
            $this->databases->copy($sourceDatabase, $context->databaseName);
            // A site points at its root page by uid, and those uids came with the
            // data -- so what reads them comes along, its addresses put on ours.
            $this->surroundings->bring(
                $copyFrom === self::PROJECT_SOURCE ? null : $copyFrom,
                $name,
                $data['bring'],
            );
            $this->surroundings->retargetSites($name, $context->url, $data['addresses'], $reporter);
            $this->fitOrInstall($build, $context, $reporter);
        } elseif ($this->databases->tables($context->databaseName) > 0 && $build->does('migrate')) {
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

    /** Only refresh the generated configuration, without rebuilding. */
    public function reconfigure(string $name, string $branch): void
    {
        $directory = $this->project->worktreeDirectory($name);
        $build = $this->recipes->for($directory);

        $context = $this->contexts->of($name, $branch);
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

    /**
     * Set by hand, from the page or the command line, rather than read out of the
     * checkout. Refused where the dependencies would not run under it: every
     * request would abort, and the row would say the version it was given.
     */
    public function setPhpVersion(string $name, string $version): void
    {
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
            ->at('flush', $this->contexts->of($name, $worktree->branch));
        $this->describe->refresh();
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
            $this->databases->drop($context->databaseName);
            $this->databases->create($context->databaseName);
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
}
