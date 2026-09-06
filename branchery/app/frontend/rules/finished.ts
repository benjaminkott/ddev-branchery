/**
 * Which worktrees are done with. On its own and pure, for the same reason the
 * filter is: this decides what a press removes.
 */

import type { Worktree } from '../types.js';

/**
 * Two signals, and a veto. Merged means every commit is in the project's own
 * branch, so letting it go loses nothing. Gone means the branch it tracked is
 * off the remote -- what a squashed pull request leaves behind, almost always
 * finished, but offered and not assumed.
 *
 * Uncommitted work vetoes both: a checkout with changes in it is one somebody
 * is standing in, however its branch reads.
 */
export function finished(worktrees: Worktree[]): Worktree[] {
    return worktrees.filter(
        (worktree) => !worktree.isProject && (worktree.merged || worktree.gone) && worktree.changes === 0,
    );
}

export function losesNothing(worktree: Worktree): boolean {
    return worktree.merged;
}
