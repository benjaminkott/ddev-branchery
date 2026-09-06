/**
 * What can be done to a worktree, each press with the question it asks first.
 * Every one ends in an operation the container runs, and what tells them apart
 * is what is asked before it starts: two ask nothing, and the two that end with
 * work gone ask with the work itself in front of the reader.
 *
 * They belong to no page -- the page about one worktree carries them, which is
 * what a page does with them, not what they are.
 */

import { api } from '../api.js';
import { go } from '../router.js';
import { refresh, reportError, setError, state, t } from '../state.js';
import type { Commits, JobHandlers, JobKind, Worktree } from '../types.js';
import { askConfirm } from './confirm.js';

/**
 * Asked naming both ends: what is in the database of this worktree goes, and
 * where it comes from is a choice the reader made a moment ago.
 */
export async function sync(worktree: Worktree, handlers: JobHandlers): Promise<void> {
    const confirmed = await askConfirm({
        title: t('confirm.sync.title'),
        message: t('confirm.sync.body'),
        facts: [
            { label: t('table.worktree'), value: worktree.name },
            { label: t('table.database'), value: worktree.database },
            {
                label: t('confirm.source'),
                value: t('field.branchFromProject', { branch: state.project?.branch ?? state.branch }),
            },
        ],
        confirmLabel: t('action.sync'),
    });
    if (!confirmed) {
        return;
    }
    await start(() => api.syncWorktree(worktree.name), worktree.name, 'sync', handlers);
}

/**
 * In the order it would be missed in: a branch on no remote takes everything on
 * it, commits that were never pushed take themselves, and what was never
 * committed was only ever in that directory.
 */
function losses(worktree: Worktree): string[] {
    return [
        ...(worktree.ahead === null ? [t('confirm.worktree.nowhere')] : []),
        ...(worktree.ahead !== null && worktree.ahead > 0
            ? [t('confirm.worktree.unpushed', { count: worktree.ahead })]
            : []),
        ...(worktree.changes > 0 ? [t('confirm.worktree.changes', { count: worktree.changes })] : []),
    ];
}

/**
 * Asked with the commits themselves in front of the reader: this is the one
 * press on the page that ends with work being gone, and "1 unpushed" is not
 * enough to decide by.
 */
export async function discard(worktree: Worktree, handlers: JobHandlers, known: Commits | null): Promise<void> {
    // The question names the commits, so it waits for them: asked before they
    // arrived it listed nothing over a press that drops everything. Where the
    // page has them already they are handed in.
    let read = known;
    if (read === null) {
        try {
            read = await api.commits(worktree.name);
        } catch (error) {
            reportError(error);

            return;
        }
    }
    const commits = read.commits.filter((commit) => !commit.pushed);
    const upstream = read.upstream ?? worktree.branch;
    const confirmed = await askConfirm({
        title: t('confirm.discard.title'),
        message: t('confirm.discard.body', { upstream }),
        ...((worktree.behind ?? 0) > 0
            ? { warning: t('confirm.discard.behind', { count: worktree.behind ?? 0 }) }
            : {}),
        facts: commits.map((commit) => ({ label: commit.sha, value: commit.subject })),
        confirmLabel: t('action.discard'),
        tone: 'danger',
    });
    if (!confirmed) {
        return;
    }
    await start(() => api.discardWorktree(worktree.name), worktree.name, 'discard', handlers);
}

/**
 * Nothing is asked first: what is left behind is a branch, and a branch that is
 * not checked out anywhere is still every commit that was on it.
 */
export async function restore(worktree: Worktree, handlers: JobHandlers): Promise<void> {
    await start(() => api.restoreWorktree(worktree.name), worktree.name, 'restore', handlers);
}

/**
 * Nothing is asked first, unlike fetching the data: this adds commits and takes
 * nothing away -- and where it cannot, it is refused before anything moves.
 */
export async function pull(worktree: Worktree, handlers: JobHandlers): Promise<void> {
    await start(() => api.pullWorktree(worktree.name), worktree.name, 'pull', handlers);
}

export async function provision(name: string, fresh: boolean, handlers: JobHandlers): Promise<void> {
    await start(() => api.provisionWorktree(name, fresh), name, 'create', handlers);
}

/** Removing one takes its page with it, so the way back is the list. */
export async function remove(worktree: Worktree, handlers: JobHandlers): Promise<void> {
    const lost = losses(worktree);
    const confirmed = await askConfirm({
        title: t('confirm.worktree.title'),
        message: t('confirm.worktree.body'),
        // Everything that exists here and nowhere else: the branch goes with the
        // worktree, so what is on it and never pushed goes too.
        ...(lost.length > 0 ? { warning: lost.join(' ') } : {}),
        facts: [
            { label: t('table.worktree'), value: worktree.name },
            { label: t('table.branch'), value: worktree.branch },
            { label: t('table.database'), value: worktree.database },
        ],
        confirmLabel: t('action.remove'),
        tone: 'danger',
    });
    if (!confirmed) {
        return;
    }
    if (await start(() => api.removeWorktree(worktree.name), null, 'remove', handlers)) {
        go('/');
    }
}

async function start(
    call: () => Promise<{ job: string }>,
    expected: string | null,
    kind: JobKind,
    handlers: JobHandlers,
): Promise<boolean> {
    try {
        const result = await call();
        setError('');
        handlers.onJob(result.job, expected, kind);

        return true;
    } catch (error) {
        reportError(error);
        await refresh();

        return false;
    }
}
