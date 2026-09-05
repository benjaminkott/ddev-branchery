import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { gather, unread } from '../journal.js';
import type { Job, JobStepAnswer } from '../types.js';

function answer(over: Partial<Job>): Job {
    return {
        id: 'j',
        status: 'running',
        subject: 'my-fix',
        command: 'worktree:add',
        step: null,
        steps: [],
        elapsed: 0,
        log: '',
        size: 0,
        partial: false,
        interrupted: false,
        ...over,
    };
}

function step(no: number, output: string | null): JobStepAnswer {
    return { no, label: `step ${no}`, output, state: 'done', seconds: 1 };
}

describe('gathering an operation', () => {
    it('keeps what a full answer says and forgets what stood before', () => {
        const had = gather(unread, answer({ log: 'one\n', size: 4, steps: [step(1, 'one')] }));

        const now = gather(had, answer({ log: 'other\n', size: 6, steps: [step(1, 'other')] }));

        assert.equal(now.log, 'other\n');
        assert.equal(now.size, 6);
        assert.equal(now.steps[0]?.output, 'other');
    });

    it('adds what a partial answer carries to what was gathered', () => {
        const had = gather(unread, answer({ log: 'one\n', size: 4, steps: [step(1, 'one')] }));

        const now = gather(
            had,
            answer({ log: 'two\n', size: 8, partial: true, steps: [step(1, 'one'), step(2, 'two')] }),
        );

        assert.equal(now.log, 'one\ntwo\n');
        assert.equal(now.size, 8);
    });

    /** The whole point: a step that did not move is not sent again. */
    it('leaves a step that was left out with the output it had', () => {
        const had = gather(unread, answer({ log: 'one\n', size: 4, steps: [step(1, 'one')] }));

        const now = gather(
            had,
            answer({ log: 'two\n', size: 8, partial: true, steps: [step(1, null), step(2, 'two')] }),
        );

        assert.equal(now.steps[0]?.output, 'one');
        assert.equal(now.steps[1]?.output, 'two');
    });

    /** A step nothing was ever kept for shows what one that wrote no line shows. */
    it('says nothing for a step it never had', () => {
        const now = gather(unread, answer({ steps: [step(1, null)] }));

        assert.equal(now.steps[0]?.output, '');
    });
});
