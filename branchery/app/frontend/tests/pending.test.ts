/**
 * Which running operations stand in the list as a worktree on its way.
 *
 * The list is built from the directories there are, and a worktree has none
 * until its checkout is made; the row for the meantime comes from the running
 * operations, and this is the rule that picks them out.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { pendingCreations } from '../rules/pending.js';
import type { RunningJob } from '../types.js';

const job = (command: string, subject: string): RunningJob => ({ id: command + subject, command, subject, step: null });

describe('pendingCreations', () => {
    it('names a worktree being made that the list does not have yet', () => {
        const pending = pendingCreations([job('worktree:fork', 'my-fix'), job('worktree:add', '13-4')], ['main']);

        assert.deepEqual(
            pending.map((entry) => entry.subject),
            ['my-fix', '13-4'],
        );
    });

    it('leaves out one whose checkout is already in the list', () => {
        assert.deepEqual(pendingCreations([job('worktree:fork', 'my-fix')], ['my-fix']), []);
    });

    it('leaves out operations that do not make a worktree', () => {
        const running = [
            job('worktree:provision', 'my-fix'),
            job('database:sync', 'other'),
            job('git:fetch', ''),
            job('worktree:remove', 'gone'),
        ];

        assert.deepEqual(pendingCreations(running, []), []);
    });
});
