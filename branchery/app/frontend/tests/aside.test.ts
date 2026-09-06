/**
 * What a view keeps of an answer it asked for, and the one question that keeps
 * it honest: is this still the page that asked?
 *
 * Four views kept these three fields each, in four spellings, and the rule
 * about a late answer was written out four times. Written once, it can be
 * checked once -- and without a browser, which is what the views themselves
 * cannot be.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { aside, readInto } from '../rules/aside.js';
import { reader } from '../rules/reading.js';

describe('what was read beside a view', () => {
    it('says the page is new, and then that it is not', () => {
        const held = aside<string>();

        assert.equal(held.about('one'), true, 'the first look has nothing and must read');
        assert.equal(held.about('one'), true, 'nothing has arrived yet, so it still must read');

        held.put('one', 'a history');

        assert.equal(held.about('one'), false, 'it is here; reading again would be a second call');
        assert.equal(held.of('one'), 'a history');
    });

    it('holds nothing for a page it is not about', () => {
        const held = aside<string>();
        held.about('one');
        held.put('one', 'a history');

        assert.equal(held.of('two'), null);
        assert.equal(held.about('two'), true);
        // And going there dropped what the first page had: one page at a time.
        assert.equal(held.of('one'), null);
    });

    /**
     * The whole reason this is not four plain fields. An answer that arrives
     * after the reader has gone on belongs to nothing, and drawing it would put
     * the page they left back over the one they went to.
     */
    it('drops an answer for a page the reader has left', () => {
        const held = aside<string>();
        held.about('one');
        held.about('two');

        held.put('one', 'the answer that came too late');

        assert.equal(held.of('one'), null);
        assert.equal(held.of('two'), null);
        assert.equal(held.about('two'), true, 'the page it is on still has nothing');
    });

    it('says whether it is still the page that asked', () => {
        const held = aside<string>();
        held.about('one');

        assert.equal(held.stillOn('one'), true);
        assert.equal(held.stillOn('two'), false);

        held.about('two');

        assert.equal(held.stillOn('one'), false);
        assert.equal(held.stillOn('two'), true);
    });

    it('keeps why nothing came, and only for the page that asked', () => {
        const held = aside<string>();
        held.about('one');

        held.failed('one', 'the container said no');

        assert.equal(held.of('one'), null);
        assert.equal(held.trouble('one'), 'the container said no');
        assert.equal(held.trouble('two'), '');
        // Said once: asking again is a press, not a draw.
        assert.equal(held.about('one'), false);
    });

    it('takes an answer after a failure, and lets the failure go', () => {
        const held = aside<string>();
        held.about('one');
        held.failed('one', 'the container said no');

        held.put('one', 'and then it did');

        assert.equal(held.of('one'), 'and then it did');
        assert.equal(held.trouble('one'), '');
    });

    /** An operation on this worktree ended: its history has one entry more. */
    it('forgets the page it is asked to forget, and only that one', () => {
        const held = aside<string>();
        held.about('one');
        held.put('one', 'a history');

        held.forget('two');
        assert.equal(held.of('one'), 'a history');

        held.forget('one');
        assert.equal(held.of('one'), null);
        assert.equal(held.about('one'), true, 'forgetting is what makes the next look read');
    });

    it('lets go of everything at once', () => {
        const held = aside<string>();
        held.about('one');
        held.put('one', 'a history');

        held.clear();

        assert.equal(held.of('one'), null);
        assert.equal(held.about('one'), true);
    });

    /**
     * The two rules of a read, together: what came back is held, and what came
     * back as nothing is what went wrong. Four reads in three views spelled the
     * second one out for themselves.
     */
    describe('read into one', () => {
        const reading = reader(
            (error) => (error instanceof Error ? error.message : 'unknown'),
            () => {},
        );

        it('holds what came back', async () => {
            const held = aside<string>();
            held.about('one');

            await readInto(held, 'one', () => Promise.resolve('a history'), reading);

            assert.equal(held.of('one'), 'a history');
            assert.equal(held.trouble('one'), '');
        });

        it('holds why nothing did instead', async () => {
            const held = aside<string>();
            held.about('one');

            await readInto(held, 'one', () => Promise.reject(new Error('the container is away')), reading);

            assert.equal(held.of('one'), null);
            assert.equal(held.trouble('one'), 'the container is away');
        });

        /** The whole reason the holder is asked rather than told. */
        it('drops an answer about a page the reader has left', async () => {
            const held = aside<string>();
            held.about('one');

            const arriving = readInto(held, 'one', () => Promise.resolve('a history'), reading);
            held.about('two');
            await arriving;

            assert.equal(held.of('one'), null);
            assert.equal(held.of('two'), null);
            assert.equal(held.trouble('two'), '');
        });
    });
});
