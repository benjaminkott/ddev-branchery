/**
 * Asks back before consequential steps. A dialog of its own instead of
 * window.confirm: only that way can the affected worktrees be listed and the
 * design match the rest of the interface.
 *
 * The dialog is the system's own -- opening one, making the rest of the page
 * inert, taking the focus and answering Escape are the platform's `<dialog>`
 * doing them correctly, which is what `sds-dialog` is.
 */

import { html, nothing, type TemplateResult } from 'lit';
import type { SdsDialog } from '@typo3/soul-frontend';
import { query } from '../dom.js';
import { t } from '../state.js';

export interface ConfirmOptions {
    title: string;
    message: string;
    /**
     * What the answer is about, as facts rather than prose: a worktree name and
     * a database name are identifiers, read letter by letter, and prose is the
     * one place where that does not work.
     */
    facts?: { label: string; value: string }[];
    /**
     * What is about to be lost that the reader may not have in mind. It stands
     * over the facts, marked, being the one line that might change the answer.
     */
    warning?: string;
    confirmLabel: string;
    /**
     * Whether the press it asks for takes something away. The system draws that
     * press in its own danger colour, which is what the button that opened this
     * already says -- a question and its answer marked the same way.
     */
    tone?: 'primary' | 'danger';
}

const dialog = query<SdsDialog>('#confirm');

export function askConfirm(options: ConfirmOptions): Promise<boolean> {
    dialog.heading = options.title;
    dialog.body = said(options);
    // The pair of buttons is the element's own: it draws them in the order the
    // rest of the system reads a foot in, announces what was pressed, and
    // settles the promise on every way out.
    dialog.confirmLabel = options.confirmLabel;
    dialog.cancelLabel = t('action.cancel');
    dialog.tone = options.tone ?? 'primary';

    return dialog.ask();
}

/** The question, and everything the reader needs in order to answer it. */
function said(options: ConfirmOptions): TemplateResult {
    return html`
        <p>${options.message}</p>
        ${options.warning === undefined ? nothing : html`<sds-note tone="warn" body=${options.warning}></sds-note>`}
        ${
            options.facts === undefined || options.facts.length === 0
                ? nothing
                : html`
            <div class="branchery-preview">
                <dl>${options.facts.map(
                    (fact) => html`
                    <dt>${fact.label}</dt>
                    <dd><code class="sds-mono">${fact.value}</code></dd>`,
                )}</dl>
            </div>`
        }`;
}
