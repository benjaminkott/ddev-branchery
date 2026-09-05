/**
 * What was read beside a view, for the page that asked for it.
 *
 * A history, one commit in full, the size of a checkout: each is a container
 * call of its own, made after the page it belongs to was drawn and arriving
 * whenever it arrives. So each view kept the same three things -- which page it
 * read for, what came back, and why nothing did -- and each of them spelled it
 * out again, with the value under a different name every time.
 *
 * One holder, so the question every one of them has to answer is asked in one
 * place: is this still the page that asked? An answer that arrives after the
 * reader has moved on belongs to nothing and is dropped rather than drawn over
 * what they went to.
 *
 * The key is the view's to choose. A worktree's history is keyed by its name; a
 * commit by the checkout and the hash together, because the same hash on
 * another branch is another page.
 */

import type { Reading } from './reading.js';

export interface Aside<T> {
    /**
     * Now on this page. True where nothing is held for it, which is the caller's
     * cue to read -- so the two things a view does on arriving are one call.
     */
    about(key: string): boolean;

    /** What was read for this page, or null while nothing has arrived for it. */
    of(key: string): T | null;

    /** Why nothing did, or "" where nothing went wrong. */
    trouble(key: string): string;

    /**
     * Whether this is still the page it is about. What an answer arriving late
     * is asked, before anything is drawn on the strength of it.
     */
    stillOn(key: string): boolean;

    /** What arrived. Ignored where the reader has gone on to another page. */
    put(key: string, value: T): void;

    /** What went wrong instead. Ignored the same way. */
    failed(key: string, trouble: string): void;

    /**
     * Drop what is held, so the next look reads again. Only where it is about
     * this page: an operation on one worktree says nothing about another's.
     */
    forget(key: string): void;

    /** Nothing is held for any page; the next look reads. */
    clear(): void;
}

export function aside<T>(): Aside<T> {
    let at = '';
    let held: T | null = null;
    let why = '';

    const mine = (key: string): boolean => at === key;

    return {
        about(key) {
            if (at !== key) {
                at = key;
                held = null;
                why = '';

                return true;
            }

            return held === null && why === '';
        },
        of: (key) => (mine(key) ? held : null),
        stillOn: mine,
        trouble: (key) => (mine(key) ? why : ''),
        put(key, value) {
            if (mine(key)) {
                held = value;
                why = '';
            }
        },
        failed(key, trouble) {
            if (mine(key)) {
                held = null;
                why = trouble;
            }
        },
        forget(key) {
            if (mine(key)) {
                at = '';
                held = null;
                why = '';
            }
        },
        clear() {
            at = '';
            held = null;
            why = '';
        },
    };
}

/**
 * Reading one thing into what is held beside a page.
 *
 * The read and the holder are two rules and every such read is both of them:
 * an answer about a page the reader has left is dropped, and what came back
 * as nothing is what went wrong. Written out at each read they were the same
 * six lines four times over, in three views, with the "nothing came back"
 * branch spelled again every time -- and one of them is one place for it to be
 * spelled differently.
 */
export async function readInto<T>(held: Aside<T>, key: string, ask: () => Promise<T>, reading: Reading): Promise<void> {
    await reading(
        ask,
        () => held.stillOn(key),
        (read, trouble) => {
            if (read === null) {
                held.failed(key, trouble);

                return;
            }
            held.put(key, read);
        },
    );
}
