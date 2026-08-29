/**
 * The rows under the branch they were cut from. A graph shows lineage as lanes;
 * a table has only its order, so the rows stand together with the others cut
 * from the same base: whatever is cut from nothing first, then the rows off the
 * project's own branch, then the other bases in reading order. Within a group
 * the order the list had is the order it keeps.
 */

import type { Worktree } from './types.js';

export function byBase(worktrees: readonly Worktree[], trunk: string): Worktree[] {
    const rank = (worktree: Worktree): [number, string] =>
        worktree.base === null ? [0, ''] : worktree.base.branch === trunk ? [1, ''] : [2, worktree.base.branch];

    return worktrees
        .map((worktree, at) => ({ worktree, at, rank: rank(worktree) }))
        .sort(
            (a, b) =>
                a.rank[0] - b.rank[0] ||
                a.rank[1].localeCompare(b.rank[1], undefined, { numeric: true }) ||
                a.at - b.at,
        )
        .map((entry) => entry.worktree);
}
