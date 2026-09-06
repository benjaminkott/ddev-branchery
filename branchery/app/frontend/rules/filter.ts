/**
 * Which worktrees a search leaves standing. Every word has to be found
 * somewhere and may be found anywhere: name, branch, database, address, PHP
 * version, the branch it was cut from, the subject it stands on. "check 8.3" is
 * how one asks for the checkout worktree that runs on 8.3.
 *
 * It stands on its own and takes what it needs, so it can be read -- and tested
 * -- without a page around it.
 */

import type { Branch, Worktree } from '../types.js';

export function matching(worktrees: readonly Worktree[], needle: string): Worktree[] {
    return worktrees.filter((worktree) =>
        found(
            [
                worktree.name,
                worktree.branch,
                worktree.database,
                worktree.url,
                worktree.php,
                worktree.base?.branch ?? '',
                worktree.tip?.subject ?? '',
            ].join(' '),
            needle,
        ),
    );
}

/**
 * The same, for the branches nothing is checked out of: it is the same field,
 * and a search that left the second list whole would say the branch is not
 * there while it stands below.
 */
export function matchingBranches(branches: readonly Branch[], needle: string): Branch[] {
    return branches.filter((branch) => found([branch.name, branch.tip?.subject ?? ''].join(' '), needle));
}

/** Whether every word of the search is somewhere in the text. */
export function found(text: string, needle: string): boolean {
    const words = needle
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word !== '');
    const haystack = text.toLowerCase();

    return words.every((word) => haystack.includes(word));
}
