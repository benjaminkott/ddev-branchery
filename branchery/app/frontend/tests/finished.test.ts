/**
 * Which worktrees are offered for removal.
 *
 * This decides what a press removes, so what it gets wrong is work somebody
 * loses. The two signals and the one veto are here on their own, without a
 * browser: they are a rule about a list, and that is all they are.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { finished } from '../finished.js';
import type { Worktree } from '../types.js';

function worktree(values: Partial<Worktree> & { name: string }): Worktree {
    return {
        branch: values.name,
        madeFor: values.name,
        forkedFrom: null,
        forkedAt: null,
        php: '8.3',
        minPhp: null,
        node: '22.11.0',
        database: `branchery_${values.name}`,
        profile: 'typo3-app',
        docroot: 'public',
        url: `https://${values.name}.example.ddev.site/`,
        backend: null,
        path: `/home/dev/project/.worktrees/${values.name}`,
        changes: 0,
        ahead: 0,
        behind: 0,
        ready: true,
        isProject: false,
        merged: false,
        gone: false,
        builtAt: null,
        stale: false,
        incomplete: false,
        review: null,
        issue: null,
        issueId: null,
        base: null,
        tip: null,
        ...values,
    };
}

const names = (list: Worktree[]): string[] => list.map((entry) => entry.name);

describe('finished', () => {
    it('offers a branch whose commits are all in the project’s own', () => {
        assert.deepEqual(names(finished([worktree({ name: 'a', merged: true })])), ['a']);
    });

    it('offers a branch whose remote counterpart is gone', () => {
        assert.deepEqual(names(finished([worktree({ name: 'b', gone: true })])), ['b']);
    });

    it('leaves alone a branch that is neither', () => {
        assert.deepEqual(names(finished([worktree({ name: 'c' })])), []);
    });

    /** A checkout with changes in it is one somebody is standing in. */
    it('never offers a worktree with uncommitted work, whatever git says', () => {
        assert.deepEqual(
            names(
                finished([
                    worktree({ name: 'd', merged: true, changes: 1 }),
                    worktree({ name: 'e', gone: true, changes: 4 }),
                ]),
            ),
            [],
        );
    });

    /** The project's own checkout is in the list, and it cannot be removed. */
    it('never offers the project itself', () => {
        assert.deepEqual(names(finished([worktree({ name: 'project', merged: true, isProject: true })])), []);
    });
});
