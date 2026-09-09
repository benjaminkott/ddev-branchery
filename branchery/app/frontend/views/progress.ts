/**
 * What an operation is doing, while it does it: the list of steps it consists
 * of. Each row says what was done, whether it worked and how long it took; the
 * one in hand is open and shows what the tools are writing.
 *
 * Nothing is hidden by that -- every row opens, and the whole log is one button
 * away for the report that needs it.
 */

import { html, type TemplateResult } from 'lit';
import type { SdsButton } from '@typo3/soul-frontend';
import { api } from '../api.js';
import { buildButton, formatDuration, maybe, runSteps, setButtonLabel } from '../dom.js';
import { gather, unread } from '../rules/journal.js';
import { poll } from '../rules/polling.js';
import { kindOf } from '../rules/operations.js';
import { operationName, refresh, state, stateWords, subscribe, t, trackJob } from '../state.js';
import type { JobKind, TrackedJob, Worktree } from '../types.js';
import { hasResult, titleOf, whyItStopped } from '../rules/verdict.js';
import {
    closeWizard,
    flowOpen,
    onWizardClose,
    openDialog,
    setFooter,
    setStage,
    stageBody,
    wizardOpen,
} from './wizard.js';

const POLL_INTERVAL = 1000;

/**
 * A page follows one operation at a time, but an answer to the one it let go of
 * may still be on its way: drawn, it would put the old operation back on the
 * stage, or stop the polling of the new one for good. So every watch is
 * numbered and an answer is only listened to by the watch that asked for it.
 */
let generation = 0;
let letGo: (() => void) | null = null;

/**
 * How the current watch is put on the stage from outside -- the mark in the
 * corner presses it. A watch started without the stage draws nothing until then.
 */
let takeStage: (() => void) | null = null;

/**
 * What is known about it is passed in where the press that started it knew. A
 * page opened onto an operation already running knows neither, and reads both
 * off the operation itself, so the end can name the worktree it built.
 *
 * The shared state learns of the operation when it starts and when it ends;
 * what happens in between is drawn here, or every tick would be the whole page
 * drawn again behind the dialog.
 */
export function watchJob(
    id: string,
    expected: string | null,
    kind: JobKind | null,
    onFinished: (job: TrackedJob) => void,
    onStage = true,
): void {
    const mine = ++generation;
    letGo?.();
    let current = trackJob(id, expected, kind ?? 'create');
    let staged = onStage;
    // What has been read of the log so far. The container is asked for the rest
    // of it and not for the whole of it again -- see journal.ts.
    let journal = unread;

    // Only what the reader asked for takes the screen. Work started in a
    // terminal is followed all the same, but a dialog opening by itself over
    // the list is the tool taking the page from whoever opened it.
    //
    // Nor does such a watch draw into the dialog while it is not on the stage:
    // another flow may own it, and a question the reader is in the middle of
    // used to be replaced once a second by whatever a terminal had started.
    const draw = (): void => {
        if (staged && !flowOpen()) {
            paint(current);
        }
    };
    takeStage = () => {
        staged = true;
        openDialog();
        paint(current);
    };
    // The first picture is drawn whatever is on the stage: the flow that
    // started the watch stands there until this takes it over.
    if (onStage) {
        takeStage();
    }

    // The end is drawn once, and what belongs to it is read before anything is
    // shown -- or the stage goes from running, to a bare "done", to the result:
    // three pictures where there is one thing to say.
    const ended = async (): Promise<void> => {
        await refresh();
        if (mine !== generation) {
            return;
        }
        state.job = current;
        draw();
        onFinished(current);
    };

    // One answer at a time, and none after the watch has ended: a slow
    // "running" landing after a fast "done" drew the operation back to the
    // middle with nothing left to draw it forward. A question that fails is
    // simply asked again.
    letGo = poll(
        () => api.job(id, journal.size),
        (job) => {
            if (mine !== generation) {
                return false;
            }
            journal = gather(journal, job);
            current = {
                ...job,
                log: journal.log,
                steps: journal.steps,
                expected: expected ?? (job.subject === '' ? null : job.subject),
                kind: kind ?? kindOf(job.command),
            };
            if (job.status === 'running') {
                draw();

                return true;
            }
            void ended();

            return false;
        },
        POLL_INTERVAL,
    );
}

/**
 * The dialog can be closed while the work goes on, and then the only sign that
 * anything is running is that nothing on the page changes. So a mark stays
 * behind, and pressing it puts the operation back on the stage.
 *
 * It stays when the operation ends and says how it ended: one that stopped
 * while nobody was looking is exactly the one that has to be gone back to.
 */
const TICKETS: Record<string, string> = {
    running: 'job.running',
    done: 'job.ticket.done',
    failed: 'job.ticket.failed',
    unknown: 'job.ticket.unknown',
};

let ticket: SdsButton | null = null;
let saying = '';

function paintTicket(): void {
    const status = state.job !== null && !wizardOpen() ? state.job.status : '';
    const key = TICKETS[status];
    if (key === undefined) {
        ticket?.remove();
        ticket = null;
        saying = '';

        return;
    }
    if (ticket !== null && saying === status) {
        return;
    }

    ticket?.remove();
    saying = status;
    ticket = buildButton(t(key), 'secondary', () => {
        // The watch draws the stage itself when it is asked onto it; one that is
        // over has nothing to draw but what stands there already.
        (takeStage ?? openDialog)();
        paintTicket();
    });
    ticket.className = `branchery-ticket branchery-ticket--${status}`;
    ticket.title = t('job.show');
    document.body.append(ticket);
}

// Both, because neither covers the other: closing the dialog changes no state,
// and the operation ending changes nothing about the dialog.
onWizardClose(() => paintTicket());
subscribe(() => paintTicket());

/**
 * A title saying how it is going, the list under it, and -- once it is over --
 * what came of it above the list and a way out below.
 *
 * Drawn in parts, each only when it has something else to say. The list in
 * particular is left alone: rebuilding it would put the reader back at the top
 * of it and fold what they had opened.
 */
function paint(job: TrackedJob): void {
    // The surface keeps one title for the whole of an operation, while the
    // verdict, the step and the seconds move into the head of the run itself.
    setStage(subject(job), job.status === 'running' ? '' : outcome(job));
    // The list is a component: what did not change is left standing. That is
    // why the end of an operation is a row going quiet rather than the stage
    // being drawn again under the reader.
    stageBody(html`
        <sds-run open
                 heading=${title(job)}
                 verdict=${job.status}
                 note=${where(job)}
                 .stateWords=${stateWords()}
                 .steps=${runSteps(job.steps)}></sds-run>`);

    paintFooter(job);
    paintTicket();
}

/**
 * Leaving is a real move and not a way of giving up: the operation goes on in
 * the container whatever this page does, and the mark it leaves behind is the
 * way back. Said only by the escape key before, so a running operation offered
 * nothing at all to press.
 */
function paintFooter(job: TrackedJob): void {
    setFooter(
        job.status === 'running'
            ? {
                  back: t('action.leaveRunning'),
                  onBack: () => closeWizard(),
              }
            : {
                  back: t('action.copyLog'),
                  onBack: () => void copyLog(job),
                  next: t('action.close'),
                  onNext: () => {
                      state.job = null;
                      closeWizard();
                  },
              },
    );
}

function title(job: TrackedJob): string {
    return t(titleOf(job.status));
}

/**
 * The worktree it is being done to: the one thing about an operation that does
 * not change while it runs, and the only title a reader can hold on to while
 * the verdict goes from working to done. One about no worktree is named by
 * what it is instead.
 */
function subject(job: TrackedJob): string {
    return job.expected ?? (job.subject === '' ? operationName(job.command) : job.subject);
}

/**
 * While it runs, which step of how many and how long it has taken. When it is
 * over, how long it took -- or, where it stopped, the line the console marked.
 */
function where(job: TrackedJob): string {
    const time = formatDuration(job.elapsed);

    if (job.status === 'running') {
        return job.step === null ? time : `${t('job.stepOf', { no: job.step.no, total: job.step.total })} · ${time}`;
    }
    if (job.status === 'failed') {
        // An operation that was stopped has nothing to say for itself: the log
        // simply ends, and the reader is left looking at a step marked failed over
        // output that reads perfectly well.
        if (job.interrupted) {
            return t('job.interrupted');
        }

        return whyItStopped(job.log) || time;
    }
    // One nothing is known about took no time anybody measured.
    if (!hasResult(job.status)) {
        return '';
    }

    return time;
}

/**
 * Only the end of an operation has an answer here. Said under the title rather
 * than in a card over the list, which would push down the one thing the reader
 * is looking at at the very moment the last row goes quiet.
 *
 * A worktree that was built is opened and logged into, so the line carries the
 * way in. After fetching data neither is true -- editors and passwords came
 * with the data. One that stopped says why in the run's line and nothing here.
 */
function outcome(job: TrackedJob): string | TemplateResult {
    // Only an operation that ended has one: not one that stopped, and not one
    // the container has no record of.
    if (!hasResult(job.status)) {
        return '';
    }

    const time = formatDuration(job.elapsed);
    if (job.kind === 'fetch') {
        // What git wrote for every ref that moved, counted: a fetch that says "up
        // to date" about a remote that just gained a branch is the one thing a
        // fetch must not say.
        const moved = job.log.split('\n').filter((line) => line.includes(' -> ')).length;

        return moved === 0 ? t('job.done.fetch', { time }) : t('job.done.fetchMoved', { count: moved, time });
    }
    const worktree = state.worktrees.find((entry) => entry.name === job.expected);
    if (!worktree || job.kind === 'remove') {
        return t(`job.done.${job.kind}`, { name: job.expected ?? '', time });
    }

    // A sentence, and not the fragments it used to be: "branch · brought up to
    // date · Open worktree" was three things for the reader to join up.
    const said =
        job.kind === 'sync'
            ? t('job.done.sync', { name: worktree.database })
            : job.kind === 'pull'
              ? t('job.done.pull', { branch: worktree.branch })
              : job.kind === 'restore'
                ? t('job.done.restore', { branch: worktree.branch })
                : job.kind === 'discard'
                  ? t('job.done.discard', { branch: worktree.branch })
                  : job.kind === 'account'
                    ? login(worktree)
                    : worktree.account?.made !== true
                      ? t('job.done.built', { php: worktree.php })
                      : `${t('job.done.built', { php: worktree.php })} ${login(worktree)}`;

    return html`
        ${said}
        <sds-link external href=${worktree.url}
                  label=${t('action.openWorktree')}></sds-link>`;
}

/** The login of a worktree, as the sentence that hands it over. */
function login(worktree: Worktree): string {
    const account = worktree.account;

    return account === null ? '' : t('job.login', { user: account.user, password: account.password });
}

/** The whole log, for the report that needs it. */
async function copyLog(job: TrackedJob): Promise<void> {
    const button = maybe<SdsButton>('#wizBack');
    try {
        await navigator.clipboard.writeText(job.log.trim());
        if (button) {
            setButtonLabel(button, t('action.copied'));
            window.setTimeout(() => setButtonLabel(button, t('action.copyLog')), 2000);
        }
    } catch {
        // A browser that will not have it is no reason to say anything: the log
        // stands open in the rows above.
    }
}
