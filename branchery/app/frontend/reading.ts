/**
 * Reading one thing about the page that is on screen, and keeping what came of
 * it. The part worth stating once is the middle: an answer about something the
 * reader has since left is dropped rather than drawn. Every read used to carry
 * its own copy of that rule, which is one place each for it to be forgotten.
 *
 * Nothing here knows what a failure reads like or how a page is drawn, which
 * keeps it a rule about promises rather than a module that needs a browser.
 */

/**
 * `still` is asked after the answer is here, never before: what decides is
 * where the reader is now.
 */
export type Reading = <T>(
    ask: () => Promise<T>,
    still: () => boolean,
    keep: (read: T | null, trouble: string) => void,
) => Promise<void>;

export function reader(sentence: (error: unknown) => string, again: () => void): Reading {
    return async <T>(ask: () => Promise<T>, still: () => boolean, keep: (read: T | null, trouble: string) => void) => {
        let read: T | null = null;
        let trouble = '';
        try {
            read = await ask();
        } catch (error) {
            trouble = sentence(error);
        }
        if (!still()) {
            return;
        }
        keep(read, trouble);
        again();
    };
}
