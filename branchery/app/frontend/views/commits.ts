/**
 * What is on a branch, newest first, as the table it is read in. The same list
 * on two pages: a worktree's and a branch's. Only where the commits are read
 * from and where a subject leads differ, so those are handed in.
 *
 * The rail down the left is the system's own: a ring where the branch stands
 * and a filled node for everything behind it, which is what makes a list of
 * subjects read as a history rather than as rows.
 */

import { html, nothing, type TemplateResult } from 'lit';
import type { Column, Row } from '@typo3/soul-frontend';
import { formatWhen, saying } from '../dom.js';
import { state, t } from '../state.js';
import type { Reading } from '../rules/reading.js';
import type { Commits } from '../types.js';

/**
 * The container's own page size, said again here -- the one thing the table can
 * be told about an answer that has not arrived is what was asked for. It mirrors
 * `ApiController::COMMIT_PAGE`, or the page waits at one height and arrives at
 * another.
 */
const PAGE = 10;

/** What the columns are, which is what makes the shape known before the rows are. */
function columns(): Column[] {
    return [
        { head: '', cls: 'sds-td-graph' },
        { head: t('table.subject') },
        { head: t('table.when'), cls: 'sds-td-meta', align: 'end', fit: true },
        { head: t('table.author'), fit: true },
        { head: t('table.commit'), cls: 'sds-td-name', fit: true },
    ];
}

/**
 * The head is drawn and the body is bars at the height the rows will have: the
 * page says where the reading will land, and the list arrives in the room
 * already made for it.
 */
export function waitingCommits(): TemplateResult {
    return html`<sds-table scrollable loading loading-rows=${PAGE} .columns=${columns()}></sds-table>`;
}

export function commitTable(read: Commits, href: (sha: string) => string): TemplateResult | typeof nothing {
    if (read.commits.length === 0) {
        return nothing;
    }

    return html`<sds-table
        scrollable
        .columns=${columns()}
        .rows=${read.commits.map((commit, at): Row => {
            // Where the branch's own work ends: what is below the cut is the base's,
            // drawn in the muted ink, and the first row of it carries the base's name.
            // A graph says this with a lane; the list said nothing.
            const cut = !commit.own && (at === 0 || read.commits[at - 1]?.own === true);
            // The subject leads into the commit, because it raises the question the
            // page about one answers: a subject says what was meant and the diff says
            // what was done. The hash beside it leads out to the forge.
            const said = html`${
                commit.pushed ? nothing : html`<sds-badge label=${t('detail.notPushed')} tone="warn"></sds-badge> `
            }${
                cut && read.base !== null ? html`<sds-badge label=${read.base} tone="neutral"></sds-badge> ` : nothing
            }<span
                    class=${commit.own ? 'branchery-subject' : 'branchery-subject branchery-subject--base'}><sds-link
                    href=${href(commit.sha)}
                    label=${commit.subject}></sds-link></span>`;

            return {
                cells: [
                    node(at === 0 ? 'current' : ''),
                    // Where the branch stands, set like the line above it: what is bold is
                    // what is current, and everything behind it reads as the history it is.
                    at === 0 ? html`<strong>${said}</strong>` : said,
                    formatWhen(commit.when, state.language),
                    commit.author,
                    commit.url === null
                        ? html`<code class="sds-mono">${commit.sha}</code>`
                        : html`<sds-link external href=${commit.url} label=${commit.sha}></sds-link>`,
                ],
            };
        })}></sds-table>`;
}

/** One node on the rail: where the reader is, an entry that is open, or neither. */
export function node(mark: 'current' | 'open' | ''): TemplateResult {
    return html`<span class="sds-graph${mark === '' ? '' : ` sds-graph--${mark}`}"></span>`;
}

/**
 * A log is as long as a project is old, so what is behind the last row is asked
 * for rather than sent, and only by somebody who read to the bottom. A read that
 * failed is said here rather than in place of the list: the commits already on
 * the page are still true.
 */
export function olderCommits(
    read: Commits,
    trouble: string,
    reading: boolean,
    more: () => void,
): TemplateResult | typeof nothing {
    if (!read.more && trouble === '') {
        return nothing;
    }

    return html`
        <p class="branchery-changes__more">
            ${
                trouble === ''
                    ? nothing
                    : html`<sds-note tone="warn" body=${`${t('detail.commitsFailed')} ${trouble}`}></sds-note>`
            }
            ${
                !read.more
                    ? nothing
                    : reading
                      ? // Two templates and not one button whose word changes: a label
                        // written over after the component drew it is not read again.
                        saying(
                            t('detail.loading'),
                            html`<sds-button variant="ghost" disabled>${t('detail.loading')}</sds-button>`,
                        )
                      : saying(
                            t('detail.olderCommits'),
                            html`<sds-button variant="ghost" @click=${more}>${t('detail.olderCommits')}</sds-button>`,
                        )
            }
        </p>`;
}

/**
 * Both pages that draw this list kept the same record and read it the same way,
 * and two copies of one rule had drifted already: a read that failed was still
 * said over the next subject on one of them.
 *
 * What differs between the pages is where the commits are read from and where a
 * subject leads, so those are handed in.
 */
export interface CommitLog {
    /** Whose commits are wanted: a worktree on one page, a branch on the other. */
    about(name: string): void;
    /** What has arrived about this subject, or null before anything has. */
    of(name: string): Commits | null;
    /**
     * What came instead of the list, where nothing came -- or the empty string,
     * which is every other state including a read that failed with rows already
     * on the page.
     */
    trouble(name: string): string;
    /** The shape it will have, or the rows and the way further back. */
    body(name: string, href: (sha: string) => string): TemplateResult;
    /** The subject was worked on, so what was read about it is no longer true. */
    forget(name: string): void;
}

/** What one page keeps of the commits it is showing. */
interface Held {
    name: string;
    commits: Commits | null;
    trouble: string;
    reading: boolean;
}

export function commitLog(
    ask: (name: string, skip: number) => Promise<Commits>,
    reading: Reading,
    again: () => void,
): CommitLog {
    let held: Held = empty('');

    /**
     * What has been read stays read: a list that answered by replacing itself
     * would land the reader back at the top.
     */
    async function page(name: string, skip: number): Promise<void> {
        if (skip > 0 && held.name === name) {
            // Said before the answer is here, and only for the press that asked: the
            // first page is read while the page is being drawn.
            held = { ...held, reading: true, trouble: '' };
            again();
        }
        await reading(
            () => ask(name, skip),
            () => held.name === name,
            (read, trouble) => {
                const behind = skip > 0 ? (held.commits?.commits ?? []) : [];
                held = {
                    name,
                    commits: read === null ? held.commits : { ...read, commits: [...behind, ...read.commits] },
                    trouble,
                    reading: false,
                };
            },
        );
    }

    return {
        about(name) {
            if (held.name === name) {
                return;
            }
            held = empty(name);
            void page(name, 0);
        },
        of: (name) => (held.name === name ? held.commits : null),
        trouble: (name) =>
            held.name === name && held.commits === null && held.trouble !== ''
                ? `${t('detail.commitsFailed')} ${held.trouble}`
                : '',
        body(name, href) {
            const read = held.name === name ? held.commits : null;
            if (read === null) {
                return waitingCommits();
            }

            return html`${commitTable(read, href)}
                ${olderCommits(read, held.trouble, held.reading, () => void page(name, read.commits.length))}`;
        },
        forget(name) {
            if (held.name === name) {
                held = empty('');
            }
        },
    };
}

function empty(name: string): Held {
    return { name, commits: null, trouble: '', reading: false };
}
