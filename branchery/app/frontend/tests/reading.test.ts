/**
 * What happens to an answer that arrives after the reader has moved on.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { reader } from '../reading.js';

/** The sentence a failure reads as, standing in for the interface's own. */
const sentence = (error: unknown): string => (error instanceof Error ? error.message : 'unknown');

describe('reader', () => {
    it('keeps the answer and draws the page again', async () => {
        let drawn = 0;
        let kept: [string | null, string] | null = null;
        const reading = reader(sentence, () => {
            drawn += 1;
        });

        await reading(
            () => Promise.resolve('here'),
            () => true,
            (read, trouble) => {
                kept = [read, trouble];
            },
        );

        assert.deepEqual(kept, ['here', '']);
        assert.equal(drawn, 1);
    });

    it('keeps the sentence where the answer never came', async () => {
        let kept: [string | null, string] | null = null;
        const reading = reader(sentence, () => {});

        await reading(
            () => Promise.reject(new Error('the container is away')),
            () => true,
            (read, trouble) => {
                kept = [read, trouble];
            },
        );

        assert.deepEqual(kept, [null, 'the container is away']);
    });

    it('drops what arrives about a page the reader has left', async () => {
        let drawn = 0;
        let kept = false;
        const reading = reader(sentence, () => {
            drawn += 1;
        });

        await reading(
            () => Promise.resolve('here'),
            () => false,
            () => {
                kept = true;
            },
        );

        assert.equal(kept, false);
        assert.equal(drawn, 0);
    });

    it('asks where the reader is only once the answer is here', async () => {
        const asked: string[] = [];
        const reading = reader(sentence, () => {});

        await reading(
            () => {
                asked.push('ask');

                return Promise.resolve('here');
            },
            () => {
                asked.push('still');

                return true;
            },
            () => {
                asked.push('keep');
            },
        );

        assert.deepEqual(asked, ['ask', 'still', 'keep']);
    });
});
