/**
 * What the browser is asked to remember between visits, and what it does when
 * the browser will not.
 *
 * A browser set to keep no site data throws on the read itself, and the first
 * of these happens while the modules are still being loaded -- so the interface
 * did not come up at all, where it could have come up in English. Nothing kept
 * here is worth a page: a language and how long the list was. Where the answer
 * cannot be had there is a default, and the visit is simply not remembered.
 */

export function recall(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function keep(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Said to nobody: what is lost is that the next visit starts as this one
        // did, which is not something to put a line on the page about.
    }
}
