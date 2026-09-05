/**
 * What the list of worktrees is, before anything is drawn of it.
 *
 * Five states, and the one worth the trouble is the first: where the project
 * cannot be asked at all, the list says nothing whatever. A note over the page
 * already says the container is away, and "no worktree yet" under it is a
 * second answer to the same question -- and the wrong one, since there may be
 * a dozen and nobody could ask.
 *
 * The heading follows the same reading, which is why both are decided here: a
 * list that says nothing has nothing to be counted over it.
 */

/** What the two questions below are decided out of. */
export interface ListState {
    /** Whether the container answered at all. */
    unreachable: boolean;
    /** Whether an answer is still on its way. */
    loading: boolean;
    /** The rows there could be, the project's own checkout counted among them. */
    entries: number;
    /** How many worktrees there are, the project's own not counted. */
    total: number;
    /** What the filter leaves list. */
    shown: number;
    /** Operations making a worktree that has no row of its own yet. */
    pending: number;
    /** Whether the reader has narrowed the list. */
    filtered: boolean;
}

export type Listing =
    /** Nothing at all: the note over the page has said why. */
    | { shown: 'nothing' }
    /** The shape it will have, at the height it will have. */
    | { shown: 'waiting' }
    /** Nothing to show, and which of the two reasons it is. */
    | { shown: 'empty'; because: 'none' | 'noMatch' }
    | { shown: 'rows' };

export function listing(list: ListState): Listing {
    if (silent(list)) {
        return { shown: 'nothing' };
    }
    if (list.loading) {
        return { shown: 'waiting' };
    }
    if (list.shown === 0 && list.pending === 0) {
        return { shown: 'empty', because: list.filtered ? 'noMatch' : 'none' };
    }

    return { shown: 'rows' };
}

/** What stands over it, as the line to say and what to say it with. */
export interface Heading {
    key: string;
    params: Record<string, number>;
}

export function heading(list: ListState): Heading | null {
    if (silent(list)) {
        return null;
    }
    // Named rather than counted while there is nothing to count: "0 worktrees"
    // over "No worktree yet" is the same sentence twice.
    if (list.loading || list.total === 0) {
        return { key: 'nav.worktrees', params: {} };
    }
    // While it is narrowed the question is how much of it is left to see.
    return list.filtered
        ? { key: 'overview.matching', params: { shown: list.shown, total: list.total } }
        : { key: 'overview.worktrees', params: { count: list.total } };
}

/**
 * The project could not be asked and there is nothing left over from before it
 * could not. Anything drawn here would be this page answering for a container
 * that said nothing.
 */
function silent(list: ListState): boolean {
    return list.unreachable && list.entries === 0;
}
