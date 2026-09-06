<?php

declare(strict_types=1);

namespace App\Worktree;

use App\Config\Recipes;
use App\Git\Git;
use App\Project;

/**
 * A page of a log, and each commit's way out to the forge.
 *
 * Two doors read one -- the commits of a worktree and the commits of a branch
 * nothing is checked out of -- and they differ only in which ref is read and
 * which checkout it is read out of. Written out at both, the paging arithmetic
 * and the address building were the same thing twice.
 *
 * The address is the project's own, under "links.commit": what a forge's URL
 * for a commit looks like is not something an add-on can work out from a
 * remote.
 */
final readonly class CommitPages
{
    /** How many commits a page of the log is. */
    private const int PAGE = 10;

    public function __construct(
        private Project $project,
        private Git $git,
        private Recipes $recipes,
    ) {
    }

    /**
     * One more commit than a page is read and not sent: whether there is a way
     * further is what the reader asks by looking, and asking git twice would be a
     * second process for one boolean.
     *
     * @param ?string $of   the checkout, null for the project's own
     * @param ?string $base where the branch was cut from, by name
     * @param string  $name the checkout an address leads back to, which for a
     *                      branch is the project's
     *
     * @return array{upstream: ?string, base: ?string, more: bool, commits: list<array<string, mixed>>}
     */
    public function page(?string $of, string $ref, ?string $base, int $skip, string $name): array
    {
        $commits = $this->git->commits($of, self::PAGE + 1, $skip, $base, $ref);
        $more = \count($commits) > self::PAGE;
        $where = $this->linkFor($of, $name);

        return [
            'upstream' => $this->git->upstreamOf($of, $ref),
            'base' => $base,
            'more' => $more,
            'commits' => array_map(
                fn (array $commit): array => [...$commit, 'url' => self::at($where, $commit['sha'])],
                $more ? \array_slice($commits, 0, self::PAGE) : $commits,
            ),
        ];
    }

    /** The same address for one commit, which is a door of its own. */
    public function urlOf(?string $of, string $name, string $sha): ?string
    {
        return self::at($this->linkFor($of, $name), $sha);
    }

    /**
     * Quietly: a project whose file has a typo in it still has commits, and a
     * page of them that will not come up says nothing about which file to fix.
     */
    private function linkFor(?string $of, string $name): ?string
    {
        return $this->recipes->quietly($of === null
            ? $this->project->root()
            : $this->project->worktreeDirectory($name))->links()['commit'];
    }

    private static function at(?string $where, string $sha): ?string
    {
        return $where === null ? null : str_replace('{commit}', rawurlencode($sha), $where);
    }
}
