/**
 * Where in the interface the reader is: the address bar, and nothing else. A
 * worktree has a page, so it has an address -- one that can be sent to
 * somebody and come back to with the browser's own back button. The fragment
 * carries it, because what serves this interface is a static file server.
 *
 * What an address means is a rule about a string and lives in routes.ts, where
 * it can be checked without a window. A page carries its own headings in the
 * address rather than in a fragment of its own: there is one fragment.
 */

import { routeOf, type Route } from './routes.js';

export type { Route } from './routes.js';

const listeners: ((route: Route) => void)[] = [];

export function currentRoute(): Route {
    return routeOf(window.location.hash);
}

/** Go somewhere. The browser's history is what remembers it. */
export function go(path: string): void {
    if (window.location.hash !== `#${path}`) {
        window.location.hash = path;
    }
}

export function onRoute(listener: (route: Route) => void): void {
    listeners.push(listener);
}

/**
 * Where a page begins is the page's own to say. The browser puts an address it
 * has seen before back where that entry was scrolled to, and does so after the
 * view has been drawn again -- a movement on top of the one the view decided,
 * measured on a page of a different length. Said again at every address.
 */
function ownTheScroll(): void {
    history.scrollRestoration = 'manual';
}

ownTheScroll();

window.addEventListener('hashchange', () => {
    ownTheScroll();
    const route = currentRoute();
    for (const listener of listeners) {
        listener(route);
    }
});
