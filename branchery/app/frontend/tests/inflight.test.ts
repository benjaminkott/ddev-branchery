/**
 * One request per press, however many presses.
 *
 * The return key in the last field of a flow and the button beside it both go
 * forward, and forward on the last stop sends the request. Two of those inside
 * the moment the first takes were two requests, and the second was refused on
 * a worktree the reader had asked for once.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { latch } from '../inflight.js';

function deferred(): { promise: Promise<void>; settle(): void } {
    let settle = (): void => {};
    const promise = new Promise<void>((resolve) => {
        settle = resolve;
    });

    return { promise, settle };
}

describe('latch', () => {
    it('drops work asked for while some is still going', async () => {
        const once = latch();
        const request = deferred();
        let sent = 0;

        assert.equal(
            once.run(() => {
                sent += 1;
                return request.promise;
            }),
            true,
        );
        assert.equal(
            once.run(() => {
                sent += 1;
                return request.promise;
            }),
            false,
        );
        assert.equal(sent, 1);
        assert.equal(once.pending(), true);

        request.settle();
        await request.promise;
        await Promise.resolve();
        assert.equal(once.pending(), false);
        assert.equal(
            once.run(() => {
                sent += 1;
            }),
            true,
        );
        assert.equal(sent, 2);
    });

    it('opens again when the work failed, and says so to whoever waits', async () => {
        const once = latch();
        let settled = 0;
        const failing = Promise.reject(new Error('refused'));

        once.run(
            () => failing,
            () => {
                settled += 1;
            },
        );
        await failing.catch(() => {});
        await Promise.resolve();
        assert.equal(once.pending(), false);
        assert.equal(settled, 1);
    });

    it('treats work that hands back nothing as over at once', async () => {
        const once = latch();
        assert.equal(
            once.run(() => {}),
            true,
        );
        await Promise.resolve();
        assert.equal(once.pending(), false);
    });
});
