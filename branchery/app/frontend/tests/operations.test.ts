/**
 * What an operation is called and what kind of thing it is, out of the command
 * that ran it.
 *
 * The fallback is the half worth holding to: the container can be a version
 * ahead of the page, so a command this table has never heard of is a thing that
 * happens rather than a mistake -- and what it must not do is leave a row with
 * no word on it at all.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { doingKey, historyKey, kindOf } from '../rules/operations.js';

describe('what an operation is', () => {
    it('is what the command that ran it says', () => {
        assert.equal(kindOf('worktree:remove'), 'remove');
        assert.equal(historyKey('database:sync'), 'history.sync');
        assert.equal(doingKey('worktree:pull'), 'job.doing.pull');
    });

    it('is a worktree being built where the command is unknown', () => {
        assert.equal(kindOf('worktree:whatever'), 'create');
        assert.equal(historyKey('worktree:whatever'), 'history.other');
        assert.equal(doingKey('worktree:whatever'), 'job.doing.create');
    });
});
