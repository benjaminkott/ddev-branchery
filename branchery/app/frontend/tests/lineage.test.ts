/**
 * The order the rows stand in once they are grouped under their base.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { byBase } from '../rules/lineage.js';
import type { Worktree } from '../types.js';

function row(name: string, base: Worktree['base']): Worktree {
    return { name, base } as Worktree;
}

describe('byBase', () => {
    it('gathers the rows under their base, the trunk first', () => {
        const rows = byBase(
            [
                row('docs-v14', { branch: 'v14.0', own: 3, moved: 0 }),
                row('jochen', { branch: 'master', own: 0, moved: 0 }),
                row('v14-0', { branch: 'master', own: 2, moved: 0 }),
                row('blog', null),
                row('fix-v12', { branch: 'v12.0', own: 1, moved: 0 }),
                row('comments-v14', { branch: 'v14.0', own: 1, moved: 0 }),
            ],
            'master',
        );

        assert.deepEqual(
            rows.map((entry) => entry.name),
            ['blog', 'jochen', 'v14-0', 'fix-v12', 'docs-v14', 'comments-v14'],
        );
    });

    it('puts what is cut from nothing before what is cut from the trunk', () => {
        const rows = byBase([row('a', { branch: 'main', own: 1, moved: 0 }), row('trunk-checkout', null)], 'main');

        assert.deepEqual(
            rows.map((entry) => entry.name),
            ['trunk-checkout', 'a'],
        );
    });
});
