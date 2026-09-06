/**
 * The rules about addresses, apart from the address bar they are read from. The
 * router is the one place that reads `location.hash` and listens to the window
 * the moment it is loaded, which is what keeps it out of a test; everything it
 * decides is a rule about a string, and those are checked without a browser.
 */

import { isBranchName } from '../dom.js';

export type Route =
    | { view: 'overview' }
    | { view: 'worktree'; name: string }
    | { view: 'branch'; name: string }
    /**
     * One commit, read either in a worktree or on a branch that has none. The
     * commit is the same object either way, so what differs is only where the
     * page came from and leads back to.
     */
    | { view: 'commit'; name: string; sha: string; branch: string };

/**
 * What may name a checkout in an address, as the container's router spells it.
 * Wider than a worktree name, which is lowercase, digits and hyphens: the same
 * pages are opened for the project's own checkout, and that name is DDEV's --
 * where a dot and a capital are allowed. A project called "shop.example" had a
 * row in the list that led back to the list.
 *
 * A leading letter or digit is what keeps "." and ".." out of a segment that
 * becomes a path in the container.
 */
const CHECKOUT = '[A-Za-z0-9][A-Za-z0-9.-]*';
const CHECKOUT_PAGE = new RegExp(`^/w/(${CHECKOUT})$`);
const ON_CHECKOUT = new RegExp(`^/w/(${CHECKOUT})/c/([0-9a-f]{4,40})$`);

/**
 * What an address means.
 *
 *   #/                        the worktrees
 *   #/w/<name>                one of them
 *   #/w/<name>/c/<sha>        one commit on its branch
 *   #/b/<branch>              a branch nothing is checked out of
 *   #/b/<branch>/c/<sha>      one commit on such a branch
 *
 * A commit is named by its hash and by nothing else. A branch name is the one
 * thing here that carries slashes, so it travels encoded and is then held to
 * what git takes as a branch name -- written out by hand it works too, since
 * what is behind "/c/" is a hash and the rest is the name.
 *
 * Anything else is the list.
 */
export function routeOf(hash: string): Route {
    const path = hash.replace(/^#/, '');
    const commit = ON_CHECKOUT.exec(path);
    if (commit?.[1] !== undefined && commit[2] !== undefined) {
        return { view: 'commit', name: commit[1], sha: commit[2], branch: '' };
    }
    const worktree = CHECKOUT_PAGE.exec(path);
    if (worktree?.[1] !== undefined) {
        return { view: 'worktree', name: worktree[1] };
    }
    const onBranch = /^\/b\/(.+)\/c\/([0-9a-f]{4,40})$/.exec(path);
    const branchName = branchOf(onBranch?.[1]);
    if (branchName !== null && onBranch?.[2] !== undefined) {
        return { view: 'commit', name: '', sha: onBranch[2], branch: branchName };
    }
    const branch = branchOf(/^\/b\/(.+)$/.exec(path)?.[1]);
    if (branch !== null) {
        return { view: 'branch', name: branch };
    }
    return { view: 'overview' };
}

/**
 * The same rule the container holds a branch name to. Decoding is where an
 * address written by hand goes wrong -- "%zz" is not an escape and throws -- and
 * a bad address is a bad address, not a page that fails to come up.
 */
function branchOf(segment: string | undefined): string | null {
    if (segment === undefined || segment === '') {
        return null;
    }
    let name: string;
    try {
        name = decodeURIComponent(segment);
    } catch {
        return null;
    }

    return isBranchName(name) ? name : null;
}

/**
 * A history and a list of commits are both fetched after the page that asked for
 * them was drawn, and the reader may have left by the time they arrive.
 */
export function stillOn(current: Route, asked: Route): boolean {
    if (current.view !== asked.view) {
        return false;
    }
    if (current.view === 'worktree' && asked.view === 'worktree') {
        return current.name === asked.name;
    }
    if (current.view === 'branch' && asked.view === 'branch') {
        return current.name === asked.name;
    }
    // A commit is the one page where the address carries two things, and both
    // decide: pressing a parent leads to another commit of the same worktree.
    if (current.view === 'commit' && asked.view === 'commit') {
        return current.name === asked.name && current.sha === asked.sha && current.branch === asked.branch;
    }
    return true;
}

/** Whether the address asks for the wizard: "#new" opens it straight away. */
export function wizardAsked(hash: string): boolean {
    return hash.replace(/^#/, '').startsWith('new');
}

/**
 * Null where the address says nothing about the wizard and is left alone.
 *
 * "#new" is a way in, not a place: left standing, a reload opens the wizard
 * again and the back button leads to a page that reopens it. So it is replaced
 * by the list, without a step in the history.
 */
export function afterWizard(hash: string): string | null {
    return wizardAsked(hash) ? '#/' : null;
}
