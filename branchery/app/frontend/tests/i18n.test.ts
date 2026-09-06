/**
 * What a count reads like when it is one.
 *
 * "1 branches without one" is written once and then read every day by
 * everybody, so the singular is its own entry and this is what proves it is
 * taken.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { translate } from '../i18n.js';

const strings = {
    'overview.worktrees': '{count} worktrees',
    'overview.worktrees.one': '1 worktree',
    'table.behind': '{count} behind',
};

describe('translate', () => {
    it('takes the singular where there is one and there is one of the thing', () => {
        assert.equal(translate(strings, 'overview.worktrees', { count: 1 }), '1 worktree');
        assert.equal(translate(strings, 'overview.worktrees', { count: 2 }), '2 worktrees');
    });

    /** Zero is a plural in both languages this speaks. */
    it('says none of something in the plural', () => {
        assert.equal(translate(strings, 'overview.worktrees', { count: 0 }), '0 worktrees');
    });

    it('leaves a line that never counts to one alone', () => {
        assert.equal(translate(strings, 'table.behind', { count: 1 }), '1 behind');
    });

    it('says the key back where there is no line for it', () => {
        assert.equal(translate(strings, 'nothing.here'), 'nothing.here');
    });
});
