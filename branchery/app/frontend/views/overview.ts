/** Overview of all worktrees of the project. */

import { api } from '../api.js';
import { html, nothing, render, type TemplateResult } from 'lit';
import { buildButton, buildWayOut, formatWhen, host, maybe, query, repositoryName, saying } from '../dom.js';
import { busyWith, doingWord, reportError, setError, state, t } from '../state.js';
import { pendingCreations } from '../pending.js';
import type { RunningJob } from '../types.js';
import type { DropdownChosen, Row, SdsDropdown } from '@typo3/soul-frontend';
import { found, matching, matchingBranches } from '../filter.js';
import { byBase } from '../lineage.js';
import type { Branch, JobHandlers, Worktree } from '../types.js';
import { go } from '../router.js';
import { openCreate } from './create.js';
import { finished } from '../finished.js';
import { bar } from './waiting.js';
import { openTidy } from './tidy.js';

export type OverviewHandlers = JobHandlers;

/** From how many rows the page is filtered rather than read. Branches count towards it. */
const FILTER_FROM = 6;

/**
 * Kept out here because the list is redrawn whenever an operation ends or a
 * language changes, and a filter that emptied itself then would put the reader
 * back in front of all forty rows.
 */
let needle = '';

/**
 * How many branches without a worktree are shown before the rest are one press
 * away. A repository has hundreds, and the freshest are the ones somebody is
 * about to want; the field searches all of them either way.
 */
const BRANCHES_SHOWN = 10;

let allBranches = false;

/** The handlers of the page on screen, for what the keyboard reaches. */
let current: OverviewHandlers | null = null;

export function renderOverview(handlers: OverviewHandlers): void {
    current = handlers;
    if (!state.loading) {
        rememberRows();
    }
    const all = entries();
    // Under the branch they were cut from -- what a graph does with lanes, and
    // what a table can do with order.
    const shown = byBase(matching(state.worktrees, needle), state.project?.branch ?? state.branch);

    render(
        html`
      <div class="sds-bands">
        <section class="sds-band">
            ${state.error === '' ? nothing : html`<sds-note tone="error" body=${state.error}></sds-note>`}
            ${unfinishedNote(all)}
            ${tidyNote(all, handlers)}
            <div class="sds-row branchery-project">
                <h2 class="branchery-project__name">${
                    nameless() ? bar(0, 'branchery-waiting__title') : whichProject()
                }</h2>
                ${
                    /* A press and not the title: a heading that is also a door is read as
                      one thing and pressed as another. */
                    state.repository === null
                        ? nothing
                        : html`<span class="sds-row sds-row__end">${buildWayOut(
                              state.repository,
                              t('detail.repository'),
                          )}</span>`
                }
            </div>
            ${checkout()}
        </section>
        <section class="sds-band sds-band--quiet">
            <div class="branchery-section-head">
                ${all.length + state.branches.length >= FILTER_FROM ? field() : nothing}
                <div class="branchery-section-actions">${actions()}</div>
            </div>
            ${listHead(all, shown.length)}
            ${list(all, shown)}
        </section>
        ${freeBranches()}
      </div>`,
        query<HTMLElement>('#main'),
    );
}

/**
 * The repository names it where there is one -- "TYPO3GmbH/blog" -- and DDEV's
 * own name stands where a checkout was cloned from a directory.
 */
function whichProject(): string {
    if (state.repository !== null) {
        return repositoryName(state.repository);
    }

    return state.projectName === '' ? t('nav.worktrees') : state.projectName;
}

/**
 * Before the first answer the fallback above is true of every project, and a
 * title changing under the reader cannot be mistaken for the page settling.
 */
function nameless(): boolean {
    return state.loading && state.repository === null && state.projectName === '';
}

/**
 * Over the list and not in it: it is about the list as a whole, and a row
 * suggesting its own removal is an offer where the reader is scanning for
 * something else.
 */
function tidyNote(all: Worktree[], handlers: OverviewHandlers): TemplateResult | typeof nothing {
    const done = finished(all);
    if (done.length === 0 || state.loading) {
        return nothing;
    }

    // It names them: "one worktree looks finished" over a list of thirteen
    // sends the reader looking for which.
    return html`
        <sds-note tone="info"
                  body=${t('tidy.note', { count: done.length, names: named(done) })}
                  action=${t('tidy.open')}
                  @sds-note-action=${() => openTidy(all, handlers)}></sds-note>`;
}

/** Before the offer to tidy up: what needs a hand comes before what could be let go. */
function unfinishedNote(all: Worktree[]): TemplateResult | typeof nothing {
    const stopped = all.filter((worktree) => worktree.incomplete && busyWith(worktree.name) === undefined);
    if (stopped.length === 0 || state.loading) {
        return nothing;
    }

    return html`
        <sds-note tone="warn"
                  body=${t('overview.unfinished', { count: stopped.length, names: named(stopped) })}></sds-note>`;
}

function named(worktrees: Worktree[]): string {
    return worktrees.map((worktree) => worktree.name).join(', ');
}

/**
 * What the page counts, warns about and refuses a name to -- not the list,
 * which is the worktrees alone.
 */
function entries(): Worktree[] {
    return state.project ? [state.project, ...state.worktrees] : state.worktrees;
}

/** Its shortcut is written into it: one nobody is told about is one nobody uses. */
function field(): TemplateResult {
    // The element states one value, its placeholder until somebody types.
    // Drawn again on every keystroke, so the prompt comes back when it empties.
    return html`
        <sds-field
            class="branchery-filter"
            field-id="filter"
            icon="actions-search"
            suffix="/"
            label=${t('overview.filter')}
            value=${needle === '' ? t('overview.filterPlaceholder') : needle}
            ?filled=${needle !== ''}
            @sds-input=${(event: CustomEvent<string>) => narrow(event.detail)}
            @keydown=${leaveOrOpen}></sds-field>`;
}

function narrow(value: string): void {
    needle = value;
    again();
}

function again(): void {
    if (current !== null) {
        renderOverview(current);
    }
}

function leaveOrOpen(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        if (event.target instanceof HTMLElement) {
            event.target.blur();
        }
        narrow('');

        return;
    }

    // Type a few letters, press return, be there -- without taking a hand off
    // the keyboard to point at the one row that is left.
    if (event.key === 'Enter') {
        // The project's own checkout only where the list has nothing: it stands
        // over the field rather than in what it narrows.
        const first =
            matching(state.worktrees, needle)[0] ?? matching(state.project === null ? [] : [state.project], needle)[0];
        if (first !== undefined) {
            event.preventDefault();
            go(`/w/${first.name}`);
        }
    }
}

/**
 * Kept from one draw to the next: an element built anew on every draw is one
 * the renderer swaps out, so the dropdown closed under the pointer and the
 * button lost its focus every time the poll redrew the page.
 */
let controls: { key: string; nodes: HTMLElement[] } | null = null;

function actions(): HTMLElement[] {
    const key = JSON.stringify([state.remotes, state.language]);
    if (controls?.key !== key) {
        const fetching = buildFetch();
        controls = { key, nodes: [...(fetching === null ? [] : [fetching]), creating()] };
    }

    return controls.nodes;
}

function pressed(act: (handlers: OverviewHandlers) => void): void {
    if (current !== null) {
        act(current);
    }
}

function creating(): HTMLElement {
    const button = buildButton(t('nav.newWorktree'), 'primary', () => pressed(openCreate));
    // The shortcut is written where the thing itself is, not in a legend.
    button.title = `${t('nav.newWorktree')} (n)`;

    return button;
}

/**
 * Four columns, and only one of them is prose. A worktree's name says what its
 * database and its address are, so columns for those were the name written
 * three times while the one column with something to say wrapped to four lines.
 *
 * Soul's table and not a grid of ours: the price is that the name is the link
 * rather than the whole row, the head does not stick, and a narrow window
 * scrolls rather than folding rows into cards. This is read on a desk.
 */
function list(all: Worktree[], shown: Worktree[]): TemplateResult | typeof nothing {
    // The note over the page already says the project cannot be asked; "no
    // worktree yet" under it would be a second answer, and a wrong one.
    if (state.unreachable && all.length === 0) {
        return nothing;
    }
    // A worktree on its way has no directory and so no row; its operation
    // stands in for it, so the list never says "none" while one is being made.
    const pending = pendingCreations(
        state.runningJobs,
        all.map((worktree) => worktree.name),
    ).filter((job) => found(job.subject, needle));
    const empty = needle.trim() === '' ? t('table.empty') : t('overview.noMatch');
    if (!state.loading && shown.length === 0 && pending.length === 0) {
        return html`<p class="branchery-list__empty">${empty}</p>`;
    }

    // What is being made stands first: a row at the end of a long list is one
    // nobody sees arrive.
    return html`
        <sds-table
            ?loading=${state.loading}
            loading-rows=${rowsToExpect()}
            .columns=${[
                { head: t('table.worktree'), cls: 'sds-td-name' },
                { head: t('table.outstanding'), cls: 'sds-td-meta', align: 'end', fit: true },
                { head: t('table.php'), fit: true },
                { head: '', cls: 'sds-td-into' },
            ]}
            .rows=${state.loading ? [] : [...pending.map(making), ...shown.map(row)]}></sds-table>`;
}

/**
 * How long the list was last time, kept in the browser. Without it a page opened
 * cold showed one bar and arrived with a dozen rows, which is not a list
 * settling but a list appearing.
 */
const ROWS_KEY = 'branchery-rows';

function rowsToExpect(): number {
    const known = state.worktrees.length;
    if (known > 0) {
        return known;
    }
    const last = Number(localStorage.getItem(ROWS_KEY));

    return Number.isFinite(last) && last > 0 ? last : 1;
}

function rememberRows(): void {
    localStorage.setItem(ROWS_KEY, String(state.worktrees.length));
}

/**
 * Its name and what is being done, there being no address or database until the
 * operation has got that far. Not a link, either -- the page about it would
 * only say it does not exist.
 */
function making(job: RunningJob): Row {
    return {
        cells: [
            {
                value: html`<span class="branchery-list__title">${job.subject}</span>`,
                note: doing(`${t('table.making')} \u00b7 ${job.step?.label ?? doingWord(job.command)}`),
            },
            '',
            '',
            '',
        ],
    };
}

/** What is being done to a checkout, in the three places that say it. */
function doing(what: string): TemplateResult {
    return html`<span class="branchery-list__meta--busy"><sds-icon
                    class="sds-spinner" name="actions-circle-half" size="em"
                    aria-hidden="true"></sds-icon>${what}</span>`;
}

function row(worktree: Worktree): Row {
    const busy = busyWith(worktree.name);

    return {
        cells: [
            {
                value: html`<a class="branchery-list__title" href="#/w/${worktree.name}">${worktree.name}</a>${
                    busy !== undefined ? nothing : mark(worktree)
                }`,
                // In the place of what was true a moment ago, so the row keeps its height
                // and nothing below it moves.
                note: busy === undefined ? described(worktree) : doing(busy),
            },
            outstanding(worktree),
            worktree.php,
            ways(worktree),
        ],
    };
}

/**
 * The word at the end is the way into the page about the worktree; the site is
 * the glyph beside it, a second way out without a second sentence. Both are
 * presses and not links: the end of a row is where a hand goes looking for
 * something to hit, and what it finds there has an edge.
 */
function ways(worktree: Worktree): TemplateResult {
    return html`
        <span class="branchery-list__ways">
            ${
                /* Named by where it goes: a dozen presses all called "open the site"
                  name nothing to whoever reads the page as a list. */ ''
            }
            <sds-button variant="secondary" size="sm" icon-only
                        href=${worktree.url} rel="external"
                        title=${t('table.openSiteAt', { host: host(worktree.url) })}><sds-icon
                name="actions-window-open" size="16"></sds-icon></sds-button>
            ${saying(
                t('table.view'),
                html`<sds-button variant="secondary" size="sm" href="#/w/${worktree.name}"
                        title=${t('table.viewOf', { name: worktree.name })}>${t('table.view')}</sds-button>`,
            )}
        </span>`;
}

/**
 * One word to the browser, it broke wherever the column ran out. The
 * opportunities are elements and not characters, so what is copied out of the
 * cell is still the name.
 */
function breakable(name: string): TemplateResult[] {
    return name.split('_').map((part, index) => (index === 0 ? html`${part}` : html`_<wbr>${part}`));
}

/**
 * A state and never a count, the numbers having a column of their own. Three
 * questions, each answered at most once -- how the build went, where the branch
 * got to (merged wins over gone, being the more useful), and whether what is
 * installed still matches what is checked out.
 */
function mark(worktree: Worktree): TemplateResult {
    return html`${built(worktree)}${became(worktree)}${
        worktree.stale ? html` <sds-badge label=${t('table.staleMark')} tone="warn"></sds-badge>` : nothing
    }`;
}

function built(worktree: Worktree): TemplateResult | typeof nothing {
    if (!worktree.ready) {
        return html` <sds-badge label=${t('table.unbuilt')} tone="warn"></sds-badge>`;
    }
    if (worktree.incomplete) {
        return html` <sds-badge label=${t('table.unfinished')} tone="warn"></sds-badge>`;
    }

    return nothing;
}

function became(worktree: Worktree): TemplateResult | typeof nothing {
    if (worktree.merged) {
        // The one badge of the set that is not a warning: work that arrived where
        // it was going is the good end of a worktree.
        return html` <sds-badge label=${t('table.mergedMark')} tone="ok"></sds-badge>`;
    }
    if (worktree.gone) {
        return html` <sds-badge label=${t('table.goneMark')} tone="warn"></sds-badge>`;
    }

    return nothing;
}

/**
 * Said once, over the rows it counts. While the list is narrowed the question
 * is how much of it is left to see; where there is nothing to count it is named
 * rather than counted, "0 worktrees" over "No worktree yet" being the same
 * sentence twice.
 */
function listHead(all: Worktree[], shown: number): TemplateResult | typeof nothing {
    // Nothing is drawn under it, so nothing is said over it.
    if (state.unreachable && all.length === 0) {
        return nothing;
    }
    const total = state.worktrees.length;

    // Only this list: the branches have a heading of their own.
    return html`<h2 class="sds-h3">${
        state.loading || total === 0
            ? t('nav.worktrees')
            : needle.trim() === ''
              ? t('overview.worktrees', { count: total })
              : t('overview.matching', { shown, total })
    }</h2>`;
}

/**
 * Over the worktrees rather than among them: it is of another kind -- they are
 * cut from it, and it is the one checkout Branchery neither made nor can
 * remove. Its PHP, database and address are stated as facts, which is worth
 * doing once and was the name written out three times in every row.
 */
function checkout(): TemplateResult | typeof nothing {
    const project = state.project;
    if (project === null) {
        return state.loading ? waitingCheckout() : nothing;
    }
    const busy = busyWith(project.name);

    return checkoutBlock({
        name: html`<a class="branchery-checkout__name"
                      href="#/w/${project.name}">${project.name}</a>${busy !== undefined ? nothing : mark(project)}`,
        meta: busy === undefined ? html`${described(project)}${settlement(project)}` : doing(busy),
        php: project.php,
        database: html`<code class="sds-mono">${breakable(project.database)}</code>`,
        address: html`<sds-link external href=${project.url} label=${host(project.url)}></sds-link>`,
    });
}

/**
 * It stands between the name and the list, so its arrival would push the list
 * down under a reader already looking at it; its shape is fixed, so bars can
 * stand in it.
 */
function waitingCheckout(): TemplateResult {
    return checkoutBlock({
        name: html`<span class="branchery-checkout__name">${bar(0, 'branchery-waiting__title')}</span>`,
        meta: bar(1),
        php: bar(0),
        database: bar(1),
        address: bar(2),
    });
}

interface Checkout {
    name: TemplateResult;
    meta: TemplateResult;
    php: TemplateResult | string;
    database: TemplateResult;
    address: TemplateResult;
}

/**
 * Written once because the shape is the whole point of drawing it twice: kept
 * apart, the two drift the moment a fact is added to one of them.
 */
function checkoutBlock(shown: Checkout): TemplateResult {
    return html`
        <div class="branchery-checkout">
            <p class="sds-label">${t('overview.checkout')}</p>
            <div class="branchery-checkout__body">
                <div class="branchery-checkout__what">
                    ${shown.name}
                    <p class="branchery-checkout__meta">${shown.meta}</p>
                </div>
                <dl class="sds-facts branchery-checkout__facts">
                    <dt>${t('table.php')}</dt>
                    <dd>${shown.php}</dd>
                    <dt>${t('table.database')}</dt>
                    <dd>${shown.database}</dd>
                    <dt>${t('table.address')}</dt>
                    <dd>${shown.address}</dd>
                </dl>
            </div>
        </div>`;
}

/**
 * The freshest first, which is the order git was asked in. Only what the filter
 * leaves standing, and nothing where it leaves none: a section that stayed
 * whole under a search would answer a question nobody asked.
 */
function freeBranches(): TemplateResult | typeof nothing {
    if (state.loading || state.branches.length === 0) {
        return nothing;
    }
    const matched = matchingBranches(state.branches, needle);
    if (matched.length === 0) {
        return nothing;
    }
    const rest = matched.length - BRANCHES_SHOWN;
    const shown = allBranches || rest <= 0 ? matched : matched.slice(0, BRANCHES_SHOWN);

    return html`
        <section class="sds-band branchery-branches">
            <h2 class="sds-h3">${
                needle.trim() === ''
                    ? t('overview.branches', { count: state.branches.length })
                    : t('overview.branchesMatching', { shown: matched.length, total: state.branches.length })
            }</h2>
            <sds-table
                .columns=${[
                    { head: t('table.branch'), cls: 'sds-td-name' },
                    { head: t('table.when'), cls: 'sds-td-meta', fit: true },
                    { head: '', cls: 'sds-td-into' },
                ]}
                .rows=${shown.map(branchRow)}></sds-table>
            ${
                allBranches || rest <= 0
                    ? nothing
                    : html`
                <p class="branchery-branches__more">
                    ${saying(
                        t('overview.showAllBranches', { count: rest }),
                        html`<sds-button variant="ghost" @click=${() => {
                            allBranches = true;
                            again();
                        }}
                        >${t('overview.showAllBranches', { count: rest })}</sds-button>`,
                    )}
                </p>`
            }
        </section>`;
}

/**
 * The press at the end opens the wizard rather than creating anything, a row
 * being no place to answer what the worktree is called and what happens to its
 * database.
 */
function branchRow(branch: Branch): Row {
    return {
        cells: [
            {
                value: html`<a class="branchery-list__title"
                               href="#/b/${encodeURIComponent(branch.name)}">${branch.name}</a>`,
                note: aboutBranch(branch),
            },
            formatWhen(branch.when, state.language),
            html`${saying(
                t('nav.newWorktree'),
                html`<sds-button variant="ghost" size="sm"
                             title=${t('table.worktreeOf', { branch: branch.name })}
                             @click=${() => pressed((handlers) => openCreate(handlers, branch.name))}
                    >${t('nav.newWorktree')}</sds-button>`,
            )}`,
        ],
    };
}

/**
 * Said only where there is a remote for the branch to be missing from: without
 * one it is true of every branch.
 */
function aboutBranch(branch: Branch): TemplateResult {
    const nowhere = !branch.onRemote && state.remotes.length > 0;

    return html`${nowhere ? html`<span>${t('table.nowhere')}</span>` : nothing}${
        branch.tip === null
            ? nothing
            : html`<span
            class="branchery-list__tip">${branch.tip.subject} \u00b7 ${branch.tip.sha}</span>`
    }`;
}

/**
 * Only where there is something to fetch from -- a button that can only fail is
 * worse than none. With one remote the button names it.
 */
function buildFetch(): HTMLElement | null {
    const remotes = state.remotes;
    const first = remotes[0];
    if (first === undefined) {
        return null;
    }

    if (remotes.length === 1) {
        return buildButton(t('nav.fetch', { remote: first }), 'ghost', () =>
            pressed((handlers) => void startFetch(first, handlers)),
        );
    }

    const dropdown = document.createElement('sds-dropdown') as SdsDropdown;
    dropdown.label = t('nav.fetchFrom');
    dropdown.variant = 'ghost';
    // So the list opens back over the row instead of out of the page.
    dropdown.align = 'end';
    dropdown.choices = remotes.map((remote) => ({ label: remote }));
    dropdown.addEventListener('sds-dropdown-choose', (event) => {
        const remote = remotes[(event as CustomEvent<DropdownChosen>).detail.index];
        if (remote !== undefined) {
            pressed((handlers) => void startFetch(remote, handlers));
        }
    });

    return dropdown;
}

async function startFetch(remote: string, handlers: OverviewHandlers): Promise<void> {
    try {
        const result = await api.fetch(remote);
        setError('');
        handlers.onJob(result.job, null, 'fetch');
    } catch (error) {
        reportError(error);
    }
}

/**
 * One line, cut off rather than wrapped -- five clauses joined by dots came to
 * four lines in every row. The subject is what a graph puts at every tip:
 * "[TASK] Register the event listeners by attribute" names a piece of work
 * faster than task/cleanup-and-docs does. Without its hash, which is a thing to
 * copy and not to scan.
 */
function described(worktree: Worktree): TemplateResult {
    return html`<span class="branchery-list__what">${worktree.branch}${
        worktree.tip === null ? nothing : html` \u00b7 ${worktree.tip.subject}`
    }</span>`;
}

/**
 * Three counts of the same kind -- work that is somewhere it will not stay --
 * which is one movement of the eye rather than eleven sentences read to the
 * end. A quiet row says nothing: a dash in each is a column of dashes.
 */
function outstanding(worktree: Worktree): TemplateResult | string {
    const said = unsettled(worktree);

    return said.length === 0
        ? ''
        : html`${said.map((line) => html`<span class="branchery-list__count">${line}</span>`)}`;
}

/** The same counts where there is no column to hold them, joined into a line. */
function settlement(worktree: Worktree): TemplateResult | typeof nothing {
    const said = unsettled(worktree);

    return said.length === 0 ? nothing : html`<span class="branchery-list__count">${said.join(' · ')}</span>`;
}

function unsettled(worktree: Worktree): string[] {
    const said = [];
    if (worktree.changes > 0) {
        said.push(t('table.changes', { count: worktree.changes }));
    }
    if (worktree.ahead !== null && worktree.ahead > 0) {
        said.push(t('table.unpushed', { count: worktree.ahead }));
    }
    if (worktree.behind !== null && worktree.behind > 0) {
        said.push(t('table.behind', { count: worktree.behind }));
    }

    return said;
}

/**
 * "/" to look for a worktree, "n" to make one. Ignored wherever a key already
 * means something else -- in a field, in the dialog, and under any modifier.
 */
window.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) {
        return;
    }
    // Asked of an Element and not of whatever the event came from: with
    // nothing focused it is the document, which answers no such question and
    // threw, leaving both keys doing nothing.
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, [contenteditable], dialog[open]')) {
        return;
    }

    if (event.key === '/') {
        const input = maybe<HTMLInputElement>('#filter');
        if (input) {
            event.preventDefault();
            input.focus();
            input.select();
        }

        return;
    }

    // Only where the page actually offers it.
    if (event.key === 'n' && current !== null && maybe('.branchery-section-actions') !== null) {
        event.preventDefault();
        openCreate(current);
    }
});
