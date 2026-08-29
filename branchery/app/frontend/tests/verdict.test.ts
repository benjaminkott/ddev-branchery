/**
 * The title over an operation and the line under it must agree.
 *
 * An operation the container had no record of was titled as aborted and then
 * offered, under that title, to open the worktree it had built.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { hasResult, titleOf, whyItStopped } from '../verdict.js';

describe('the verdict of an operation', () => {
    it('is titled by how it stands', () => {
        assert.equal(titleOf('running'), 'job.running');
        assert.equal(titleOf('done'), 'job.done');
        assert.equal(titleOf('failed'), 'job.failed');
        assert.equal(titleOf('unknown'), 'job.unknown');
    });

    it('has a result to show only where it ended', () => {
        assert.equal(hasResult('done'), true);
        assert.equal(hasResult('failed'), false);
        assert.equal(hasResult('unknown'), false);
        assert.equal(hasResult('running'), false);
    });
});

describe('why an operation stopped', () => {
    it('is the line the console marked, without its mark', () => {
        assert.equal(
            whyItStopped('Installing dependencies\n\u2717 composer refused: the lock file is stale\n'),
            'composer refused: the lock file is stale',
        );
    });

    it('is the last of them, for a run that failed more than once', () => {
        assert.equal(whyItStopped('\u2717 first\nand then\n\u2717 second'), 'second');
    });

    it('is nothing at all where the console marked no line', () => {
        assert.equal(whyItStopped('Everything went fine.\n'), '');
        assert.equal(whyItStopped(''), '');
    });
});
