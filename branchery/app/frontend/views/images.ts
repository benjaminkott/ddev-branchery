/**
 * A change in an image, which a diff cannot show.
 *
 * git says "Binary files ... differ" and stops there, so what stands here is
 * the two images: the one that was there and the one that is, beside one
 * another and each at the size it actually has -- a logo that grew is a logo
 * that is drawn bigger, before any number says so.
 *
 * A side that is missing is the image this change added, or the one it deleted.
 * Its frame stays, empty: the pair is what says which of the two happened.
 */

import { html, type TemplateResult } from 'lit';
import { formatBytes } from '../dom.js';
import { state, t } from '../state.js';
import type { ImageChange, ImageSide } from '../types.js';

export function imagePair(path: string, change: ImageChange): TemplateResult {
    return html`
        <div class="branchery-image">
            ${side(change.before, t('detail.imageBefore'), t('detail.imageBeforeAlt', { path }))}
            ${side(change.after, t('detail.imageAfter'), t('detail.imageAfterAlt', { path }))}
        </div>`;
}

function side(shown: ImageSide | null, label: string, said: string): TemplateResult {
    return html`
        <figure class="branchery-image__side">
            <div class="branchery-image__frame">
                ${
                    shown === null
                        ? html`<span class="branchery-image__nothing">${t('detail.imageNothing')}</span>`
                        : html`<img class="branchery-image__of" src=${shown.source} alt=${said}>`
                }
            </div>
            <figcaption class="branchery-image__caption">
                ${label}
                ${
                    shown === null
                        ? ''
                        : html`<span class="branchery-image__bytes">${formatBytes(shown.bytes, state.language)}</span>`
                }
            </figcaption>
        </figure>`;
}
