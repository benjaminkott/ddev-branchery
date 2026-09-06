/**
 * A fresh answer that says what the last one said is not a change.
 *
 * The project is read again every few seconds, and every read used to be a
 * redraw: an open dropdown closed under the pointer and a button lost its
 * focus, whether or not anything had happened.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { differs } from '../store.js';

describe('differs', () => {
    it('sees two answers that say the same thing as the same', () => {
        assert.equal(differs([{ name: 'v12', php: '8.2' }], [{ name: 'v12', php: '8.2' }]), false);
        assert.equal(differs(null, null), false);
        assert.equal(differs([], []), false);
    });

    it('sees what actually changed', () => {
        assert.equal(differs([{ name: 'v12', php: '8.2' }], [{ name: 'v12', php: '8.3' }]), true);
        assert.equal(differs([], [{ name: 'v12' }]), true);
        assert.equal(differs(null, { name: 'v12' }), true);
    });
});
