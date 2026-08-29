/**
 * What a page says while its answer is on the way, in one vocabulary rather
 * than one per page:
 *
 *   - Where the shape is already known, bars stand in the shape the answer will
 *     have. `sds-table` does its own; `bar()` is the rest.
 *   - Where it is not known, a spinner: a read has no share done, and a bar
 *     that travelled would invent a number.
 *   - Nothing under 200ms, and the word for it only over 2s -- Soul's own
 *     thresholds, carried by the delay of an animation rather than by a timer.
 *
 * None of it covers the page: an overlay would hold back the part that is
 * already right to say something about the part that is not.
 */

import { html, type TemplateResult } from 'lit';
import { t } from '../state.js';

/**
 * A wait with no shape to it: the system's spinner, and the word for what it is
 * once it has gone on long enough to be worth a word.
 */
export function waiting(): TemplateResult {
    return html`
        <p class="sds-loading branchery-waiting" role="status">
            <sds-icon class="sds-spinner" name="actions-circle-half" aria-hidden="true"></sds-icon>
            <span class="sds-loading__label branchery-waiting__label">${t('detail.loading')}</span>
        </p>`;
}

/**
 * Only in a shape known before the answer is. `at` is where the bar stands in
 * its stack -- a block of them pulsing in unison reads as the page blinking
 * rather than as work still coming.
 */
export function bar(at = 0, extra = ''): TemplateResult {
    return html`<span class="sds-skeleton branchery-waiting branchery-waiting__bar ${extra}"
        style="--sds-skeleton-delay: ${(at % 3) * 0.12}s"></span>`;
}
