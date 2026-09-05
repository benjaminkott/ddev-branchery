/**
 * What may be done to a worktree, and what is offered without being live.
 *
 * The rule nobody could see before: which presses a page offers was decided
 * while the buttons were being built, so the only way to ask was to look. Every
 * one of these is a state a worktree is really in, and getting one wrong offers
 * an operation the container refuses or hides one it would have taken.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { type Action, actions, type Offer, wandered } from '../rules/actions.js';
import type { Worktree } from '../types.js';

/** A worktree in the ordinary state: on its branch, in step, nothing pending. */
function worktree(said: Partial<Worktree> = {}): Worktree {
    return {
        name: 'demo',
        branch: 'feature/x',
        madeFor: 'feature/x',
        ahead: 0,
        behind: 0,
        changes: 0,
        ...said,
    } as Worktree;
}

function names(offers: Offer[]): Action[] {
    return offers.map((offer) => offer.action);
}

function heldReason(offers: Offer[], action: Action): string | null | undefined {
    return offers.find((offer) => offer.action === action)?.held;
}

describe('what can be done to a worktree', () => {
    it('always offers the three that are true of every one of them', () => {
        const { doing } = actions(worktree());

        for (const action of ['edit', 'sync', 'provision'] as const) {
            assert.ok(names(doing).includes(action), `${action} was not offered`);
        }
    });

    it('always offers removing it, and nothing holds that back', () => {
        const { undoing } = actions(worktree({ changes: 12, ahead: 3 }));

        assert.equal(heldReason(undoing, 'remove'), null);
    });

    /**
     * Offered where there is a remote to bring from, live where it has something
     * to bring: pressed on a branch that had everything already, it ran a whole
     * operation to say so.
     */
    it('offers bringing the branch up to date, held while there is nothing to bring', () => {
        assert.equal(heldReason(actions(worktree({ behind: 4 })).doing, 'pull'), null);
        assert.equal(heldReason(actions(worktree({ behind: 0 })).doing, 'pull'), 'detail.pullBlocked');
    });

    it('offers no way forward where the branch tracks nothing to come forward from', () => {
        const { doing } = actions(worktree({ behind: null }));

        assert.ok(!names(doing).includes('pull'));
        assert.ok(!names(doing).includes('restore'));
    });

    /**
     * A checkout that wandered off the branch it was made for keeps that branch's
     * address, database and record, so what it is offered is the way back --
     * in the place of the way forward, not beside it.
     */
    it('offers the way back instead of the way forward once the checkout has wandered', () => {
        const { doing } = actions(worktree({ madeFor: 'feature/x', branch: 'some/patch', behind: 4 }));

        assert.ok(names(doing).includes('restore'));
        assert.ok(!names(doing).includes('pull'), 'both ways were offered at once');
    });

    it('offers dropping what was never pushed only where there is something to drop', () => {
        assert.ok(!names(actions(worktree({ ahead: 0 })).undoing).includes('discard'));
        assert.ok(names(actions(worktree({ ahead: 2 })).undoing).includes('discard'));
    });

    /**
     * The operation puts the branch back on its remote, and what is not committed
     * would go with it -- so it is offered and held, with the reason on it, rather
     * than quietly left out.
     */
    it('holds dropping back while the checkout has uncommitted work', () => {
        assert.equal(heldReason(actions(worktree({ ahead: 2, changes: 0 })).undoing, 'discard'), null);
        assert.equal(
            heldReason(actions(worktree({ ahead: 2, changes: 5 })).undoing, 'discard'),
            'detail.discardBlocked',
        );
    });

    it('keeps what takes something away out of the row that does things', () => {
        const { doing, undoing } = actions(worktree({ ahead: 2, behind: 1 }));

        assert.deepEqual(
            names(doing).filter((action) => action === 'discard' || action === 'remove'),
            [],
        );
        assert.deepEqual(names(undoing), ['discard', 'remove']);
    });
});

describe('whether a checkout has wandered', () => {
    it('is the branch it is on against the one it was made for', () => {
        assert.equal(wandered(worktree({ madeFor: 'a', branch: 'a' })), false);
        assert.equal(wandered(worktree({ madeFor: 'a', branch: 'b' })), true);
    });

    /** The project's own checkout was made for nothing, so it cannot have left it. */
    it('is false where it was made for nothing', () => {
        assert.equal(wandered(worktree({ madeFor: null, branch: 'anything' })), false);
    });
});
