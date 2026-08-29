/**
 * The way back, as the press it is. A trail stood here and said "All worktrees
 * / feature-checkout": two steps, the second of which is the heading directly
 * under it. Read as a statement of place it was correct; looked for by somebody
 * who wants out, it was a word among words.
 *
 * One level and not the root: from a commit that is the checkout or the branch
 * it was read on, which is where the reader came in.
 */

import { html, type TemplateResult } from 'lit';
import { saying } from '../dom.js';

export function backTo(label: string, href: string): TemplateResult {
    // The system's own row, which carries the step under it that the trail used
    // to pay.
    return html`
        <div class="sds-row branchery-back">
            ${saying(
                label,
                html`<sds-button variant="ghost" href=${href}><sds-icon
                name="actions-arrow-start" aria-hidden="true"></sds-icon>${label}</sds-button>`,
            )}
        </div>`;
}
