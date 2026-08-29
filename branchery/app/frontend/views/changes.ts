/**
 * What is uncommitted, on a surface of its own. Unfolded under the heading it
 * hangs from, a dozen paths each able to open a diff pushed the history off the
 * bottom of the page.
 *
 * The surface is all this module is: what has been read, which file is open and
 * where the answer comes from stay with the page that opened it.
 */

import { html, type TemplateResult } from 'lit';
import type { SdsDialog } from '@typo3/soul-frontend';
import { query, saying } from '../dom.js';
import { t } from '../state.js';

const dialog = query<SdsDialog>('#changes');

/** Whose files are on it, and the empty name when it is closed. */
let showing = '';

/** What is on the surface right now -- nothing, or the worktree it belongs to. */
export function shownChanges(): string {
    return showing;
}

/**
 * Called again for every draw of the page behind it: an operation that ends
 * while it stands open changes what is uncommitted, and a dialog that went on
 * showing what was true when it opened is the worse of the two lies.
 */
export function showChanges(name: string, heading: string, body: TemplateResult): void {
    showing = name;
    dialog.heading = heading;
    dialog.body = body;
    // The close mark in the head is the element's own; the button under the
    // body is for the hand that is already down there. Through a template,
    // because the surface takes templates and `saying` lives inside one.
    dialog.actions = [
        html`${saying(
            t('action.close'),
            html`<sds-button variant="ghost" @click=${() => dialog.close()}>${t('action.close')}</sds-button>`,
        )}`,
    ];
    dialog.show();
}

export function closeChanges(): void {
    dialog.close();
}

/**
 * Every way out of a dialog of this system arrives as one event, which is why
 * the page that opened it is told here rather than at each of them.
 */
export function onChangesClose(listener: () => void): void {
    dialog.addEventListener('sds-dialog-cancel', () => {
        showing = '';
        listener();
    });
}
