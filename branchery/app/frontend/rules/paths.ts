/**
 * The order a list of changed files is read in.
 *
 * Git answers in the order it walked, which is its own affair and reads as
 * none: `public/.htaccess` standing between two files of `packages/site/`.
 * Sorted, everything under one directory is together, and the first few of a
 * long list are the front of it rather than whatever came out first.
 */

import type { Change } from '../types.js';

/**
 * Numbers in a name count as numbers, `page.2` before `page.10`, and the
 * comparison is pinned to one language: a list of paths ordered differently
 * for a reader in German than for the same list in English would be a
 * difference nobody asked for and every test would have to allow.
 */
const order = new Intl.Collator('en', { numeric: true });

/**
 * The order a file manager puts them in: at every level the directories first
 * and the files after them, each of the two by name. Compared whole, a path is
 * ordered by whatever character stands where the separator does -- so
 * `config/system/settings.php` lands between `config.yaml` and `configure.sh`,
 * which is the one arrangement nobody looking for a file would predict.
 *
 * The last segment of a path is its file; every segment before it is a
 * directory. Two paths are walked together for as long as they agree, and the
 * first place they part decides: a path still inside a directory there comes
 * before one that has reached its file.
 */
function compare(one: string, other: string): number {
    const left = one.split('/');
    const right = other.split('/');

    for (let level = 0; level < Math.min(left.length, right.length); level++) {
        const leftIsFile = level === left.length - 1;
        const rightIsFile = level === right.length - 1;
        if (leftIsFile !== rightIsFile) {
            return leftIsFile ? 1 : -1;
        }

        const apart = order.compare(left[level] ?? '', right[level] ?? '');
        if (apart !== 0) {
            return apart;
        }
    }

    return 0;
}

/** A list of its own: the answer it came from is read again elsewhere. */
export function byPath(files: Change[]): Change[] {
    return [...files].sort((one, other) => compare(one.path, other.path));
}
