/**
 * What may be done to a worktree, and what is offered without being live.
 *
 * The rule that matters is the second one: an operation the container would
 * refuse on its own grounds is not offered as though it would work -- pressed
 * on a branch that was up to date already, "bring up to date" ran a whole
 * operation to say so. So a press that cannot do anything is drawn held, with
 * the reason on it, rather than left out: gone, it would read as an operation
 * this worktree does not have.
 *
 * Kept apart from the row of buttons because it is a decision and they are
 * elements: the page builds each by hand and keeps it, and nothing about which
 * of them is offered was reachable without a browser.
 */

import type { Worktree } from './types.js';

/** Everything a reader can set going from the page about one worktree. */
export type Action = 'restore' | 'pull' | 'edit' | 'sync' | 'provision' | 'discard' | 'remove';

/** One of them as the page offers it: which, and why it cannot be pressed. */
export interface Offer {
    action: Action;
    /** Why it cannot be pressed, as the line that says so -- or null where it can. */
    held: string | null;
}

export interface Actions {
    /** What is done to the worktree, in the order they stand. */
    doing: Offer[];
    /** What takes something away, and stands at the far end of the row. */
    undoing: Offer[];
}

/**
 * A checkout that has wandered off the branch it was made for. Its address, its
 * database and its record still belong to that branch, so what it is offered is
 * the way back rather than the way forward.
 */
export function wandered(worktree: Worktree): boolean {
    return worktree.madeFor !== null && worktree.madeFor !== worktree.branch;
}

export function actions(worktree: Worktree): Actions {
    return { doing: [...onBranch(worktree), ...always], undoing: undoing(worktree) };
}

/** The three that are true of every worktree, whatever state it is in. */
const always: Offer[] = [
    { action: 'edit', held: null },
    { action: 'sync', held: null },
    { action: 'provision', held: null },
];

/**
 * One of the two, or neither. The way back stands in the way forward's place
 * while the checkout is on something else, and there is no way forward at all
 * where the branch tracks nothing to come forward from.
 */
function onBranch(worktree: Worktree): Offer[] {
    if (wandered(worktree)) {
        return [{ action: 'restore', held: null }];
    }
    if (worktree.behind === null) {
        return [];
    }

    return [{ action: 'pull', held: worktree.behind === 0 ? 'detail.pullBlocked' : null }];
}

/**
 * Dropping what was never pushed is offered only where there is something to
 * drop, and held while the checkout has uncommitted work: the operation puts
 * the branch back on its remote, and what is not committed would go with it.
 */
function undoing(worktree: Worktree): Offer[] {
    const dropping: Offer[] =
        (worktree.ahead ?? 0) > 0
            ? [{ action: 'discard', held: worktree.changes > 0 ? 'detail.discardBlocked' : null }]
            : [];

    return [...dropping, { action: 'remove', held: null }];
}
