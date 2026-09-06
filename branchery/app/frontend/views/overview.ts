/** Overview of all worktrees of the project. */

import { api } from '../api.js';
import { html, nothing, type TemplateResult } from 'lit';
import { buildButton, buildWayOut, formatWhen, maybe, repositoryName, saying } from '../dom.js';
import { busyWith, reportError, setError, state, t } from '../state.js';
import { pendingCreations } from '../rules/pending.js';
import type { DropdownChosen, Row, SdsDropdown } from '@typo3/soul-frontend';
import { found, matching, matchingBranches } from '../rules/filter.js';
import { byBase } from '../rules/lineage.js';
import { keep, recall } from '../kept.js';
import type { Branch, JobHandlers, Worktree } from '../types.js';
import { go } from '../router.js';
import { openCreate } from './create.js';
import { finished } from '../rules/finished.js';
import { bar } from './waiting.js';
import { openTidy } from './tidy.js';
import { View } from './view.js';
import { aboutBranch, checkout, making, row } from './rows.js';
import { heading, listing, type ListState } from '../rules/listing.js';

export type OverviewHandlers = JobHandlers;

/** From how many rows the page is filtered rather than read. Branches count towards it. */
const FILTER_FROM = 6;

/**
 * How many branches without a worktree are shown before the rest are one press
 * away. A repository has hundreds, and the freshest are the ones somebody is
 * about to want; the field searches all of them either way.
 */
const BRANCHES_SHOWN = 10;

/**
 * The worktrees of the project, and the branches none has been made of yet.
 *
 * What it keeps is what a reader is in the middle of -- what they have typed
 * into the filter, whether they asked for every branch -- and it is kept on the
 * element rather than in the module because the list is drawn again whenever an
 * operation ends or a language changes. A filter that emptied itself then would
 * put the reader back in front of all forty rows.
 */
export class OverviewView extends View {
    /** Set by the shell, which is what a press here reaches an operation through. */
    handlers!: OverviewHandlers;

    private needle = '';

    private allBranches = false;

    override willUpdate(): void {
        // Not while the answer is still on its way: a length read then is the
        // length of nothing, and the next cold page would expect one row.
        if (!state.loading) {
            rememberRows();
        }
    }

    protected override arrived(): void {
        window.addEventListener('keydown', this.reachedByKey);
        this.untilLeft(() => window.removeEventListener('keydown', this.reachedByKey));
    }

    /** What both questions about the list are answered out of -- see listing.ts. */
    private listState(all: Worktree[], shown: number, pending: number): ListState {
        return {
            unreachable: state.unreachable,
            loading: state.loading,
            entries: all.length,
            total: state.worktrees.length,
            shown,
            pending,
            filtered: this.needle.trim() !== '',
        };
    }

    override render(): TemplateResult {
        const all = entries();
        // Under the branch they were cut from -- what a graph does with lanes, and
        // what a table can do with order.
        const shown = byBase(matching(state.worktrees, this.needle), state.project?.branch ?? state.branch);

        return html`
      <div class="sds-bands">
        <section class="sds-band">
            ${state.error === '' ? nothing : html`<sds-note tone="error" body=${state.error}></sds-note>`}
            ${unfinishedNote(all)}
            ${this.tidyNote(all)}
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
                ${all.length + state.branches.length >= FILTER_FROM ? this.field() : nothing}
                <div class="branchery-section-actions">${this.actions()}</div>
            </div>
            ${this.listHead(all, shown.length)}
            ${this.list(all, shown)}
        </section>
        ${this.freeBranches()}
      </div>`;
    }

    /**
     * Over the list and not in it: it is about the list as a whole, and a row
     * suggesting its own removal is an offer where the reader is scanning for
     * something else.
     */
    private tidyNote(all: Worktree[]): TemplateResult | typeof nothing {
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
                  @sds-note-action=${() => openTidy(all, this.handlers)}></sds-note>`;
    }

    /** Its shortcut is written into it: one nobody is told about is one nobody uses. */
    private field(): TemplateResult {
        // The element states one value, its placeholder until somebody types.
        // Drawn again on every keystroke, so the prompt comes back when it empties.
        return html`
        <sds-field
            class="branchery-filter"
            field-id="filter"
            icon="actions-search"
            suffix="/"
            label=${t('overview.filter')}
            value=${this.needle === '' ? t('overview.filterPlaceholder') : this.needle}
            ?filled=${this.needle !== ''}
            @sds-input=${(event: CustomEvent<string>) => this.narrow(event.detail)}
            @keydown=${(event: KeyboardEvent) => this.leaveOrOpen(event)}></sds-field>`;
    }

    private narrow(value: string): void {
        this.needle = value;
        this.requestUpdate();
    }

    private leaveOrOpen(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            if (event.target instanceof HTMLElement) {
                event.target.blur();
            }
            this.narrow('');

            return;
        }

        // Type a few letters, press return, be there -- without taking a hand off
        // the keyboard to point at the one row that is left.
        if (event.key === 'Enter') {
            // The project's own checkout only where the list has nothing: it stands
            // over the field rather than in what it narrows.
            const first =
                matching(state.worktrees, this.needle)[0] ??
                matching(state.project === null ? [] : [state.project], this.needle)[0];
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
    private controls: { key: string; nodes: HTMLElement[] } | null = null;

    private actions(): HTMLElement[] {
        const key = JSON.stringify([state.remotes, state.language]);
        if (this.controls?.key !== key) {
            const fetching = this.buildFetch();
            this.controls = { key, nodes: [...(fetching === null ? [] : [fetching]), this.creating()] };
        }

        return this.controls.nodes;
    }

    private creating(): HTMLElement {
        const button = buildButton(t('nav.newWorktree'), 'primary', () => openCreate(this.handlers));
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
    private list(all: Worktree[], shown: Worktree[]): TemplateResult | typeof nothing {
        // A worktree on its way has no directory and so no row; its operation
        // stands in for it, so the list never says "none" while one is being made.
        const pending = pendingCreations(
            state.runningJobs,
            all.map((worktree) => worktree.name),
        ).filter((job) => found(job.subject, this.needle));

        const said = listing(this.listState(all, shown.length, pending.length));
        if (said.shown === 'nothing') {
            return nothing;
        }
        if (said.shown === 'empty') {
            return html`<p class="branchery-list__empty">${t(
                said.because === 'noMatch' ? 'overview.noMatch' : 'table.empty',
            )}</p>`;
        }
        const waiting = said.shown === 'waiting';

        // What is being made stands first: a row at the end of a long list is one
        // nobody sees arrive.
        return html`
        <sds-table
            ?loading=${waiting}
            loading-rows=${rowsToExpect()}
            .columns=${[
                { head: t('table.worktree'), cls: 'sds-td-name' },
                { head: t('table.outstanding'), cls: 'sds-td-meta', align: 'end', fit: true },
                { head: t('table.php'), fit: true },
                { head: '', cls: 'sds-td-into' },
            ]}
            .rows=${waiting ? [] : [...pending.map(making), ...shown.map(row)]}></sds-table>`;
    }

    /**
     * Said once, over the rows it counts. While the list is narrowed the question
     * is how much of it is left to see; where there is nothing to count it is named
     * rather than counted, "0 worktrees" over "No worktree yet" being the same
     * sentence twice.
     */
    private listHead(all: Worktree[], shown: number): TemplateResult | typeof nothing {
        const said = heading(this.listState(all, shown, 0));

        // Only this list: the branches have a heading of their own.
        return said === null ? nothing : html`<h2 class="sds-h3">${t(said.key, said.params)}</h2>`;
    }

    /**
     * The freshest first, which is the order git was asked in. Only what the filter
     * leaves standing, and nothing where it leaves none: a section that stayed
     * whole under a search would answer a question nobody asked.
     */
    private freeBranches(): TemplateResult | typeof nothing {
        if (state.loading || state.branches.length === 0) {
            return nothing;
        }
        const matched = matchingBranches(state.branches, this.needle);
        if (matched.length === 0) {
            return nothing;
        }
        const rest = matched.length - BRANCHES_SHOWN;
        const shown = this.allBranches || rest <= 0 ? matched : matched.slice(0, BRANCHES_SHOWN);

        return html`
        <section class="sds-band branchery-branches">
            <h2 class="sds-h3">${
                this.needle.trim() === ''
                    ? t('overview.branches', { count: state.branches.length })
                    : t('overview.branchesMatching', { shown: matched.length, total: state.branches.length })
            }</h2>
            <sds-table
                .columns=${[
                    { head: t('table.branch'), cls: 'sds-td-name' },
                    { head: t('table.when'), cls: 'sds-td-meta', fit: true },
                    { head: '', cls: 'sds-td-into' },
                ]}
                .rows=${shown.map((branch) => this.branchRow(branch))}></sds-table>
            ${
                this.allBranches || rest <= 0
                    ? nothing
                    : html`
                <p class="branchery-branches__more">
                    ${saying(
                        t('overview.showAllBranches', { count: rest }),
                        html`<sds-button variant="ghost" @click=${() => {
                            this.allBranches = true;
                            this.requestUpdate();
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
    private branchRow(branch: Branch): Row {
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
                             @click=${() => openCreate(this.handlers, branch.name)}
                    >${t('nav.newWorktree')}</sds-button>`,
                )}`,
            ],
        };
    }

    /**
     * Only where there is something to fetch from -- a button that can only fail is
     * worse than none. With one remote the button names it.
     */
    private buildFetch(): HTMLElement | null {
        const remotes = state.remotes;
        const first = remotes[0];
        if (first === undefined) {
            return null;
        }

        if (remotes.length === 1) {
            return buildButton(t('nav.fetch', { remote: first }), 'ghost', () => void this.startFetch(first));
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
                void this.startFetch(remote);
            }
        });

        return dropdown;
    }

    private async startFetch(remote: string): Promise<void> {
        try {
            const result = await api.fetch(remote);
            setError('');
            this.handlers.onJob(result.job, null, 'fetch');
        } catch (error) {
            reportError(error);
        }
    }

    /**
     * "/" to look for a worktree, "n" to make one. Ignored wherever a key already
     * means something else -- in a field, in the dialog, and under any modifier.
     *
     * Bound to the instance, so the same function is the one taken off the window
     * when this page is left -- and heard only while it is on screen, which is
     * what the page being an element is worth here.
     */
    private readonly reachedByKey = (event: KeyboardEvent): void => {
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
        if (event.key === 'n' && maybe('.branchery-section-actions') !== null) {
            event.preventDefault();
            openCreate(this.handlers);
        }
    };
}

customElements.define('branchery-overview', OverviewView);

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
    const last = Number(recall(ROWS_KEY));

    return Number.isFinite(last) && last > 0 ? last : 1;
}

function rememberRows(): void {
    keep(ROWS_KEY, String(state.worktrees.length));
}
