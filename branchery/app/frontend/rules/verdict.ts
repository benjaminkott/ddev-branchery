/**
 * What the end of an operation is allowed to say, by how it stands. Four states
 * come back from the container and the stage used to know three: one it had no
 * record of was titled as aborted and then offered the worktree it had built.
 * Decided here, once, so the title and the line under it cannot disagree.
 */

import type { Job } from '../types.js';

/** The key of the title over the stage. */
export function titleOf(status: Job['status']): string {
    switch (status) {
        case 'running':
            return 'job.running';
        case 'done':
            return 'job.done';
        case 'failed':
            return 'job.failed';
        default:
            return 'job.unknown';
    }
}

/**
 * Whether there is a result to report. Only an operation that ended has one --
 * not one that stopped, and not one nothing is known about.
 */
export function hasResult(status: Job['status']): boolean {
    return status === 'done';
}

/**
 * `AbstractJobCommand` writes a failure into the log as "✗ " and the sentence,
 * so that mark is part of what the container answers with. Known here rather
 * than in each of the two places that quote the reason. The last one, because a
 * run that failed after a retry has more than one.
 */
export function whyItStopped(log: string): string {
    const marked = log
        .trim()
        .split('\n')
        .reverse()
        .find((line) => line.startsWith(FAILURE_MARK));

    return marked === undefined ? '' : marked.slice(FAILURE_MARK.length).trim();
}

const FAILURE_MARK = '\u2717';
