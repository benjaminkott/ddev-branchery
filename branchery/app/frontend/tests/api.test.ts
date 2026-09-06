/**
 * An answer from in front of the container is no answer from the container.
 *
 * DDEV's router speaks for a container that is being restarted, and what it
 * says is a real HTTP answer: "404 page not found", in plain text. Taken for
 * the container's own it was put on the page as "Request failed with status
 * 404", and the note about the container being away never showed.
 */

import { strict as assert } from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import { api, ApiError, UnreachableError, unanswered } from '../api.js';

const original = globalThis.fetch;

/** Whatever stands at the far end answers this, and only this. */
function answering(body: string, status: number, type: string | null): void {
    globalThis.fetch = () =>
        Promise.resolve(
            new Response(body, {
                status,
                headers: type === null ? {} : { 'Content-Type': type },
            }),
        );
}

afterEach(() => {
    globalThis.fetch = original;
});

describe('unanswered', () => {
    it('takes the router speaking for an absent container as no answer', () => {
        assert.equal(unanswered(404, 'text/plain; charset=utf-8'), true);
        assert.equal(unanswered(502, 'text/plain'), true);
        assert.equal(unanswered(503, null), true);
    });

    it('takes what the container said in JSON as its own, whatever the status', () => {
        assert.equal(unanswered(404, 'application/json'), false);
        assert.equal(unanswered(404, 'application/json; charset=utf-8'), false);
        assert.equal(unanswered(503, 'Application/JSON'), false);
    });

    /** The application having broken is not the container being away. */
    it('leaves a 500 without JSON to be said as it came', () => {
        assert.equal(unanswered(500, 'text/html'), false);
    });
});

describe('request', () => {
    it('reports the router alone as the container being unreachable', async () => {
        answering('404 page not found\n', 404, 'text/plain; charset=utf-8');
        await assert.rejects(api.state(), (error: unknown) => {
            assert.ok(error instanceof UnreachableError);
            assert.equal(error.status, 404);

            return true;
        });
    });

    it('carries what the container refused with, as it said it', async () => {
        answering('{"error":"Unknown endpoint."}', 404, 'application/json');
        await assert.rejects(api.state(), (error: unknown) => {
            assert.ok(error instanceof ApiError);
            assert.equal(error.message, 'Unknown endpoint.');
            assert.equal(error.status, 404);

            return true;
        });
    });

    it('hands an answer over as it is', async () => {
        answering('{"worktrees":[]}', 200, 'application/json');
        assert.deepEqual(await api.state(), { worktrees: [] });
    });
});
