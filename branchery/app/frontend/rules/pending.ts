/**
 * The worktrees that are being made and are not there yet. A worktree exists
 * once its checkout does, which is the second step of making one; until then
 * the list said "twelve worktrees" about a project with a thirteenth on the
 * way. These are the operations that make a worktree, about a name the list
 * does not have.
 */

import type { RunningJob } from '../types.js';

const MAKING = new Set(['worktree:add', 'worktree:fork']);

export function pendingCreations(running: readonly RunningJob[], existing: readonly string[]): RunningJob[] {
    const names = new Set(existing);

    return running.filter((job) => MAKING.has(job.command) && job.subject !== '' && !names.has(job.subject));
}
