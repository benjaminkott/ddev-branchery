/**
 * What the list of worktrees says, before anything is drawn of it.
 *
 * The one worth holding to is the first: where the project could not be asked
 * at all, the list says nothing whatever. A note over the page has already said
 * the container is away, and "no worktree yet" under it is a second answer to
 * the same question -- and the wrong one, since there may be a dozen and nobody
 * could ask.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { heading, listing, type ListState } from '../listing.js';

/** A project that answered, with a dozen worktrees and no filter typed. */
function list(said: Partial<ListState> = {}): ListState {
    return {
        unreachable: false,
        loading: false,
        entries: 13,
        total: 12,
        shown: 12,
        pending: 0,
        filtered: false,
        ...said,
    };
}

describe('what the list says', () => {
    it('says nothing at all where the project could not be asked and nothing is known', () => {
        const away = list({ unreachable: true, entries: 0, total: 0, shown: 0 });

        assert.deepEqual(listing(away), { shown: 'nothing' });
        assert.equal(heading(away), null, 'a list that says nothing has nothing to be counted over it');
    });

    /**
     * What was read before the container went away is still true of the project,
     * and taking it off the page would say it had stopped being so.
     */
    it('keeps showing what it had when the project stops answering', () => {
        assert.deepEqual(listing(list({ unreachable: true })), { shown: 'rows' });
    });

    it('stands as its own shape while the answer is on its way', () => {
        assert.deepEqual(listing(list({ loading: true, entries: 0, total: 0, shown: 0 })), { shown: 'waiting' });
    });

    it('tells a project with no worktrees from a filter that matched none', () => {
        assert.deepEqual(listing(list({ entries: 1, total: 0, shown: 0 })), { shown: 'empty', because: 'none' });
        assert.deepEqual(listing(list({ shown: 0, filtered: true })), { shown: 'empty', because: 'noMatch' });
    });

    /**
     * A worktree on its way has no directory and so no row of its own; its
     * operation stands in for it, so the list never says "none" while one is
     * being made.
     */
    it('is not empty while one is being made', () => {
        assert.deepEqual(listing(list({ total: 0, shown: 0, pending: 1 })), { shown: 'rows' });
    });
});

describe('what stands over the list', () => {
    it('names them rather than counting to nothing', () => {
        assert.deepEqual(heading(list({ total: 0, shown: 0 })), { key: 'nav.worktrees', params: {} });
        assert.deepEqual(heading(list({ loading: true })), { key: 'nav.worktrees', params: {} });
    });

    it('counts them where there are some', () => {
        assert.deepEqual(heading(list()), { key: 'overview.worktrees', params: { count: 12 } });
    });

    /** Narrowed, the question is how much of it is left to see. */
    it('says how much of it is left while it is narrowed', () => {
        assert.deepEqual(heading(list({ filtered: true, shown: 3 })), {
            key: 'overview.matching',
            params: { shown: 3, total: 12 },
        });
    });
});
