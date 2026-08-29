/**
 * Minimal reactive state: every assignment to a property notifies the
 * subscribers, batched onto the next frame.
 */

/**
 * Whether two values say something different, rather than merely being two
 * objects. The store notifies on every assignment of a new object and the
 * project is read again every few seconds, so every look was a redraw -- and a
 * redraw closes an open dropdown and takes the focus off a button.
 */
export function differs(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) !== JSON.stringify(b);
}

export interface Store<T extends object> {
    state: T;
    /**
     * Stated as a value and not as a method, because that is how it is used:
     * every reader takes it off the store at the import, and a method taken off
     * its object is one whose `this` is gone.
     */
    subscribe: (listener: () => void) => () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
    const listeners = new Set<() => void>();
    let scheduled = false;

    const notify = (): void => {
        if (scheduled) {
            return;
        }
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            for (const listener of listeners) {
                listener();
            }
        });
    };

    const state = new Proxy(
        { ...initial },
        {
            set(target, key, value): boolean {
                if (Reflect.get(target, key) === value) {
                    return true;
                }
                Reflect.set(target, key, value);
                notify();
                return true;
            },
        },
    );

    return {
        state,
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}
