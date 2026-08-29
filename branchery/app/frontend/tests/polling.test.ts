/**
 * One question at a time, and no answer after the asking has stopped.
 *
 * An interval asked whether or not the last question had been answered, and a
 * slow "running" arriving after a fast "done" drew the end of an operation
 * back to its middle -- with nothing left to draw it forward again.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { poll, type Timers } from '../polling.js';

/** A clock that only moves when told to. */
function clock(): Timers & { run(): void; scheduled(): number } {
    const queue: (() => void)[] = [];

    return {
        schedule(work) {
            queue.push(work);

            return work;
        },
        cancel(handle) {
            const at = queue.indexOf(handle as () => void);
            if (at >= 0) {
                queue.splice(at, 1);
            }
        },
        run() {
            queue.splice(0).forEach((work) => work());
        },
        scheduled: () => queue.length,
    };
}

/** An answer that arrives when the test says so. */
function question<T>(): { ask(): Promise<T>; answer(value: T): Promise<void>; fail(): Promise<void>; asked: number } {
    const pending: { resolve(value: T): void; reject(error: Error): void }[] = [];
    const settle = async (): Promise<void> => {
        await Promise.resolve();
        await Promise.resolve();
    };

    return {
        asked: 0,
        ask() {
            this.asked += 1;

            return new Promise<T>((resolve, reject) => pending.push({ resolve, reject }));
        },
        async answer(value) {
            pending.shift()?.resolve(value);
            await settle();
        },
        async fail() {
            pending.shift()?.reject(new Error('gone'));
            await settle();
        },
    };
}

describe('poll', () => {
    it('asks again only once the last answer is in', async () => {
        const timers = clock();
        const asked = question<string>();
        const heard: string[] = [];

        poll(
            () => asked.ask(),
            (answer) => {
                heard.push(answer);
                return true;
            },
            1000,
            timers,
        );
        assert.equal(asked.asked, 1);
        assert.equal(timers.scheduled(), 0);

        await asked.answer('running');
        assert.equal(timers.scheduled(), 1);
        timers.run();
        assert.equal(asked.asked, 2);
        assert.deepEqual(heard, ['running']);
    });

    it('drops an answer that arrives after the watch has ended', async () => {
        const timers = clock();
        const asked = question<string>();
        const heard: string[] = [];

        poll(
            () => asked.ask(),
            (answer) => {
                heard.push(answer);
                return answer !== 'done';
            },
            1000,
            timers,
        );
        await asked.answer('done');
        assert.deepEqual(heard, ['done']);
        assert.equal(timers.scheduled(), 0);
    });

    it('drops an answer that arrives after it was stopped', async () => {
        const timers = clock();
        const asked = question<string>();
        const heard: string[] = [];

        const stop = poll(
            () => asked.ask(),
            (answer) => {
                heard.push(answer);
                return true;
            },
            1000,
            timers,
        );
        stop();
        await asked.answer('running');
        assert.deepEqual(heard, []);
        assert.equal(timers.scheduled(), 0);
    });

    it('asks again after a question that failed', async () => {
        const timers = clock();
        const asked = question<string>();

        poll(
            () => asked.ask(),
            () => true,
            1000,
            timers,
        );
        await asked.fail();
        assert.equal(timers.scheduled(), 1);
        timers.run();
        assert.equal(asked.asked, 2);
    });
});
