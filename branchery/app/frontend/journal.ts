/**
 * An operation's log, gathered a piece at a time.
 *
 * The page asks how an operation stands once a second, and a composer install
 * writes hundreds of kilobytes -- so the container is asked for what has been
 * written since the last look rather than for the whole of it again. What comes
 * back is added to what is here; a step whose output did not move comes back
 * without it and keeps what it had.
 */

import type { Job, JobStepDetail } from './types.js';

/** What has been gathered of one operation so far. */
export interface Journal {
    /** Every line the container has reported, in order. */
    log: string;
    /** How much of the log that is, in the container's own count. */
    size: number;
    /** The steps, each carrying all of its output. */
    steps: JobStepDetail[];
}

export const unread: Journal = { log: '', size: 0, steps: [] };

/**
 * The answer laid over what was gathered. A full answer replaces it -- that is
 * what the container sends when it cannot account for what the caller has, and
 * starting over is the only honest thing to do with a log that was replaced.
 */
export function gather(had: Journal, answer: Job): Journal {
    const kept = new Map(had.steps.map((step) => [step.no, step.output]));

    return {
        log: answer.partial ? had.log + answer.log : answer.log,
        size: answer.size,
        steps: answer.steps.map((step) => ({
            ...step,
            // A step the container left out is one it says has not moved. Where
            // nothing was kept for it either, it has nothing to show -- which is
            // what a step that wrote no line looks like anyway.
            output: step.output ?? kept.get(step.no) ?? '',
        })),
    };
}
