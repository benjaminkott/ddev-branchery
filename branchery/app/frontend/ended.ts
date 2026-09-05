/**
 * An operation on a worktree is over.
 *
 * What a page holds about a worktree stops being true the moment one finishes:
 * its history has an entry more, and after a discard or a pull its branch
 * carries other commits than the list shows. The shell is what hears an
 * operation end, and it used to say so by calling into the page about a
 * worktree by name -- which is the shell knowing which pages there are.
 *
 * Said as an event instead: whoever is on screen and cares is listening, and a
 * page that is not on screen is not.
 */

const ENDED = 'branchery-operation-ended';

export function operationEnded(subject: string): void {
    window.dispatchEvent(new CustomEvent(ENDED, { detail: subject }));
}

/** Answers with the way to stop listening -- a page takes this while it stands. */
export function onOperationEnded(listener: (subject: string) => void): () => void {
    const heard = (event: Event): void => listener((event as CustomEvent<string>).detail);
    window.addEventListener(ENDED, heard);

    return () => window.removeEventListener(ENDED, heard);
}
