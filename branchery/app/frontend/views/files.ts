/**
 * A list of files, each opening onto the change in it -- what is uncommitted in
 * a worktree, and what one commit touched. The diff is read when it is asked
 * for, a commit that touched two hundred files being two hundred answers nobody
 * wants at once.
 *
 * What has been read and where an answer comes from stay with the caller, which
 * is what lets the same list stand under a message on one page and inside a
 * dialog on another.
 */

import { html, nothing, type TemplateResult } from 'lit';
import { saying } from '../dom.js';
import { t } from '../state.js';
import type { Change, ChangeDiff } from '../types.js';
import { imagePair } from './images.js';
import { waiting } from './waiting.js';

/** Something fetched when asked for: the answer, why there is none, and whether it is open. */
export interface Shown<T> {
    read: T | null;
    trouble: string;
    open: boolean;
}

/**
 * A checkout in the middle of a rebase has a few hundred uncommitted files, and
 * a few hundred rows under the commits is a page that ends in nothing else. The
 * first few say what kind of change it is; the rest is one press away.
 */
const FILES_SHOWN = 25;

interface FileList {
    files: Change[];
    /** The change in each file the reader opened, by path. */
    diffs: Map<string, Shown<ChangeDiff>>;
    /** A press on one of them: opened, or closed again. */
    press: (path: string) => void;
    /** Whether the reader asked for the ones behind the first few, and the press that asks. */
    all: boolean;
    showAll: () => void;
}

export function fileList(list: FileList): TemplateResult {
    const rest = list.files.length - FILES_SHOWN;
    const shown = list.all || rest <= 0 ? list.files : list.files.slice(0, FILES_SHOWN);

    return html`
        <ul class="branchery-changes">
            ${shown.map((change) => {
                const diff = list.diffs.get(change.path);
                const open = diff?.open === true;

                // The row is the press rather than carrying one at its end: twenty rows
                // had "Show the change" written down the right edge, which is one word
                // said so often it stops being read -- and what a hand goes for is the
                // name. `aria-expanded` says which way it stands to a reader who is told.
                return html`
                    <li class="branchery-changes__file">
                        <button type="button" class="branchery-changes__row" aria-expanded=${open}
                                @click=${() => list.press(change.path)}>
                            <sds-badge label=${t(`change.${change.status}`)}
                                       tone=${change.status === 'deleted' ? 'warn' : nothing}></sds-badge>
                            ${written(change.path)}
                            <sds-icon class="branchery-changes__mark" size="16" aria-hidden="true"
                                      name=${open ? 'actions-chevron-down' : 'actions-chevron-end'}></sds-icon>
                        </button>
                        ${open ? shownDiff(diff) : nothing}
                    </li>`;
            })}
        </ul>
        ${
            list.all || rest <= 0
                ? nothing
                : html`
            <p class="branchery-changes__more">
                ${saying(
                    t('detail.showAllFiles', { count: rest }),
                    html`<sds-button variant="ghost" @click=${list.showAll}>${t('detail.showAllFiles', {
                        count: rest,
                    })}</sds-button>`,
                )}
            </p>`
        }`;
}

/**
 * Read from its end: what tells one row from the next is the file name, and in
 * a dozen changes under one directory that is the last thing on the line. The
 * directory stays and is set quietly.
 */
function written(path: string): TemplateResult {
    const cut = path.lastIndexOf('/');

    return html`<code class="sds-mono branchery-changes__path">${
        cut < 0 ? nothing : html`<span class="branchery-changes__dir">${path.slice(0, cut + 1)}</span>`
    }${path.slice(cut + 1)}</code>`;
}

function shownDiff(shown: Shown<ChangeDiff> | undefined): TemplateResult {
    if (shown === undefined || (shown.read === null && shown.trouble === '')) {
        return waiting();
    }
    if (shown.read === null) {
        return html`<sds-note tone="warn" body=${`${t('detail.changeFailed')} ${shown.trouble}`}></sds-note>`;
    }

    // An image is shown as itself: a diff of one says only that it changed.
    if (shown.read.image !== null) {
        return imagePair(shown.read.path, shown.read.image);
    }

    return html`
        <sds-diff path=${shown.read.path} .body=${shown.read.lines}></sds-diff>
        ${shown.read.truncated ? html`<p class="branchery-changes__more">${t('detail.changeTruncated')}</p>` : nothing}`;
}

/**
 * Opened, or closed again -- and where nothing has been read about it yet, the
 * change is asked for. A read that failed is asked again at the next press
 * rather than remembered: the container may be back by then.
 */
export function toggleFile(diffs: Map<string, Shown<ChangeDiff>>, path: string, ask: () => void): void {
    const shown = diffs.get(path) ?? { read: null, trouble: '', open: false };
    shown.open = !shown.open;
    diffs.set(path, shown);
    if (shown.open && shown.read === null) {
        ask();
    }
}

/**
 * Dropped where the row is not there any more, which is a list read again under
 * a reader who had one of its files open.
 */
export function keepDiff(
    diffs: Map<string, Shown<ChangeDiff>>,
    path: string,
    read: ChangeDiff | null,
    trouble: string,
): void {
    const shown = diffs.get(path);
    if (shown !== undefined) {
        diffs.set(path, { ...shown, read, trouble });
    }
}
