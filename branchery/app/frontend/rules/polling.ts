/**
 * Asking the same question again and again, one answer at a time. An interval
 * fires whether or not the last question has been answered, and a slow "still
 * running" can then land after a fast "done" -- drawing the stage back to the
 * middle of an operation, with the interval already stopped.
 */

/** Where the waiting is done, so that a test can do it by hand. */
export interface Timers {
    schedule(work: () => void, after: number): unknown;
    cancel(handle: unknown): void;
}

const clock: Timers = {
    schedule: (work, after) => setTimeout(work, after),
    cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * Asks, hands each answer over, and asks again after the interval for as long as
 * the answer says to go on. A question that fails is simply asked again.
 */
export function poll<T>(
    ask: () => Promise<T>,
    goOn: (answer: T) => boolean,
    interval: number,
    timers: Timers = clock,
): () => void {
    let stopped = false;
    let waiting: unknown = null;

    const later = (): void => {
        waiting = timers.schedule(() => {
            waiting = null;
            void once();
        }, interval);
    };

    const once = async (): Promise<void> => {
        let answer: T;
        try {
            answer = await ask();
        } catch {
            if (!stopped) {
                later();
            }

            return;
        }
        if (stopped) {
            return;
        }
        if (goOn(answer)) {
            later();
        } else {
            stopped = true;
        }
    };

    void once();

    return () => {
        stopped = true;
        if (waiting !== null) {
            timers.cancel(waiting);
            waiting = null;
        }
    };
}
