/**
 * The order a list of changed files is read in -- a rule about a list, and
 * nothing a browser is needed for.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { byPath } from '../rules/paths.js';
import type { Change } from '../types.js';

function sorted(...paths: string[]): string[] {
    const files: Change[] = paths.map((path) => ({ status: 'modified', path }));

    return byPath(files).map((change) => change.path);
}

describe('byPath', () => {
    it('puts the directories of a level before its files', () => {
        assert.deepEqual(sorted('composer.json', 'config/sites/main/config.yaml', 'notes.md'), [
            'config/sites/main/config.yaml',
            'composer.json',
            'notes.md',
        ]);
    });

    it('does the same at every level down', () => {
        assert.deepEqual(
            sorted(
                'packages/site/ext_localconf.php',
                'packages/site/Tests/Functional/RedirectCacheTest.php',
                'packages/site/composer.json',
                'packages/site/Classes/Middleware/RedirectCache.php',
            ),
            [
                'packages/site/Classes/Middleware/RedirectCache.php',
                'packages/site/Tests/Functional/RedirectCacheTest.php',
                'packages/site/composer.json',
                'packages/site/ext_localconf.php',
            ],
        );
    });

    it('orders a directory by its name and not by what follows it', () => {
        assert.deepEqual(sorted('config.yaml', 'configure.sh', 'config/system/settings.php'), [
            'config/system/settings.php',
            'config.yaml',
            'configure.sh',
        ]);
    });

    it('reads a number in a name as a number', () => {
        assert.deepEqual(sorted('config/page.10.yaml', 'config/page.2.yaml'), [
            'config/page.2.yaml',
            'config/page.10.yaml',
        ]);
    });

    it('leaves the list it was given alone', () => {
        const files: Change[] = [
            { status: 'modified', path: 'b.php' },
            { status: 'modified', path: 'a.php' },
        ];
        byPath(files);

        assert.deepEqual(
            files.map((change) => change.path),
            ['b.php', 'a.php'],
        );
    });
});
