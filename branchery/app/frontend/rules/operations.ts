/**
 * What kind of operation a console command is, what it is called in a
 * worktree's history, and what a row says while it runs.
 *
 * One table, because those three places used to keep one each -- and an
 * operation called two things is two operations to whoever reads both.
 * Anything not named here builds a worktree, which is what a command this
 * interface has never heard of most likely is.
 *
 * The keys and not the words: what a reader is told is in their language, and
 * saying it is state.ts's -- see operationName() and doingWord(). Kept apart
 * from it so that this can be read, and asked, without a page around it.
 */

import type { JobKind } from '../types.js';

const COMMANDS: Record<string, { kind: JobKind; history: string; doing: string }> = {
    'worktree:add': { kind: 'create', history: 'history.add', doing: 'job.doing.create' },
    'worktree:fork': { kind: 'create', history: 'history.fork', doing: 'job.doing.create' },
    'worktree:provision': { kind: 'create', history: 'history.provision', doing: 'job.doing.provision' },
    'worktree:remove': { kind: 'remove', history: 'history.remove', doing: 'job.doing.remove' },
    'database:sync': { kind: 'sync', history: 'history.sync', doing: 'job.doing.sync' },
    'worktree:pull': { kind: 'pull', history: 'history.pull', doing: 'job.doing.pull' },
    'worktree:restore': { kind: 'restore', history: 'history.restore', doing: 'job.doing.restore' },
    'worktree:discard': { kind: 'discard', history: 'history.discard', doing: 'job.doing.discard' },
    'worktree:account': { kind: 'account', history: 'history.account', doing: 'job.doing.account' },
    'git:fetch': { kind: 'fetch', history: 'history.fetch', doing: 'job.doing.fetch' },
};

export function kindOf(command: string): JobKind {
    return COMMANDS[command]?.kind ?? 'create';
}

/** What an operation is called, from the command it ran. */
export function historyKey(command: string): string {
    return COMMANDS[command]?.history ?? 'history.other';
}

/** What a row says about an operation that has not said which step it is on. */
export function doingKey(command: string): string {
    return COMMANDS[command]?.doing ?? 'job.doing.create';
}
