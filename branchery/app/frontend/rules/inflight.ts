/**
 * One piece of work at a time. A second press while the last stop's request is
 * out -- the button again, or the return key in the field beside it -- used to
 * send the same request twice, and the second was refused as "another operation
 * is still running" on a worktree the reader had asked for once.
 */
export interface Latch {
    /** Whether work is still going. */
    pending(): boolean;
    /**
     * Runs the work unless some is still going, and says whether it did.
     * `settled` is called once the work is over, whether it ended well or threw.
     */
    run(work: () => unknown, settled?: () => void): boolean;
}

export function latch(): Latch {
    let pending = false;

    return {
        pending: () => pending,
        run(work, settled = () => {}) {
            if (pending) {
                return false;
            }
            pending = true;
            const done = (): void => {
                pending = false;
                settled();
            };

            let outcome: unknown;
            try {
                outcome = work();
            } catch (error) {
                done();
                throw error;
            }
            // Work that hands back nothing is over already; work that hands back a
            // promise is over when the promise is, either way round.
            void Promise.resolve(outcome).then(done, done);

            return true;
        },
    };
}
