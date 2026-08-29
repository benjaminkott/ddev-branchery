/**
 * One worktree, in full: what it is, what can be done to it, and what has been
 * done to it. It has an address of its own -- #/w/<name> -- so it can be sent
 * to somebody and come back to with the browser's own back button.
 *
 * The page is a template and nothing here reaches into what it drew. What is
 * fetched afterwards is kept here and the page drawn again; the parts that did
 * not change are left standing, which is what keeps an opened entry open.
 */

import { html, nothing, render, type TemplateResult } from 'lit';
import type { RunStep, SdsButton } from '@typo3/soul-frontend';
import { api } from '../api.js';
import { buildButton, buildWayOut, formatDuration, formatWhen, query, runSteps, saying } from '../dom.js';
import { reader } from '../reading.js';
import { currentRoute } from '../router.js';
import { stillOn } from '../routes.js';
import { busyWith, errorSentence, operationName, state, stateWords, t } from '../state.js';
import { whyItStopped } from '../verdict.js';
import type { Change, ChangeDiff, Job, JobHandlers, JobSummary, Worktree } from '../types.js';
import { openEdit } from './edit.js';
import { backTo } from './back.js';
import { commitLog } from './commits.js';
import { shownGroup } from './facts.js';
import { settledFacts, type Usage, wandered } from './settled.js';
import { closeChanges, onChangesClose, showChanges, shownChanges } from './changes.js';
import { discard, provision, pull, remove, restore, sync } from './operations.js';
import { fileList, keepDiff, type Shown, toggleFile } from './files.js';
import { openProvision } from './provision.js';
import { waiting } from './waiting.js';

export type WorktreeHandlers = JobHandlers;

/**
 * Read once per worktree and kept until another is opened, or until an
 * operation on this one ends -- see forget().
 */
let past: { name: string; entries: JobSummary[] | null; trouble: string } = { name: '', entries: null, trouble: '' };

/**
 * The steps of opened entries, by operation, or why there are none. An answer
 * saying the log is gone is final; a read that failed is asked again at the
 * next press, the container possibly being back by then.
 */
const opened = new Map<string, { steps: RunStep[]; trouble: string; settled: boolean; stopped: Stopped | null }>();

/**
 * The operations whose log is on its way. Every draw asked for the last failed
 * operation's log again until the first answer was here.
 */
const askingFor = new Set<string>();

/** Where a failed operation stopped: the step, and the line the console marked. */
interface Stopped {
    no: number;
    step: string;
    reason: string;
}

const reading = reader(errorSentence, again);

/**
 * Read beside the page like its history: the log is a container call of its own
 * and only the page about one worktree ever wants it.
 */
const log = commitLog((name, skip) => api.commits(name, skip), reading, again);

/**
 * Read when asked for and not with the page: a count in the row is what every
 * visit wants, and the paths behind it are a container call the reader asks for
 * by pressing. Kept until the worktree is left or an operation on it ends.
 */
let files: { name: string; list: Shown<Change[]>; all: boolean; diffs: Map<string, Shown<ChangeDiff>> } = fresh('');

/** The checkout and database are measured only for the detail page that asks. */
let usage: Usage = { name: '', value: null, trouble: '' };

function fresh(name: string): typeof files {
    return { name, list: { read: null, trouble: '', open: false }, all: false, diffs: new Map() };
}

/** The page on screen, so that what arrives late can draw it again. */
let showing: { name: string; handlers: WorktreeHandlers } | null = null;

/**
 * The reader has gone somewhere else: an answer still on its way is dropped,
 * since drawing it would put this page back over the one they went to.
 */
export function leaveWorktree(): void {
    showing = null;
    // Before anything else: a dialog standing over the page the reader left is
    // a dialog about a worktree they are no longer on.
    closeChanges();
}

function onPage(name: string): boolean {
    return showing?.name === name && stillOn(currentRoute(), { view: 'worktree', name });
}

/**
 * An operation on the worktree ended: its history has one entry more, and after
 * a discard or a pull its branch carries other commits than the list shows.
 */
export function forget(name: string): void {
    if (past.name === name) {
        past = { name: '', entries: null, trouble: '' };
        opened.clear();
    }
    log.forget(name);
    if (files.name === name) {
        // What the operation did is what is uncommitted now. Where the list is on
        // screen it is asked for again rather than dropped: a dialog emptied under
        // the reader says the worktree has nothing when nobody has looked yet.
        const open = shownChanges() === name;
        files = fresh(open ? name : '');
        if (open) {
            files.list.open = true;
            void readChanges(name);
        }
    }
    if (usage.name === name) {
        usage = { name: '', value: null, trouble: '' };
    }
    if (showing?.name === name) {
        again();
    }
}

export function renderWorktree(name: string, handlers: WorktreeHandlers): void {
    showing = { name, handlers };
    const worktree = [state.project, ...state.worktrees].find((entry) => entry?.name === name) ?? null;

    if (past.name !== name) {
        past = { name, entries: null, trouble: '' };
        opened.clear();
        void readHistory(name);
    }
    // A build that stopped is explained by the operation that stopped it, so
    // that one is read as soon as the history says which it is -- the note over
    // the page said something was missing and nothing about what.
    const failed = worktree?.incomplete === true ? lastFailed() : null;
    if (failed !== null && !opened.has(failed.id)) {
        void readJob(failed.id);
    }
    // Only once there is a worktree to read it about: a page opened straight at
    // an address is drawn before the answer arrives, and marking it read then
    // would mean never reading it at all.
    if (worktree !== null) {
        log.about(name);
    }
    if (worktree !== null && !worktree.isProject && usage.name !== name) {
        usage = { name, value: null, trouble: '' };
        void readUsage(name);
    }

    render(worktree === null ? missing(name) : page(worktree, handlers), query<HTMLElement>('#main'));
    // What is uncommitted stands over the page rather than in it, so it is
    // drawn after it and out of the same state.
    if (files.name === name && files.list.open) {
        showChanges(name, t('table.uncommitted'), changeList(name));
    }
}

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
 * Bands down the page and nothing of our own holding them: the head, what the
 * worktree stands at, what is settled about it, what is on its branch, and what
 * has been done to it. The quiet ones alternate, which is what tells a reader
 * where one subject ends without a rule being drawn.
 */
function page(worktree: Worktree, handlers: WorktreeHandlers): TemplateResult {
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
                worktree.isProject ? nothing : actionBar(worktree, handlers, busy !== undefined)
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
                worktree.incomplete && busy === undefined ? unfinishedNote(worktree, handlers) : nothing
            }
            ${
                /* A state that asks for something carries the press that answers it:
                  as a mark beside the name it would be a fact the reader has to match
                  against five buttons themselves. */
                worktree.stale && busy === undefined ? staleNote(worktree, handlers) : nothing
            }
        </section>

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${t('detail.settled')}</h2>
            <div class="sds-facts-set">${settledFacts(worktree, usage).map(shownGroup)}</div>
        </section>

        ${commitList(worktree)}

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${t('detail.history')}</h2>
            ${history()}
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

/**
 * What is on this branch, newest first. "1 unpushed" is a count, and a count is
 * the one thing nobody can act on: it takes the subject to know whether that
 * commit is a fix worth pushing or the leftover of an afternoon.
 *
 * A block of its own and not a line among the facts, which stand in two narrow
 * columns where a commit subject is an ellipsis with a date after it. What the
 * remote has not is marked: that is the part the press beside it would drop.
 */
function commitList(worktree: Worktree): TemplateResult | typeof nothing {
    const read = log.of(worktree.name);
    const trouble = log.trouble(worktree.name);
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
                    ${showFiles(worktree.name)}
                </p>`
            }
            ${log.body(worktree.name, (sha) => `#/w/${encodeURIComponent(worktree.name)}/c/${sha}`)}
        </section>`;
}

/**
 * A press and not a link: the list is read from the container when asked for,
 * and the line it hangs under keeps saying what it said.
 */
function showFiles(name: string): TemplateResult {
    return html` ${saying(
        t('detail.showFiles'),
        html`<sds-button variant="ghost" @click=${() => openFiles(name)}>${t('detail.showFiles')}</sds-button>`,
    )}`;
}

function openFiles(name: string): void {
    if (files.name !== name) {
        files = fresh(name);
    }
    files.list.open = true;
    if (files.list.read === null) {
        void readChanges(name);
    }
    again();
}

// The dialog is the reader's to close. What it leaves behind is the page's
// business: the flag that puts it back on the screen at the next draw.
onChangesClose(() => {
    files.list.open = false;
    again();
});

function toggleDiff(name: string, path: string): void {
    if (files.name !== name) {
        return;
    }
    toggleFile(files.diffs, path, () => void readDiff(name, path));
    again();
}

/**
 * On a surface of its own and not under the heading it hangs from: a dozen
 * paths, any of which opens a diff, pushed the history off the bottom of the
 * page. The change itself is the system's own element for one.
 */
function changeList(name: string): TemplateResult {
    const list = files.list;
    if (list.trouble !== '') {
        return html`<sds-note tone="warn" body=${`${t('detail.changesFailed')} ${list.trouble}`}></sds-note>`;
    }
    if (list.read === null) {
        return waiting();
    }

    return fileList({
        files: list.read,
        diffs: files.diffs,
        press: (path) => toggleDiff(name, path),
        all: files.all,
        showAll: () => {
            files.all = true;
            again();
        },
    });
}

async function readChanges(name: string): Promise<void> {
    await reading(
        async () => (await api.changes(name)).changes,
        () => files.name === name,
        (read, trouble) => {
            files.list = { ...files.list, read, trouble };
        },
    );
}

async function readDiff(name: string, path: string): Promise<void> {
    await reading(
        () => api.changeDiff(name, path),
        // The file has to be open still, and not only the worktree: what was asked
        // for is the change in one row of a list the reader closed.
        () => files.name === name && files.diffs.has(path),
        (read, trouble) => keepDiff(files.diffs, path, read, trouble),
    );
}

/**
 * A build is made from a commit and the checkout goes on past it: what the
 * addresses serve is then older than what is checked out, and nothing on the
 * outside shows it -- it is found out through an error that makes no sense.
 * It carries the press that answers it.
 */
function staleNote(worktree: Worktree, handlers: WorktreeHandlers): TemplateResult {
    return html`
        <sds-note
            tone="warn"
            heading=${t('detail.staleHeading')}
            body=${t('detail.stale')}
            action=${t('table.provision')}
            @sds-note-action=${() =>
                openProvision(worktree, (fresh) => provision(worktree.name, fresh, handlers))}></sds-note>`;
}

/**
 * The one state nothing else shows: the dependencies are there, the address
 * answers, the database exists, and somewhere after that the build stopped. It
 * carries the press that finishes it.
 */
function unfinishedNote(worktree: Worktree, handlers: WorktreeHandlers): TemplateResult {
    const failed = lastFailed();
    const stopped = failed === null ? null : (opened.get(failed.id)?.stopped ?? null);

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
                openProvision(worktree, (fresh) => provision(worktree.name, fresh, handlers))}></sds-note>`;
}

function lastFailed(): JobSummary | null {
    return past.entries?.find((entry) => entry.status === 'failed') ?? null;
}

/** What is being done to it, in the place of what could be done. */
function busyNote(doing: string): TemplateResult {
    return html`
        <sds-note
            tone="info"
            heading=${t('detail.busyHeading')}
            body=${t('detail.busy', { doing })}></sds-note>`;
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
function actionBar(worktree: Worktree, handlers: WorktreeHandlers, busy: boolean): TemplateResult {
    // Built by hand, so kept: an element built anew on every draw is one the
    // renderer swaps out, and the button under the pointer went away whenever
    // an answer or a poll redrew the page.
    const key = JSON.stringify([worktree, state.language]);
    if (bar?.key !== key) {
        bar = { key, ...buildBar(worktree, handlers) };
    }
    // Nothing is live while something is being done to it. And what the
    // container refuses on its own grounds is not offered as if it were not --
    // the reason stands on the button.
    for (const button of [...bar.doing, ...bar.undoing]) {
        button.disabled = busy || bar.held.has(button);
    }
    const { doing, undoing } = bar;

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

let bar: { key: string; doing: SdsButton[]; undoing: SdsButton[]; held: Set<SdsButton> } | null = null;

function buildBar(
    worktree: Worktree,
    handlers: WorktreeHandlers,
): { doing: SdsButton[]; undoing: SdsButton[]; held: Set<SdsButton> } {
    const dropping = buildButton(
        t('table.discard'),
        'danger',
        () => void discard(worktree, handlers, log.of(worktree.name)),
    );
    const removing = buildButton(t('table.remove'), 'danger', () => void remove(worktree, handlers));
    const held = new Set<SdsButton>();
    if (worktree.changes > 0) {
        held.add(dropping);
        dropping.title = t('detail.discardBlocked');
    }

    // Offered where there is a remote to bring from, live where it has
    // something to bring: pressed on a branch that had everything already, it
    // ran a whole operation to say so.
    const pulling = buildButton(t('table.pull'), 'secondary', () => void pull(worktree, handlers));
    if (worktree.behind === 0) {
        held.add(pulling);
        pulling.title = t('detail.pullBlocked');
    }
    const onBranch = wandered(worktree)
        ? [
              buildButton(
                  t('table.restore', { branch: worktree.madeFor ?? '' }),
                  'secondary',
                  () => void restore(worktree, handlers),
              ),
          ]
        : worktree.behind === null
          ? []
          : [pulling];

    const doing = [
        ...onBranch,
        buildButton(t('table.edit'), 'secondary', () => openEdit(worktree)),
        buildButton(t('table.sync'), 'secondary', () => void sync(worktree, handlers)),
        buildButton(t('table.provision'), 'secondary', () =>
            openProvision(worktree, (fresh) => provision(worktree.name, fresh, handlers)),
        ),
    ];
    const undoing = [...((worktree.ahead ?? 0) > 0 ? [dropping] : []), removing];

    return { doing, undoing, held };
}

/**
 * What has been done to this worktree, newest first. Every entry can be opened,
 * and what it says is what it said while it ran -- which is the point of the
 * page: an operation is not gone when its dialog is.
 */
function history(): TemplateResult {
    if (past.trouble !== '') {
        // Not "nothing has been done yet": that is a fact about the worktree, and
        // this is a fact about the container.
        return html`<sds-note tone="warn" body=${`${t('detail.historyFailed')} ${past.trouble}`}></sds-note>`;
    }
    if (past.entries === null) {
        return waiting();
    }
    if (past.entries.length === 0) {
        return html`<p class="branchery-list__quiet">${t('detail.noHistory')}</p>`;
    }

    return html`<div class="branchery-history">${past.entries.map(entry)}</div>`;
}

function entry(job: JobSummary): TemplateResult {
    const known = opened.get(job.id);

    // The same element the dialog draws a running operation with, closed. Its
    // log is fetched on the press, which is why the press is heard here: the
    // element keeps whether it stands open to itself.
    //
    // An operation whose log is gone says so in the same line, the head being
    // the whole of a closed entry -- the alternative is a box onto nothing.
    const when = `${formatWhen(job.started, state.language)} · ${formatDuration(job.elapsed)}`;

    return html`
        <sds-run
            heading=${operationName(job.command)}
            verdict=${job.status}
            note=${known !== undefined && known.trouble !== '' ? `${when} · ${known.trouble}` : when}
            .stateWords=${stateWords()}
            .steps=${known?.steps ?? []}
            @click=${(event: Event) => open(event, job.id)}></sds-run>`;
}

/** Opening an entry is what asks for its log. */
function open(event: Event, id: string): void {
    const pressed = event.target;
    if (!(pressed instanceof Element) || !pressed.closest('.sds-run__head') || opened.get(id)?.settled === true) {
        return;
    }
    void readJob(id);
}

/**
 * A page of the log, and every page after the first put behind what is there.
 * What could not be read is said as that and not as an empty answer.
 *
 * What has been read stays read: a list that answered by replacing itself would
 * land the reader back at the top.
 */
async function readHistory(name: string): Promise<void> {
    await reading(
        () => api.worktreeJobs(name),
        () => past.name === name,
        (entries, trouble) => {
            past = { name, entries, trouble };
        },
    );
}

async function readUsage(name: string): Promise<void> {
    await reading(
        () => api.worktreeUsage(name),
        () => usage.name === name,
        (value, trouble) => {
            usage = { name, value, trouble };
        },
    );
}

async function readJob(id: string): Promise<void> {
    if (askingFor.has(id)) {
        return;
    }
    askingFor.add(id);
    try {
        const job = await api.job(id);
        // The container answers for an operation it has no record of: the log is
        // gone, and asking again would say the same thing.
        const gone = job.status === 'unknown' && job.steps.length === 0;
        opened.set(id, {
            steps: runSteps(job.steps),
            trouble: gone ? t('detail.noLog') : '',
            settled: true,
            stopped: stoppedAt(job),
        });
    } catch (error) {
        opened.set(id, {
            steps: [],
            trouble: `${t('detail.logFailed')} ${errorSentence(error)}`,
            settled: false,
            stopped: null,
        });
    } finally {
        askingFor.delete(id);
    }
    again();
}

function stoppedAt(job: Job): Stopped | null {
    const step = job.steps.find((entry) => entry.state === 'failed');
    if (job.status !== 'failed' || step === undefined) {
        return null;
    }
    return { no: step.no, step: step.label, reason: whyItStopped(job.log) };
}

function again(): void {
    if (showing !== null && onPage(showing.name)) {
        renderWorktree(showing.name, showing.handlers);
    }
}
