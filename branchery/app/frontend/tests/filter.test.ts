/**
 * The field over the list, as a rule: every word has to be found, and it may be
 * found in any of the things a row shows.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { matching, matchingBranches } from '../rules/filter.js';
import type { Branch, Worktree } from '../types.js';

/**
 * With the three things derived from the name the way the server derives them,
 * so a search for a database name is searching what would really be there.
 */
function worktree(values: Partial<Worktree> & { name: string }): Worktree {
    const name = values.name;

    return {
        branch: name,
        madeFor: name,
        forkedFrom: null,
        forkedAt: null,
        php: '8.3',
        minPhp: null,
        node: '22.11.0',
        database: `branchery_${name.replace(/-/g, '_')}`,
        profile: 'typo3-core',
        docroot: '',
        changes: 0,
        ahead: 0,
        behind: 0,
        ready: true,
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
        isProject: false,
        url: `https://${name}.blog.ddev.site/`,
        path: `/home/dev/projects/blog/.worktrees/${name}`,
        backend: `https://${name}.blog.ddev.site/typo3`,
        ...values,
    };
}

const ALL = [
    worktree({ name: 'feature-checkout', branch: 'feature/checkout', php: '8.3' }),
    worktree({ name: 'bugfix-cache-headers', branch: 'bugfix/cache-headers', php: '8.2' }),
    worktree({ name: 'v13', branch: '13.4', php: '8.3' }),
];

const names = (needle: string): string[] => matching(ALL, needle).map((worktree) => worktree.name);

describe('matching', () => {
    it('leaves the list alone where nothing is asked', () => {
        assert.deepEqual(names(''), ['feature-checkout', 'bugfix-cache-headers', 'v13']);
        assert.deepEqual(names('   '), ['feature-checkout', 'bugfix-cache-headers', 'v13']);
    });

    it('finds a word anywhere a row shows one', () => {
        assert.deepEqual(names('checkout'), ['feature-checkout']);
        assert.deepEqual(names('13.4'), ['v13']);
        assert.deepEqual(names('branchery_bugfix'), ['bugfix-cache-headers']);
    });

    /** "check 8.3" is how one asks for the checkout worktree that runs on 8.3. */
    it('takes every word as a condition, not as a phrase', () => {
        assert.deepEqual(names('feature 8.3'), ['feature-checkout']);
        assert.deepEqual(names('feature 8.2'), []);
    });

    it('does not care how it is typed', () => {
        assert.deepEqual(names('CHECKOUT'), ['feature-checkout']);
    });

    it('hands back a list of its own, not the one it was given', () => {
        const shown = matching(ALL, '');
        shown.pop();

        assert.equal(ALL.length, 3);
    });
});

const FREE: Branch[] = [
    {
        name: 'feature/redirect-import',
        when: 1750000000,
        tip: { sha: '7d1e88a', subject: '[FEATURE] Import redirects' },
        onRemote: true,
    },
    {
        name: 'review/98211',
        when: 1740000000,
        tip: { sha: '0b7fa63', subject: '[BUGFIX] Show it only once' },
        onRemote: false,
    },
    { name: '12.4', when: 1730000000, tip: null, onRemote: true },
];

const free = (needle: string): string[] => matchingBranches(FREE, needle).map((branch) => branch.name);

describe('matchingBranches', () => {
    it('leaves the list alone where nothing is asked', () => {
        assert.deepEqual(free(''), ['feature/redirect-import', 'review/98211', '12.4']);
    });

    /**
     * The subject counts as much as the name: "review/98211" says nothing about
     * what is on it, and what a reader remembers is the sentence.
     */
    it('finds a branch by what the commit on top of it says', () => {
        assert.deepEqual(free('redirects'), ['feature/redirect-import']);
        assert.deepEqual(free('once'), ['review/98211']);
    });

    it('reads a branch with nothing on top of it as one with nothing to find', () => {
        assert.deepEqual(free('12'), ['12.4']);
        assert.deepEqual(free('12.4 bugfix'), []);
    });
});
