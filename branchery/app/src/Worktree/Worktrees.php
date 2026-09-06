<?php

declare(strict_types=1);

namespace App\Worktree;

use App\Config\Recipes;
use App\Git\Git;
use App\Git\Lineage;
use App\ManagedFiles;
use App\Model\Branch;
use App\Model\BranchDetail;
use App\Model\Worktree;
use App\Model\WorktreeState;
use App\Project;
use App\Text;
use App\Web\DatabaseServer;

/** Reads and writes the metadata of the worktrees (.ddev/worktrees/<name>.json). */
final readonly class Worktrees
{
    public function __construct(
        private Project $project,
        private ManagedFiles $files,
        private PhpVersions $php,
        private NodeVersions $node,
        private Git $git,
        private DatabaseServer $database,
        private Recipes $recipes,
    ) {
    }

    /**
     * Only for a name a worktree can have: "." and ".." are directories under
     * worktrees/ too, and an operation that took either for a worktree would do to
     * all of them what it meant to do to one.
     */
    public function exists(string $name): bool
    {
        return preg_match(Project::NAME_PATTERN, $name) === 1 && is_dir($this->project->worktreeDirectory($name));
    }

    /** @return array<string, mixed> */
    public function metadata(string $name): array
    {
        $file = $this->metadataFile($name);
        if (!is_file($file)) {
            return [];
        }
        $data = json_decode((string) file_get_contents($file), true);

        return is_array($data) ? $data : [];
    }

    /** @param array<string, mixed> $values */
    public function store(string $name, array $values): void
    {
        $data = [...$this->metadata($name), ...$values];
        ksort($data);
        $this->files->write(
            $this->metadataFile($name),
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n",
        );
    }

    public function forget(string $name): void
    {
        $this->files->remove($this->metadataFile($name));
    }

    public function get(string $name): ?Worktree
    {
        if (!$this->exists($name)) {
            return null;
        }

        $branch = $this->branchOf($name);
        $trunks = $this->trunks();

        return $this->build(
            $name,
            $branch,
            // The same reading the list does of every worktree at once, so what it
            // says here is word for word what the row says.
            $this->git->checkoutState($name),
            $this->git->finishedBranches($this->git->currentBranch()),
            $trunks,
            $this->git->distances([$branch], $this->candidates($trunks)),
        );
    }

    /**
     * What the remote calls its own branch, and what the project checkout is on.
     * They win a tie and are never said to be cut from anything.
     *
     * @return list<string>
     */
    private function trunks(): array
    {
        return array_values(array_unique(array_filter(
            [$this->git->defaultBranch(), $this->git->currentBranch()],
            static fn (?string $branch): bool => $branch !== null && $branch !== '' && $branch !== 'HEAD',
        )));
    }

    /**
     * The trunks and the branch of every worktree -- a patch is cut from a release
     * branch as often as from the trunk, and the release branch is a worktree here.
     *
     * @param list<string> $trunks
     *
     * @return list<string>
     */
    private function candidates(array $trunks): array
    {
        $branches = $this->git->worktreeBranches();
        $candidates = $trunks;
        foreach ($this->names() as $name) {
            $branch = $this->branchOf($name, $branches[$name] ?? null);
            if ($branch !== '') {
                $candidates[] = $branch;
            }
        }

        return array_values(array_unique($candidates));
    }

    /**
     * A detached checkout says "HEAD", which is not a branch and must not be listed
     * as one: the branch it was made for is the honest answer.
     */
    private function branchOf(string $name, ?string $known = null): string
    {
        if ($known !== null) {
            return $known;
        }
        $said = $this->git->inWorktree($name, 'rev-parse', '--abbrev-ref', 'HEAD')->output;

        return $said !== '' && $said !== 'HEAD' ? $said : (string) ($this->metadata($name)['branch'] ?? '');
    }

    /**
     * The things only git knows are handed in rather than asked for here: asked one
     * worktree at a time they are several container calls each. What is read off
     * the disk is read once -- the metadata, the composer.json and the profile used
     * to be asked for twice while one row was built.
     *
     * @param array{merged: list<string>, gone: list<string>} $finished
     * @param list<string>                                    $trunks
     * @param array<string, array<string, array{int, int}>>   $distances
     */
    private function build(
        string $name,
        string $branch,
        WorktreeState $state,
        array $finished = ['merged' => [], 'gone' => []],
        array $trunks = [],
        array $distances = [],
    ): Worktree {
        $meta = $this->metadata($name);
        $directory = $this->project->worktreeDirectory($name);
        // Quietly, like everything the interface reads: a configuration that
        // cannot be parsed costs the operations, not the list.
        $build = $this->recipes->quietly($directory);
        // Where the project puts its dependencies, not where they usually are: a
        // composer.json may say ".build/vendor", and asking for the wrong
        // directory makes every worktree look like one whose build never ran.
        $vendor = $this->vendorDirectory($directory);
        $url = $this->project->urlFor($name);
        $talkedAbout = $this->talkedAboutAt($build->links(), $state);

        return new Worktree(
            name: $name,
            branch: $branch,
            // Where nothing was written down, the branch it is on now is the best
            // that can be said, and it says the worktree has not wandered.
            madeFor: isset($meta['branch']) ? (string) $meta['branch'] : $branch,
            php: $this->php->forWorktree($name),
            minPhp: $this->php->minimumFor($name, $vendor),
            node: $this->node->forWorktree($name),
            database: $this->database->nameFor($name),
            profile: $build->name(),
            docroot: (string) ($meta['docroot'] ?? ''),
            url: $url,
            entrypoints: self::entrypointsUnder($url, $build->entrypoints()),
            path: $this->project->hostWorktreeDirectory($name),
            changes: $state->changes,
            ahead: $state->ahead,
            behind: $state->behind,
            ready: is_dir($directory . '/' . $vendor)
                || !is_file($directory . '/composer.json'),
            // A branch with nothing of its own on it is "merged" to git, and a fork
            // cut yesterday and never committed to is exactly that. Finished is work
            // that was done and taken in, so such a fork is not offered.
            merged: in_array($branch, $finished['merged'], true) && !self::neverMoved($meta, $state),
            gone: in_array($branch, $finished['gone'], true),
            builtAt: isset($meta['builtAt']) ? (int) $meta['builtAt'] : null,
            // What the build reads changed since it was made -- see
            // Git::worktreeStates(). One built before the commit was written down has
            // nothing to compare against, or every older worktree would be marked.
            stale: $state->rebuild,
            // Written when the build begins and cleared when it is through, so this
            // is a build that stopped in between -- or one running right now, which is
            // drawn as what is being done to it wherever an operation is known.
            incomplete: isset($meta['building']),
            review: $talkedAbout['review'],
            issue: $talkedAbout['issue'],
            issueId: $talkedAbout['issueId'],
            forkedFrom: isset($meta['forkedFrom']) ? (string) $meta['forkedFrom'] : null,
            forkedAt: isset($meta['forkedAt']) ? (string) $meta['forkedAt'] : null,
            // What the fork wrote down where it was written, and the nearest parting
            // otherwise -- see Lineage.
            base: Lineage::baseOf($branch, $distances[$branch] ?? [], $trunks, isset($meta['forkedFrom']) ? (string) $meta['forkedFrom'] : null),
            tip: $state->tip,
        );
    }

    /**
     * @param array<string, mixed> $meta
     */
    private static function neverMoved(array $meta, WorktreeState $state): bool
    {
        return isset($meta['forkedAt']) && $state->head !== '' && (string) $meta['forkedAt'] === $state->head;
    }

    /**
     * It belongs in the overview because it is the same kind of state under an
     * address of its own -- just the one DDEV is configured in.
     */
    public function project(): Worktree
    {
        $root = $this->project->root();
        $branch = $this->git->currentBranch();
        // What it holds, in one question rather than three.
        $state = $this->git->checkoutState();
        // Out of the project's own file: Branchery does not build this checkout,
        // but the file saying how its worktrees are built says as much about the
        // checkout they are cut from.
        $build = $this->recipes->quietly($root);
        $url = sprintf('https://%s/', $this->project->tld());
        // Where the checkout itself stands: the project on a branch of its own --
        // a fix to the lock file, say -- is two commits past the trunk, and the
        // list is where that is looked for.
        $trunks = $this->trunks();
        $distances = $branch === '' ? [] : $this->git->distances([$branch], $this->candidates($trunks));

        return new Worktree(
            name: $this->project->name(),
            branch: $branch !== '' ? $branch : '?',
            madeFor: null,
            php: $this->php->projectVersion(),
            minPhp: $this->php->minimumFor('', $this->vendorDirectory($root)),
            node: $this->node->projectVersion(),
            database: DatabaseServer::PROJECT_DATABASE,
            profile: $build->name(),
            docroot: '',
            url: $url,
            entrypoints: self::entrypointsUnder($url, $build->entrypoints()),
            path: $this->project->hostRoot(),
            changes: $state->changes,
            ahead: $state->ahead,
            behind: $state->behind,
            ready: true,
            isProject: true,
            base: $branch === '' ? null : Lineage::baseOf($branch, $distances[$branch] ?? [], $trunks),
            tip: $state->tip,
        );
    }

    /**
     * Nothing is asked of git here, which is what makes this the cheap way to find
     * out which ones there are.
     *
     * @return list<string>
     */
    public function names(): array
    {
        $names = array_map(
            static fn (string $directory): string => basename($directory),
            glob($this->project->worktreesDirectory() . '/*', GLOB_ONLYDIR) ?: [],
        );

        return Text::inReadingOrder($names);
    }

    /**
     * With git asked twice for all of them rather than twice for each.
     *
     * @return list<Worktree>
     */
    public function all(): array
    {
        $branches = $this->git->worktreeBranches();
        $states = $this->git->worktreeStates();
        // Asked once for the repository: what is merged and what has lost its
        // remote are properties of the branch list, not of any one checkout.
        $finished = $this->git->finishedBranches($this->git->currentBranch());
        // Every pair of branches, in one process.
        $trunks = $this->trunks();
        $candidates = $this->candidates($trunks);
        $distances = $this->git->distances($candidates, $candidates);

        $worktrees = [];
        foreach ($this->names() as $name) {
            $worktrees[] = $this->build(
                $name,
                $this->branchOf($name, $branches[$name] ?? null),
                // A worktree the loop did not reach is asked on its own. Calling it
                // nought would say there is nothing uncommitted in a checkout nobody
                // looked at -- the one thing that must not be wrong before a removal.
                $states[$name] ?? new WorktreeState($this->git->changeCount($name), null, null),
                $finished,
                $trunks,
                $distances,
            );
        }

        return $worktrees;
    }

    /**
     * Only the branches are read: what a worktree runs on and whether it was built
     * have no say in which branches are still free.
     *
     * @return list<Branch>
     */
    public function availableBranches(): array
    {
        $branches = $this->git->worktreeBranches();
        // By name, because this is asked of every branch there is: a repository
        // carries thousands of them.
        $taken = [$this->git->currentBranch() => true];
        foreach ($this->names() as $name) {
            $taken[$this->branchOf($name, $branches[$name] ?? null)] = true;
        }

        // In the order git gave them: the one that moved last is the one to show
        // first, and sorting the names would throw exactly that away.
        return array_values(array_filter(
            $this->git->branchesByRecency(),
            static fn (Branch $branch): bool => !isset($taken[$branch->name]),
        ));
    }

    /**
     * Null where neither this repository nor its remote has such a branch: an
     * address with a branch name in it outlives the branch.
     */
    public function branch(string $name): ?BranchDetail
    {
        $branch = $this->git->branchNamed($name);
        $ref = $this->git->refOf($name);
        if ($branch === null || $ref === null) {
            return null;
        }

        $tracking = $this->git->tracking(null, $ref);
        // A property of the branch list rather than of any checkout, which is why
        // one question answers it for all of them.
        $finished = $this->git->finishedBranches($this->git->currentBranch());

        return new BranchDetail(
            $branch,
            $this->baseOf($ref),
            $this->git->upstreamOf(null, $ref),
            $tracking[0] ?? null,
            $tracking[1] ?? null,
            in_array($name, $finished['merged'], true),
            in_array($name, $finished['gone'], true),
            $this->worktreeOn($name),
        );
    }

    /**
     * The same reading the list does for every worktree at once, asked about one.
     *
     * @return ?array{branch: string, own: int, moved: int}
     */
    public function baseOf(string $ref): ?array
    {
        $trunks = $this->trunks();

        return Lineage::baseOf($ref, $this->git->distances([$ref], $this->candidates($trunks))[$ref] ?? [], $trunks);
    }

    /**
     * The log of a branch is drawn against where it was cut from, and that one
     * field used to be read out of a whole row built for it -- four questions to
     * git for a page that asks again on every step further back.
     *
     * @return ?array{branch: string, own: int, moved: int}
     */
    public function baseOfCheckout(?string $name): ?array
    {
        $branch = $name === null
            ? $this->git->currentBranch()
            : $this->branchOf($name, $this->git->worktreeBranches()[$name] ?? null);
        if ($branch === '') {
            return null;
        }

        $trunks = $this->trunks();
        // What the fork wrote down, where it was written: git keeps no such
        // thing, and it wins over the nearest parting -- see Lineage.
        $recorded = $name === null ? null : $this->metadata($name)['forkedFrom'] ?? null;

        return Lineage::baseOf(
            $branch,
            $this->git->distances([$branch], $this->candidates($trunks))[$branch] ?? [],
            $trunks,
            $recorded === null ? null : (string) $recorded,
        );
    }

    /**
     * The project's own checkout included: it is a checkout like the others, and
     * the one the trunk is nearly always on.
     */
    private function worktreeOn(string $branch): ?string
    {
        if ($branch === $this->git->currentBranch()) {
            return $this->project->name();
        }
        $branches = $this->git->worktreeBranches();
        foreach ($this->names() as $name) {
            if ($this->branchOf($name, $branches[$name] ?? null) === $branch) {
                return $name;
            }
        }

        return null;
    }

    /**
     * Both halves have to be there: a commit that names a review or an issue, and a
     * project that has said where those live. Either alone is a number nobody can
     * follow or an address with nothing to put in it.
     *
     * @param array{review: ?string, issue: ?string} $links
     *
     * @return array{review: ?string, issue: ?string, issueId: ?string}
     */
    private function talkedAboutAt(array $links, WorktreeState $state): array
    {
        return [
            'review' => $state->change !== '' && $links['review'] !== null
                ? str_replace('{change}', rawurlencode($state->change), $links['review'])
                : null,
            'issue' => $state->issue !== '' && $links['issue'] !== null
                ? str_replace('{issue}', rawurlencode($state->issue), $links['issue'])
                : null,
            'issueId' => $state->issue !== '' ? $state->issue : null,
        ];
    }

    /**
     * Only what the configuration says: a project that named none is offered none,
     * and a guess would be a link to a page that is not there.
     *
     * @param list<array{name: string, path: string}> $entrypoints
     *
     * @return list<array{name: string, url: string}>
     */
    private static function entrypointsUnder(string $url, array $entrypoints): array
    {
        return array_map(
            static fn (array $entry): array => ['name' => $entry['name'], 'url' => rtrim($url, '/') . $entry['path']],
            $entrypoints,
        );
    }

    /** Composer projects are free to put their vendor directory anywhere. */
    public function vendorDirectory(string $directory): string
    {
        $file = $directory . '/composer.json';
        if (!is_file($file)) {
            return 'vendor';
        }
        $composer = json_decode((string) file_get_contents($file), true);

        return is_array($composer) ? (string) ($composer['config']['vendor-dir'] ?? 'vendor') : 'vendor';
    }

    private function metadataFile(string $name): string
    {
        return $this->project->metadataDirectory() . '/' . $name . '.json';
    }
}
