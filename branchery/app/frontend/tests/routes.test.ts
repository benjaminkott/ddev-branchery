/**
 * What an address means, and what an answer arriving late is allowed to do. The
 * second was learned the hard way: a history that arrived after the reader had
 * gone back to the list was drawn over it.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { afterWizard, routeOf, stillOn, wizardAsked } from '../rules/routes.js';

describe('routeOf', () => {
    it('reads the kinds of address there are', () => {
        assert.deepEqual(routeOf('#/'), { view: 'overview' });
        assert.deepEqual(routeOf('#/w/v12'), { view: 'worktree', name: 'v12' });
        assert.deepEqual(routeOf('#/w/v12/c/b5607cae9ca'), {
            view: 'commit',
            name: 'v12',
            sha: 'b5607cae9ca',
            branch: '',
        });
        assert.deepEqual(routeOf('#/b/review%2F95618'), { view: 'branch', name: 'review/95618' });
        assert.deepEqual(routeOf('#/b/review%2F95618/c/4244cd767aa'), {
            view: 'commit',
            name: '',
            sha: '4244cd767aa',
            branch: 'review/95618',
        });
    });

    it('lands anything else on the list', () => {
        assert.deepEqual(routeOf('#new'), { view: 'overview' });
        assert.deepEqual(routeOf('#/nothing/of/the/sort'), { view: 'overview' });
    });

    /**
     * A commit is named by its hash. Everything else in that segment is a revision
     * git would happily resolve -- a branch, a tag, `HEAD@{1}`.
     */
    /**
     * A branch name reaches git through this, so what is not one lands on the list:
     * an address written by hand can say anything, escapes included.
     */
    it('takes nothing but a branch name for a branch', () => {
        assert.deepEqual(routeOf('#/b/-nope'), { view: 'overview' });
        assert.deepEqual(routeOf('#/b/%zz'), { view: 'overview' });
        assert.deepEqual(routeOf('#/b/'), { view: 'overview' });
        // Written out rather than encoded, which is what somebody typing an
        // address does: what is behind "/c/" is a hash, so the rest is a name.
        assert.deepEqual(routeOf('#/b/review/95618'), { view: 'branch', name: 'review/95618' });
    });

    /**
     * The project's own checkout is opened at the same addresses, and its name is
     * DDEV's rather than Branchery's: a project called "shop.example" had a row in
     * the list that led back to the list.
     */
    it("opens a checkout whose name is the project's own", () => {
        assert.deepEqual(routeOf('#/w/shop.example'), { view: 'worktree', name: 'shop.example' });
        assert.deepEqual(routeOf('#/w/shop.example/c/9b31d02'), {
            view: 'commit',
            name: 'shop.example',
            sha: '9b31d02',
            branch: '',
        });
    });

    /** A segment that becomes a path in the container is not one of those. */
    it('takes no way out of the worktrees for a checkout', () => {
        assert.deepEqual(routeOf('#/w/..'), { view: 'overview' });
        assert.deepEqual(routeOf('#/w/.'), { view: 'overview' });
        assert.deepEqual(routeOf('#/w/-x'), { view: 'overview' });
    });

    it('takes nothing but a hash for a commit', () => {
        assert.deepEqual(routeOf('#/w/v12/c/main'), { view: 'overview' });
        assert.deepEqual(routeOf('#/w/v12/c/B5607CA'), { view: 'overview' });
        assert.deepEqual(routeOf('#/w/v12/c/abc'), { view: 'overview' });
        assert.deepEqual(routeOf('#/w/v12/c/'), { view: 'overview' });
    });
});

describe('stillOn', () => {
    it('keeps an answer about the page on screen', () => {
        assert.equal(stillOn(routeOf('#/w/v12'), { view: 'worktree', name: 'v12' }), true);
    });

    /**
     * Two commits of the same worktree are two pages, and pressing a parent goes
     * from one to the other.
     */
    it('tells two commits of one worktree apart', () => {
        assert.equal(
            stillOn(routeOf('#/w/v12/c/9b31d02'), { view: 'commit', name: 'v12', sha: '9b31d02', branch: '' }),
            true,
        );
        assert.equal(
            stillOn(routeOf('#/w/v12/c/9b31d02'), { view: 'commit', name: 'v12', sha: '4f2a1c9', branch: '' }),
            false,
        );
        assert.equal(stillOn(routeOf('#/w/v12'), { view: 'commit', name: 'v12', sha: '9b31d02', branch: '' }), false);
        // The same commit read on a branch is another page: the way back out of it
        // is a different one.
        assert.equal(
            stillOn(routeOf('#/b/13.4/c/9b31d02'), { view: 'commit', name: '', sha: '9b31d02', branch: '13.4' }),
            true,
        );
        assert.equal(
            stillOn(routeOf('#/b/13.4/c/9b31d02'), { view: 'commit', name: '', sha: '9b31d02', branch: '' }),
            false,
        );
    });

    it('drops an answer about a page the reader has left', () => {
        assert.equal(stillOn(routeOf('#/'), { view: 'worktree', name: 'v12' }), false);
        assert.equal(stillOn(routeOf('#/w/v13'), { view: 'worktree', name: 'v12' }), false);
        assert.equal(stillOn(routeOf('#/'), { view: 'commit', name: 'v12', sha: '9b31d02', branch: '' }), false);
    });
});

describe('the wizard in the address', () => {
    it('is asked for by "#new"', () => {
        assert.equal(wizardAsked('#new'), true);
        assert.equal(wizardAsked('#/'), false);
        assert.equal(wizardAsked('#/w/new-thing'), false);
    });

    /** Left standing, "#new" reopens the wizard on a reload and on the way back. */
    it('is replaced by the list once the wizard has closed', () => {
        assert.equal(afterWizard('#new'), '#/');
        assert.equal(afterWizard('#/w/v12'), null);
        assert.equal(afterWizard(''), null);
    });
});
