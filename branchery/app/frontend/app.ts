/** Entry point: wires the shell up with state and views. */

import { html, render as paint, type TemplateResult } from 'lit';
import type { JobHandlers, RunningJob, TrackedJob } from './types.js';
import { maybe, query } from './dom.js';
import { loadLanguages } from './i18n.js';
import { refresh, setError, setLanguage, state, subscribe, t } from './state.js';
import type { DropdownChosen, SdsNavMain } from '@typo3/soul-frontend';
import { currentRoute, onRoute, type Route } from './router.js';
import { afterWizard, stillOn, wizardAsked } from './rules/routes.js';
import { operationEnded } from './ended.js';
import { View } from './views/view.js';
// The pages, for the elements they define. Which of them is open is decided in
// one template below, and nothing here knows what any of them keeps.
import './views/overview.js';
import './views/commit.js';
import './views/worktree.js';
import './views/branch.js';
import { watchJob } from './views/progress.js';
import { closeWizard, flowOpen, onWizardClose, wizardOpen } from './views/wizard.js';
import { openCreate } from './views/create.js';

const handlers: JobHandlers = {
    // Without a kind the operation is asked what it is -- the case when the
    // page is opened onto one that was already running.
    onJob(job: string, expected: string | null = null, kind = null): void {
        watchJob(job, expected, kind, ended);
    },
};

/**
 * An operation is over. The page follows from the store; what a page keeps of
 * its own about that worktree is no longer true, and whoever is on screen and
 * cares hears it -- said as an event, so that this does not have to know which
 * pages there are.
 */
function ended(job: TrackedJob): void {
    const about = job.expected ?? job.subject;
    if (about !== '') {
        operationEnded(about);
    }
}

/**
 * A note over the page: what could not be read, a version waiting for a
 * restart, a project that has said nothing, a recipe that cannot be used. They
 * belong to the shell rather than to a page.
 *
 * The element is made once, because a note rebuilt under the pointer is a
 * button that moves as it is pressed, and written to on every draw, because
 * what it says is in the reader's language and the reader can change that with
 * the note standing.
 */
function paintNote(holder: string, shown: boolean, said: () => Record<string, string>, onAction?: () => void): void {
    const box = query(holder);
    box.hidden = !shown;
    if (!shown) {
        return;
    }

    let note = box.firstElementChild;
    if (note === null) {
        note = document.createElement('sds-note');
        if (onAction !== undefined) {
            note.addEventListener('sds-note-action', onAction);
        }
        box.append(note);
    }
    for (const [name, value] of Object.entries(said())) {
        note.setAttribute(name, value);
    }
}

function paintOffline(): void {
    paintNote(
        '#offline',
        state.unreachable,
        () => ({ tone: 'warn', body: t('error.unreachable'), action: t('action.tryAgain') }),
        () => void refresh(),
    );
}

/**
 * A container keeps the image it was made from, so a project updated to a newer
 * Branchery goes on serving the one it had until it is restarted -- and the
 * page looks exactly as it did meanwhile.
 */
function paintUpdateWaiting(): void {
    paintNote('#update', state.updateWaiting, () => ({
        tone: 'info',
        heading: t('update.waiting'),
        body: t('update.how'),
    }));
}

/**
 * The API asks nobody who they are, and that is right for one reason: the port
 * is on the developer's own machine. Where that stopped being true, saying so is
 * the only thing this application can do about it -- and the only thing it
 * should, since a lock here would be a lock on a tool that sits beside a shell
 * which could do all of it anyway.
 */
function paintExposed(): void {
    const by = state.exposed;
    paintNote('#exposed', by !== null, () => ({
        tone: 'warn',
        heading: t('exposed.heading'),
        body: t(by === 'router' ? 'exposed.router' : 'exposed.container'),
    }));
}

/**
 * Nothing is guessed, so a project with no configuration gets exactly what it
 * asked for: a checkout at an address, with nothing installed. A reasonable
 * thing to want and a terrible thing to discover, so it is said at the top.
 */
function paintUnconfigured(): void {
    paintNote('#unconfigured', state.unconfigured, () => ({
        tone: 'info',
        heading: t('error.unconfigured'),
        body: t('error.unconfiguredHow'),
    }));
}

/**
 * The problem is quoted, because "the recipe is wrong" without saying where
 * sends the reader to read the whole file.
 */
function paintRecipeProblem(): void {
    const problem = state.recipeProblem;
    paintNote('#recipe', problem !== null, () => ({
        tone: 'warn',
        heading: t('error.recipe'),
        body: problem ?? '',
    }));
}

/**
 * The whole address and not only the kind of page it names: pressing a parent
 * leads from one commit to another, which is a page like any other.
 */
let shown: Route = currentRoute();

/**
 * While an operation runs the stage belongs to the progress dialog and nothing
 * behind it is redrawn: the reader is watching the dialog, and a page
 * rebuilding underneath it is movement nobody asked for.
 */
function render(route: Route = currentRoute()): void {
    // Only while the dialog is actually on top: otherwise a provisioning in
    // one worktree would hold the whole page still while another finished.
    if (wizardOpen()) {
        return;
    }
    // Another page, rather than the one on screen drawn again.
    const arrived = !stillOn(route, shown);
    // A page is read from its top. Only what is written into the document
    // changes here, so the browser scrolls nothing back by itself -- and a
    // worktree opened from the foot of a long list was drawn under the fold.
    if (arrived) {
        window.scrollTo(0, 0);
    }
    shown = route;
    paintBar();
    paintOffline();
    paintExposed();
    paintUpdateWaiting();
    watchTheOthers();
    paintRecipeProblem();
    paintUnconfigured();

    draw(route);
    if (arrived) {
        land();
    }
}

function draw(route: Route): void {
    const main = query<HTMLElement>('#main');
    paint(opened(route), main);
    // What the shell decides to draw, it draws -- see View.drawNow().
    for (const page of main.children) {
        if (page instanceof View) {
            page.drawNow();
        }
    }
}

/**
 * Which page is open, and the whole of what the shell knows about any of them.
 *
 * A page is an element: put here it begins and taken away it ends, so an answer
 * it was waiting for is dropped by the page itself rather than by a
 * `leaveWorktree()` here -- which was a list of three that a fourth page had to
 * be added to, in three places, or it went on answering for a reader who had
 * gone.
 */
function opened(route: Route): TemplateResult {
    if (route.view === 'worktree') {
        return html`<branchery-worktree .name=${route.name} .handlers=${handlers}></branchery-worktree>`;
    }
    if (route.view === 'branch') {
        return html`<branchery-branch .name=${route.name} .handlers=${handlers}></branchery-branch>`;
    }
    if (route.view === 'commit') {
        return html`<branchery-commit
            .name=${route.name}
            .sha=${route.sha}
            .branch=${route.branch}></branchery-commit>`;
    }

    return html`<branchery-overview .handlers=${handlers}></branchery-overview>`;
}

/**
 * Nothing about the document changes when a page is opened here except what
 * stands in it, so the focus stays on a row that is gone and the browser hands
 * it to the body -- whoever reads with a keyboard is then at the top of the
 * document rather than of the page.
 *
 * Reached only this way (`tabindex="-1"`), so it stays out of the tab order and
 * draws no ring. Not on the first draw: the browser has already put the reader
 * at the top of the document.
 */
function land(): void {
    query('#main').focus({ preventScroll: true });
}

subscribe(() => render());
onRoute((route) => {
    // What went wrong went wrong on the page it was said on: carried over, it
    // stands over something the reader is no longer looking at.
    setError('');
    render(route);
});

const bar = query<SdsNavMain>('#bar');

let languages: string[] = [];

/**
 * A site of its own rather than a page this interface draws: a reader who has
 * not installed the add-on can be sent to it.
 */
const MANUAL = 'https://benjaminkott.github.io/ddev-branchery/';

/** The language the bar was last written in, so it is written again only on a change. */
let barLanguage = '';

/**
 * The manual is somebody else's page as far as the bar is concerned, which is
 * what `external` says: it opens away, and is never the current entry.
 */
function paintBar(): void {
    // Only when the words would come out different: the page is drawn again
    // whenever anything changes, and handing the component a fresh object each
    // time is a render of the bar for every poll.
    if (barLanguage === state.language) {
        return;
    }
    barLanguage = state.language;

    // "menu", not "items". The component's own property is the menu; a bare
    // list of items still draws the pills, which is why this went unnoticed.
    bar.menu = {
        label: t('app.title'),
        items: [
            { label: t('nav.worktrees'), href: '#/', current: true },
            { label: t('nav.docs'), href: MANUAL, external: true },
        ],
    };
}

// The footer says nothing this has to write: a copyright and a mark are
// the same in every language.
function paintShell(): void {
    bar.product = t('app.title');
    paintBar();
}

/**
 * The bar's own control: each entry names its language in that language, and
 * `lang` is what makes a reader hear "Deutsch" in German rather than in the
 * voice the page is set in.
 */
function paintLanguagePicker(): void {
    bar.languages = languages.map((code) => ({
        label: endonym(code),
        current: code === state.language,
        lang: code,
    }));

    // The bar writes this name itself and writes it in English, which a reader
    // of the German page would not hear in German -- so it is written over once
    // the bar has drawn it, from a static attribute a later render leaves.
    void bar.updateComplete.then(() => {
        maybe('.sds-bar__lang', bar)?.setAttribute('name', t('app.language'));
    });
}

function endonym(code: string): string {
    try {
        return new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code.toUpperCase();
    } catch {
        return code.toUpperCase();
    }
}

// The dropdown is the bar's, so the choice is heard where the bar stands.
bar.addEventListener('sds-dropdown-choose', (event) => {
    const chosen = languages[(event as CustomEvent<DropdownChosen>).detail.index];
    if (!chosen || chosen === state.language) {
        return;
    }
    void setLanguage(chosen).then(() => {
        paintLanguagePicker();
        paintShell();
        // Whatever page is being read, in the other language -- not the list.
        render();
    });
});

query<HTMLDialogElement>('#wizard').addEventListener('close', () => {
    if (state.job?.status !== 'running') {
        state.job = null;
    }
});

// The page behind the dialog stood still, and what the dialog was about is
// what the page is asked about next. Drawn now, because the look may find
// nothing new to say.
onWizardClose(() => {
    // "#new" was the way in and is not a place to stay: left in the address
    // it reopens the wizard on a reload and again on the way back.
    const address = afterWizard(location.hash);
    if (address !== null) {
        history.replaceState(null, '', address);
    }
    render();
    void refresh(true);
});

/**
 * Whatever happened while the page was not being looked at. The other end of
 * this is a terminal, so the moment the page is looked at again is the moment
 * it should be right.
 *
 * Both events, because neither covers the other: a tab moved to the back is
 * hidden, a window behind the editor is not.
 */
const LOOK_AGAIN = 5000;
let lookedAt = Date.now();

async function catchUp(): Promise<void> {
    const now = Date.now();
    // An operation whose mark still stands in the corner is not one being
    // followed. Not while the dialog is up either: a question the reader is in
    // the middle of is not the moment to take up another operation.
    if (
        document.visibilityState !== 'visible' ||
        state.job?.status === 'running' ||
        wizardOpen() ||
        now - lookedAt < LOOK_AGAIN
    ) {
        return;
    }
    lookedAt = now;

    followOldest(await refresh(true));
}

/**
 * For work already going on when this page arrived: it was started somewhere
 * else, and the reader opened the list to see the list. The oldest, because it
 * is the one closest to having something to say.
 */
function followOldest(running: RunningJob[]): void {
    const oldest = running[0];
    if (oldest !== undefined && state.job?.status !== 'running') {
        watchJob(oldest.id, null, null, ended, false);
    }
}

/**
 * Looking again, at the pace of what is going on: a worktree can start being
 * built from a terminal while this stands open.
 *
 * Quietly, always -- the list stays as it is until there is something different
 * to say. Closely while work is going on, slowly otherwise, since a look costs
 * a second of git and docker. Not while the dialog is up, and not while the
 * page is not being looked at.
 */
const WATCH_BUSY = 2000;
const WATCH_IDLE = 10000;
let watching = false;

function watchTheOthers(): void {
    // Started once and then it keeps itself going: a second chain would start
    // on the first one's answer and the two would divide the interval between
    // them for as long as the page stood open.
    if (watching) {
        return;
    }
    watching = true;

    const again = (): void => {
        // Closely while the dialog is up as well: the reader who leaves it looks
        // at the list next, which would otherwise say nothing about that operation
        // for the length of a slow look. And while the container is away, since
        // "ddev restart" takes seconds.
        const busy = state.runningJobs.length > 0 || wizardOpen() || state.unreachable;
        window.setTimeout(
            () => {
                if (document.visibilityState !== 'visible' || wizardOpen()) {
                    again();

                    return;
                }
                // Drawing follows from the store: what the answer changed is drawn once,
                // on the next frame.
                void refresh(true).then(again);
            },
            busy ? WATCH_BUSY : WATCH_IDLE,
        );
    };
    again();
}

document.addEventListener('visibilitychange', () => void catchUp());
window.addEventListener('focus', () => void catchUp());

/**
 * "#new" opens the wizard, and the address moving away from under a question
 * closes it -- the reader has left. An operation on the stage stays: it is not
 * the address's to close.
 */
function openFromHash(): void {
    if (wizardAsked(location.hash)) {
        openCreate(handlers);

        return;
    }
    if (flowOpen()) {
        closeWizard();
    }
}

window.addEventListener('hashchange', openFromHash);

void (async (): Promise<void> => {
    languages = await loadLanguages();
    await setLanguage(languages.includes(state.language) ? state.language : (languages[0] ?? 'en'));
    paintLanguagePicker();
    paintShell();
    // Whatever the address asks for, not the list: a page opened straight at a
    // worktree would be given the list first and the worktree a moment later.
    render();
    // The oldest of whatever was already running is followed, so its end is
    // reported and there is a way back into it; the rest are marked on their
    // rows.
    followOldest(await refresh());
    // Before anything is put over it. What the store writes is drawn on the
    // next frame and nothing behind an open dialog is drawn at all -- so a page
    // opened straight at "#new" stood as bars for the whole of the flow,
    // saying "still reading" about a list that had been read.
    render();
    openFromHash();
})();
