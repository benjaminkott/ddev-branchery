/**
 * One worktree, in full: what it is, what can be done to it, and what has been
 * done to it. It has an address of its own -- #/w/<name> -- so it can be sent
 * to somebody and come back to with the browser's own back button.
 *
 * The page is a template and nothing here reaches into what it drew. What is
 * fetched afterwards is kept on the element and the page drawn again; the parts
 * that did not change are left standing, which is what keeps an opened entry
 * open.
 */

import { html, nothing, type TemplateResult } from 'lit';
import type { SdsButton } from '@typo3/soul-frontend';
import { api } from '../api.js';
import { buildButton, buildWayOut, saying } from '../dom.js';
import { reader } from '../rules/reading.js';
import { busyWith, errorSentence, state, t } from '../state.js';
import { aside, readInto } from '../rules/aside.js';
import { onOperationEnded } from '../ended.js';
import { type Action, actions, type Offer } from '../rules/actions.js';
import type { Change, ChangeDiff, DiskUsage, JobHandlers, Worktree } from '../types.js';
import { openEdit } from './edit.js';
import { backTo } from './back.js';
import { commitLog } from './commits.js';
import { shownGroup } from './facts.js';
import { summaryFacts } from './summary.js';
import { closeChanges, onChangesClose, showChanges, shownChanges } from './changes.js';
import { discard, provision, pull, remove, restore, sync } from './operations.js';
import { fileList, keepDiff, type Shown, toggleFile } from './files.js';
import { openProvision } from './provision.js';
import { waiting } from './waiting.js';
import { pastOf } from './history.js';
import { View } from './view.js';

export type WorktreeHandlers = JobHandlers;

/** What is read when asked for, and kept until the reader leaves the page. */
interface Files {
    name: string;
    list: Shown<Change[]>;
    all: boolean;
    diffs: Map<string, Shown<ChangeDiff>>;
}

function fresh(name: string): Files {
    return { name, list: { read: null, trouble: '', open: false }, all: false, diffs: new Map() };
}

export class WorktreeView extends View {
    /** Which worktree this page is about, out of the address. */
    name = '';

    /** Set by the shell, which is what a press here reaches an operation through. */
    handlers!: WorktreeHandlers;

    /** The checkout and database are measured only for the detail page that asks. */
    private readonly usage = aside<DiskUsage>();

    /**
     * Read when asked for and not with the page: a count in the row is what every
     * visit wants, and the paths behind it are a container call the reader asks
     * for by pressing.
     */
    private files: Files = fresh('');

    private readonly reading = reader(errorSentence, () => this.requestUpdate());

    /**
     * Read beside the page like its history: the log is a container call of its
     * own and only the page about one worktree ever wants it.
     */
    private readonly log = commitLog(
        (name, skip) => api.commits(name, skip),
        this.reading,
        () => this.requestUpdate(),
    );

    /** What has been done to this worktree, and what each of those said. */
    private readonly past = pastOf(
        (name) => api.worktreeJobs(name),
        (id) => api.job(id),
        this.reading,
        () => this.requestUpdate(),
    );

    private bar: { key: string; doing: SdsButton[]; undoing: SdsButton[]; held: Set<SdsButton> } | null = null;

    protected override arrived(): void {
        // The dialog is the reader's to close. What it leaves behind is the page's
        // business: the flag that puts it back on the screen at the next draw.
        this.untilLeft(
            onChangesClose(() => {
                this.files.list.open = false;
                this.requestUpdate();
            }),
        );
        this.untilLeft(onOperationEnded((subject) => this.operationEnded(subject)));
    }

    /**
     * Before anything else: a dialog standing over the page the reader left is a
     * dialog about a worktree they are no longer on. Everything else this page
     * held went out of the document with it.
     */
    protected override left(): void {
        closeChanges();
    }

    /**
     * An operation on the worktree ended: its history has one entry more, and
     * after a discard or a pull its branch carries other commits than the list
     * shows.
     */
    private operationEnded(name: string): void {
        this.past.forget(name);
        this.log.forget(name);
        if (this.files.name === name) {
            // What the operation did is what is uncommitted now. Where the list is on
            // screen it is asked for again rather than dropped: a dialog emptied under
            // the reader says the worktree has nothing when nobody has looked yet.
            const open = shownChanges() === name;
            this.files = fresh(open ? name : '');
            if (open) {
                this.files.list.open = true;
                void this.readChanges(name);
            }
        }
        this.usage.forget(name);
        if (this.name === name) {
            this.requestUpdate();
        }
    }

    private get worktree(): Worktree | null {
        return [state.project, ...state.worktrees].find((entry) => entry?.name === this.name) ?? null;
    }

    /**
     * What this page reads beside itself, asked for as soon as it is known which
     * worktree it is about -- which is here rather than on arriving, because the
     * address can change under an element that stays.
     */
    override willUpdate(): void {
        const name = this.name;
        const worktree = this.worktree;

        this.past.about(name);
        // A build that stopped is explained by the operation that stopped it, so
        // that one is read as soon as the history says which it is -- the note over
        // the page said something was missing and nothing about what.
        const failed = worktree?.incomplete === true ? this.past.lastFailed(name) : null;
        if (failed !== null && !this.past.holds(failed.id)) {
            this.past.read(failed.id);
        }
        // Only once there is a worktree to read it about: a page opened straight at
        // an address is drawn before the answer arrives, and marking it read then
        // would mean never reading it at all.
        if (worktree !== null) {
            this.log.about(name);
        }
        if (worktree !== null && !worktree.isProject && this.usage.about(name)) {
            void this.readUsage(name);
        }
    }

    override render(): TemplateResult {
        const worktree = this.worktree;

        return worktree === null ? missing(this.name) : this.page(worktree);
    }

    /**
     * What is uncommitted stands over the page rather than in it, so it is put up
     * after the page is drawn and out of the same state.
     */
    override updated(): void {
        if (this.files.name === this.name && this.files.list.open) {
            showChanges(this.name, t('table.uncommitted'), this.changeList(this.name));
        }
    }

    /**
     * Bands down the page and nothing of our own holding them: the head, what the
     * worktree stands at, what is settled about it, what is on its branch, and what
     * has been done to it. The quiet ones alternate, which is what tells a reader
     * where one subject ends without a rule being drawn.
     */
    private page(worktree: Worktree): TemplateResult {
        const busy = busyWith(worktree.name);

        return html`
      <div class="sds-bands">
        <section class="sds-band">
            ${state.error === '' ? nothing : html`<sds-note tone="error" body=${state.error}></sds-note>`}
            ${backTo(t('detail.back'), '#/')}
            ${
                /* The name, and at the far end of its line the doors into the running
                  site: a reader who came to look at the thing itself came for those. */ ''
            }
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${worktree.name}</span>
                    ${
                        worktree.ready
                            ? worktree.incomplete
                                ? html`<sds-badge label=${t('table.unfinished')} tone="warn"></sds-badge>`
                                : nothing
                            : html`<sds-badge label=${t('table.unbuilt')} tone="warn"></sds-badge>`
                    }
                </h1>
                <span class="sds-row sds-row__end">
                    ${away(worktree.url, t('table.openSite'))}
                    ${away(worktree.backend, t('detail.backend'))}
                    ${
                        /* On the project and not on every worktree: the remote is the same
                          for all of them, and a link that says the same thing on twelve
                          pages is read on none. */
                        worktree.isProject ? away(state.repository, t('detail.repository')) : nothing
                    }
                    ${away(worktree.review, t('detail.review'))}
                    ${away(
                        worktree.issue,
                        worktree.issueId === null
                            ? t('detail.issue')
                            : t('detail.issueNumber', { id: worktree.issueId }),
                    )}
                </span>
            </div>
            ${
                /* What can be done, in the row under the name -- the one row on the
                  page that needs no heading to say what it is. */
                worktree.isProject ? nothing : this.actionBar(worktree, busy !== undefined)
            }
            ${
                /* Something is being done to it: the row in the list said so and
                  this page said nothing, so every press here was live and every one
                  refused. It takes the place of the note that asks for a press. */
                busy !== undefined ? busyNote(busy) : nothing
            }
            ${
                /* First of the two, because it is the older trouble: a worktree
                  whose build never finished has nothing to be behind. */
                worktree.incomplete && busy === undefined ? this.unfinishedNote(worktree) : nothing
            }
            ${
                /* A state that asks for something carries the press that answers it:
                  as a mark beside the name it would be a fact the reader has to match
                  against five buttons themselves. */
                worktree.stale && busy === undefined ? this.staleNote(worktree) : nothing
            }
        </section>

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${t('detail.settled')}</h2>
            <div class="sds-facts-set">${summaryFacts(worktree, {
                value: this.usage.of(worktree.name),
                trouble: this.usage.trouble(worktree.name),
            }).map(shownGroup)}</div>
        </section>

        ${this.commitList(worktree)}

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${t('detail.history')}</h2>
            ${this.past.draw(worktree.name)}
        </section>
      </div>`;
    }

    /**
     * What is on this branch, newest first. "1 unpushed" is a count, and a count is
     * the one thing nobody can act on: it takes the subject to know whether that
     * commit is a fix worth pushing or the leftover of an afternoon.
     *
     * A block of its own and not a line among the facts, which stand in two narrow
     * columns where a commit subject is an ellipsis with a date after it. What the
     * remote has not is marked: that is the part the press beside it would drop.
     */
    private commitList(worktree: Worktree): TemplateResult | typeof nothing {
        const read = this.log.of(worktree.name);
        const trouble = this.log.trouble(worktree.name);
        if (trouble !== '') {
            // A list that could not be read is not an empty list: silently absent, the
            // block said the branch carried nothing.
            return html`
            <section class="sds-band">
                <h2 class="sds-h3">${t('detail.commitsHeading')}</h2>
                <sds-note tone="warn" body=${trouble}></sds-note>
            </section>`;
        }
        if (read !== null && read.commits.length === 0 && worktree.changes === 0) {
            return nothing;
        }

        // Before the answer, the band is its own shape: the heading, what is
        // uncommitted, and the table's head over bars at the height its rows will
        // have. What it costs is a branch with no commits at all, where the band
        // stands for a moment and then goes.
        return html`
        <section class="sds-band">
            <h2 class="sds-h3">${t('detail.commitsHeading')}</h2>
            ${
                /* What the worktree has and has not put anywhere yet, first: the one
                  line of this band about now rather than about what is behind. As the
                  top row of the table, its files opened ten commits further down --
                  a press whose answer appeared out of sight. */
                worktree.changes === 0
                    ? nothing
                    : html`
                <p class="branchery-uncommitted">
                    <strong>${t('table.uncommitted')}
                        <span class="sds-warn">${t('table.files', { count: worktree.changes })}</span></strong>
                    ${this.showFiles(worktree.name)}
                </p>`
            }
            ${this.log.body(worktree.name, (sha) => `#/w/${encodeURIComponent(worktree.name)}/c/${sha}`)}
        </section>`;
    }

    /**
     * A press and not a link: the list is read from the container when asked for,
     * and the line it hangs under keeps saying what it said.
     */
    private showFiles(name: string): TemplateResult {
        return html` ${saying(
            t('detail.showFiles'),
            html`<sds-button variant="ghost" @click=${() => this.openFiles(name)}>${t('detail.showFiles')}</sds-button>`,
        )}`;
    }

    private openFiles(name: string): void {
        if (this.files.name !== name) {
            this.files = fresh(name);
        }
        this.files.list.open = true;
        if (this.files.list.read === null) {
            void this.readChanges(name);
        }
        this.requestUpdate();
    }

    private toggleDiff(name: string, path: string): void {
        if (this.files.name !== name) {
            return;
        }
        toggleFile(this.files.diffs, path, () => void this.readDiff(name, path));
        this.requestUpdate();
    }

    /**
     * On a surface of its own and not under the heading it hangs from: a dozen
     * paths, any of which opens a diff, pushed the history off the bottom of the
     * page. The change itself is the system's own element for one.
     */
    private changeList(name: string): TemplateResult {
        const list = this.files.list;
        if (list.trouble !== '') {
            return html`<sds-note tone="warn" body=${`${t('detail.changesFailed')} ${list.trouble}`}></sds-note>`;
        }
        if (list.read === null) {
            return waiting();
        }

        return fileList({
            files: list.read,
            diffs: this.files.diffs,
            press: (path) => this.toggleDiff(name, path),
            all: this.files.all,
            showAll: () => {
                this.files.all = true;
                this.requestUpdate();
            },
        });
    }

    private async readChanges(name: string): Promise<void> {
        await this.reading(
            async () => (await api.changes(name)).changes,
            () => this.files.name === name,
            (read, trouble) => {
                this.files.list = { ...this.files.list, read, trouble };
            },
        );
    }

    private async readDiff(name: string, path: string): Promise<void> {
        await this.reading(
            () => api.changeDiff(name, path),
            // The file has to be open still, and not only the worktree: what was asked
            // for is the change in one row of a list the reader closed.
            () => this.files.name === name && this.files.diffs.has(path),
            (read, trouble) => keepDiff(this.files.diffs, path, read, trouble),
        );
    }

    /**
     * A build is made from a commit and the checkout goes on past it: what the
     * addresses serve is then older than what is checked out, and nothing on the
     * outside shows it -- it is found out through an error that makes no sense.
     * It carries the press that answers it.
     */
    private staleNote(worktree: Worktree): TemplateResult {
        return html`
        <sds-note
            tone="warn"
            heading=${t('detail.staleHeading')}
            body=${t('detail.stale')}
            action=${t('table.provision')}
            @sds-note-action=${() =>
                openProvision(worktree, (fresh) => provision(worktree.name, fresh, this.handlers))}></sds-note>`;
    }

    /**
     * The one state nothing else shows: the dependencies are there, the address
     * answers, the database exists, and somewhere after that the build stopped. It
     * carries the press that finishes it.
     */
    private unfinishedNote(worktree: Worktree): TemplateResult {
        const failed = this.past.lastFailed(worktree.name);
        const stopped = failed === null ? null : this.past.stoppedIn(failed.id);

        return html`
        <sds-note
            tone="warn"
            heading=${t('detail.unfinishedHeading')}
            body=${
                stopped === null
                    ? t('detail.unfinished')
                    : t('detail.unfinishedAt', { no: stopped.no, step: stopped.step, reason: stopped.reason })
            }
            action=${t('table.provision')}
            @sds-note-action=${() =>
                openProvision(worktree, (fresh) => provision(worktree.name, fresh, this.handlers))}></sds-note>`;
    }

    /**
     * One row and no names over it: drawn as controls the presses are findable by
     * being controls, and every one already says what it acts on. What takes
     * something away is `danger` at the far end -- nothing a hand should land on
     * while reaching for what is beside it.
     *
     * Bringing the branch up to date is offered only where there is somewhere to
     * bring it from; the way back stands in its place while the checkout is on
     * something else.
     */
    private actionBar(worktree: Worktree, busy: boolean): TemplateResult {
        // Built by hand, so kept: an element built anew on every draw is one the
        // renderer swaps out, and the button under the pointer went away whenever
        // an answer or a poll redrew the page.
        const key = JSON.stringify([worktree, state.language]);
        if (this.bar?.key !== key) {
            this.bar = { key, ...this.buildBar(worktree) };
        }
        // Nothing is live while something is being done to it. And what the
        // container refuses on its own grounds is not offered as if it were not --
        // the reason stands on the button.
        for (const button of [...this.bar.doing, ...this.bar.undoing]) {
            button.disabled = busy || this.bar.held.has(button);
        }
        const { doing, undoing } = this.bar;

        return html`
        <section class="sds-actions">
            ${
                /* A reader who is told the page rather than shown it gets nothing from
                  "button, button", which is why the name is said and not drawn. */ ''
            }
            <h2 class="sds-said-only">${t('detail.actions')}</h2>
            ${doing}
            ${/* What cannot be taken back goes to the far end of the row. */ ''}
            <span class="sds-row sds-row__end">${undoing}</span>
        </section>`;
    }

    /**
     * Which of them are offered and which are held is a decision, and it is
     * offered() that makes it -- see there. What is left here is what each of
     * them is as a control: the word on it, its weight, and what it sets going.
     */
    private buildBar(worktree: Worktree): { doing: SdsButton[]; undoing: SdsButton[]; held: Set<SdsButton> } {
        const held = new Set<SdsButton>();
        const make = (offer: Offer): SdsButton => {
            const button = this.pressFor(offer.action, worktree);
            if (offer.held !== null) {
                // What the container refuses on its own grounds is not offered as if
                // it were not -- the reason stands on the button.
                held.add(button);
                button.title = t(offer.held);
            }

            return button;
        };
        const plan = actions(worktree);

        return { doing: plan.doing.map(make), undoing: plan.undoing.map(make), held };
    }

    private pressFor(action: Action, worktree: Worktree): SdsButton {
        const handlers = this.handlers;
        switch (action) {
            case 'restore':
                return buildButton(
                    t('table.restore', { branch: worktree.madeFor ?? '' }),
                    'secondary',
                    () => void restore(worktree, handlers),
                );
            case 'pull':
                return buildButton(t('table.pull'), 'secondary', () => void pull(worktree, handlers));
            case 'edit':
                return buildButton(t('table.edit'), 'secondary', () => openEdit(worktree));
            case 'sync':
                return buildButton(t('table.sync'), 'secondary', () => void sync(worktree, handlers));
            case 'provision':
                return buildButton(t('table.provision'), 'secondary', () =>
                    openProvision(worktree, (fresh) => provision(worktree.name, fresh, handlers)),
                );
            case 'discard':
                return buildButton(
                    t('table.discard'),
                    'danger',
                    () => void discard(worktree, handlers, this.log.of(worktree.name)),
                );
            case 'remove':
                return buildButton(t('table.remove'), 'danger', () => void remove(worktree, handlers));
        }
    }

    private async readUsage(name: string): Promise<void> {
        await readInto(this.usage, name, () => api.worktreeUsage(name), this.reading);
    }
}

customElements.define('branchery-worktree', WorktreeView);

/**
 * Not there, or not read yet. A page opened straight at a worktree is drawn
 * before the answer about the project arrives, and "there is no such worktree"
 * about one being fetched is a lie the reader remembers.
 *
 * What is drawn instead is the head of the page it is going to be: the way
 * back, and the name, which is in the address and true before anything is read.
 */
function missing(name: string): TemplateResult {
    if (!state.loading && !state.unreachable) {
        return html`
          <div class="sds-page">
            <sds-note tone="warn" body=${t('detail.gone', { name })}></sds-note>
            ${backTo(t('detail.back'), '#/')}
          </div>`;
    }

    return html`
      <div class="sds-bands">
        <section class="sds-band">
            ${backTo(t('detail.back'), '#/')}
            <div class="sds-row">
                <h1 class="sds-h2"><span class="sds-mono">${name}</span></h1>
            </div>
            ${waiting()}
        </section>
      </div>`;
}

/**
 * The running site, its editing interface, the repository, the review, the
 * issue: places one goes, as against the row under them, which is what one does
 * to the worktree. Drawn only where there is somewhere to lead.
 */
function away(url: string | null, label: string): TemplateResult | typeof nothing {
    return url === null ? nothing : html`${buildWayOut(url, label)}`;
}

/** What is being done to it, in the place of what could be done. */
function busyNote(doing: string): TemplateResult {
    return html`
        <sds-note
            tone="info"
            heading=${t('detail.busyHeading')}
            body=${t('detail.busy', { doing })}></sds-note>`;
}
