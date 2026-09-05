<?php

declare(strict_types=1);

namespace App\Git;

/**
 * Where a branch was cut from, and how far both sides have gone since -- what a
 * graph shows at a glance and the list used to say none of. git keeps no
 * parent for a branch, so it is derived the way a graph derives it: from where
 * each pair of branches parts.
 *
 * What the fork wrote down wins where it was written. Otherwise the base is the
 * candidate the branch parted from most recently -- the fewest commits of its
 * own since the parting, and among those the one whose tip is nearest it, which
 * is how "off v14.0" beats "off another branch cut from v14.0".
 */
final class Lineage
{
    /**
     * The base of one branch, out of how far it stands from every candidate.
     *
     * @param array<string, array{int, int}> $distances candidate => [commits
     *                                                  only on the candidate,
     *                                                  commits only on the
     *                                                  branch]
     * @param list<string>                   $trunks    the branches everything
     *                                                  else is cut from, which
     *                                                  win a tie and are never
     *                                                  said to be cut from
     *                                                  anything themselves
     * @param ?string                        $recorded  what was written down
     *                                                  when the branch was cut
     *
     * @return ?array{branch: string, own: int, moved: int}
     */
    public static function baseOf(string $branch, array $distances, array $trunks, ?string $recorded = null): ?array
    {
        unset($distances[$branch]);
        if (in_array($branch, $trunks, true) || $distances === []) {
            return null;
        }
        if ($recorded !== null && isset($distances[$recorded])) {
            return self::said($recorded, $distances[$recorded]);
        }

        $best = null;
        foreach ($distances as $candidate => [$moved, $own]) {
            // A branch called "95618" is an integer key to PHP and the trunk list
            // holds strings: compared strictly the two never meet, and handed on as it
            // is the integer is refused by the type below.
            $candidate = (string) $candidate;
            // A candidate with nothing of its own beyond this branch's tip was cut
            // from this branch, not the other way round.
            if ($own === 0 && $moved > 0) {
                continue;
            }
            $rank = [$own, in_array($candidate, $trunks, true) ? 0 : 1, $moved, $candidate];
            if ($best === null || $rank < $best['rank']) {
                $best = ['rank' => $rank, 'candidate' => $candidate, 'distance' => [$moved, $own]];
            }
        }

        return $best === null ? null : self::said($best['candidate'], $best['distance']);
    }

    /**
     * @param array{int, int} $distance
     *
     * @return array{branch: string, own: int, moved: int}
     */
    private static function said(string $candidate, array $distance): array
    {
        return ['branch' => $candidate, 'own' => $distance[1], 'moved' => $distance[0]];
    }

    /**
     * The table git wrote, one pair per line: branch, candidate, and the two counts
     * as "rev-list --left-right --count candidate...branch" prints them.
     *
     * @return array<string, array<string, array{int, int}>> branch => candidate => [moved, own]
     */
    public static function distancesOf(string $output): array
    {
        $distances = [];
        foreach (explode("\n", $output) as $line) {
            $parts = explode("\t", trim($line));
            if (\count($parts) !== 4 || !ctype_digit($parts[2]) || !ctype_digit($parts[3])) {
                continue;
            }
            $distances[$parts[0]][$parts[1]] = [(int) $parts[2], (int) $parts[3]];
        }

        return $distances;
    }
}
