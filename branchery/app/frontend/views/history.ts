/**
 * What has been done to one worktree, newest first, and what each of those
 * operations said while it ran.
 *
 * It is the point of the page about a worktree: an operation is not gone when
 * its dialog is. That makes it two reads rather than one -- the list of what
 * was done, and the log of an entry the reader opens -- with three things kept
 * between them, and none of that is anything the page around it decides.
 *
 * Held the way a commit log is held: made once by the page, kept on the
 * element, and gone with it. Nothing here is a module variable, because then
 * one reader's opened entry would be every reader's.
 */

import { html, type TemplateResult } from 'lit';
import { formatDuration, formatWhen, runSteps } from '../dom.js';
import { gather, unread } from '../rules/journal.js';
import { errorSentence, operationName, state, stateWords, t } from '../state.js';
import { whyItStopped } from '../rules/verdict.js';
import { aside, readInto } from '../rules/aside.js';
import type { Reading } from '../rules/reading.js';
import type { Job, JobSummary } from '../types.js';
import { waiting } from './waiting.js';
import type { RunStep } from '@typo3/soul-frontend';

/** Where a failed operation stopped: the step, and the line the console marked. */
export interface Stopped {
    no: number;
    step: string;
    reason: string;
}

/** One entry as it stands once its log has been asked for. */
interface Opened {
    steps: RunStep[];
    trouble: string;
    settled: boolean;
    stopped: Stopped | null;
}

export interface Past {
    /**
     * Now about this worktree. Reads where nothing is held for it, so the two
     * things the page does on arriving are one call.
     */
    about(name: string): void;

    /** Drop what is held about it: an operation ended, so there is one more. */
    forget(name: string): void;

    /** The whole of it, as the page shows it. */
    draw(name: string): TemplateResult;

    /** The one an unfinished worktree is explained by, or null. */
    lastFailed(name: string): JobSummary | null;

    /** Where that operation stopped, once its log has been read. */
    stoppedIn(id: string): Stopped | null;

    /** Whether that operation's log has been asked for already. */
    holds(id: string): boolean;

    /** Ask for one, without a press: the page explains a failure by itself. */
    read(id: string): void;
}

export function pastOf(
    ask: (name: string) => Promise<JobSummary[]>,
    readOne: (id: string) => Promise<Job>,
    reading: Reading,
    again: () => void,
): Past {
    const past = aside<JobSummary[]>();
    /**
     * The steps of opened entries, by operation, or why there are none. An answer
     * saying the log is gone is final; a read that failed is asked again at the
     * next press, the container possibly being back by then.
     */
    const opened = new Map<string, Opened>();
    /**
     * The operations whose log is on its way. Every draw asked for the last failed
     * operation's log again until the first answer was here.
     */
    const askingFor = new Set<string>();

    async function readOf(id: string): Promise<void> {
        if (askingFor.has(id)) {
            return;
        }
        askingFor.add(id);
        try {
            const job = await readOne(id);
            // The container answers for an operation it has no record of: the log is
            // gone, and asking again would say the same thing.
            const gone = job.status === 'unknown' && job.steps.length === 0;
            opened.set(id, {
                // An operation that is over is read once and in full, so nothing is
                // gathered here -- the rule is the same one either way.
                steps: runSteps(gather(unread, job).steps),
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

    /** Opening an entry is what asks for its log. */
    function open(event: Event, id: string): void {
        const pressed = event.target;
        if (!(pressed instanceof Element) || !pressed.closest('.sds-run__head') || opened.get(id)?.settled === true) {
            return;
        }
        void readOf(id);
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

    return {
        about(name) {
            if (past.about(name)) {
                // The opened entries are the last worktree's, and an id says nothing
                // about which worktree it was under.
                opened.clear();
                void readInto(past, name, () => ask(name), reading);
            }
        },
        forget(name) {
            if (past.stillOn(name)) {
                past.forget(name);
                opened.clear();
            }
        },
        draw(name) {
            const trouble = past.trouble(name);
            if (trouble !== '') {
                // Not "nothing has been done yet": that is a fact about the worktree, and
                // this is a fact about the container.
                return html`<sds-note tone="warn" body=${`${t('detail.historyFailed')} ${trouble}`}></sds-note>`;
            }
            const entries = past.of(name);
            if (entries === null) {
                return waiting();
            }
            if (entries.length === 0) {
                return html`<p class="branchery-list__quiet">${t('detail.noHistory')}</p>`;
            }

            return html`<div class="branchery-history">${entries.map(entry)}</div>`;
        },
        lastFailed: (name) => past.of(name)?.find((job) => job.status === 'failed') ?? null,
        stoppedIn: (id) => opened.get(id)?.stopped ?? null,
        holds: (id) => opened.has(id),
        read: (id) => void readOf(id),
    };
}

function stoppedAt(job: Job): Stopped | null {
    const step = job.steps.find((entry) => entry.state === 'failed');
    if (job.status !== 'failed' || step === undefined) {
        return null;
    }

    return { no: step.no, step: step.label, reason: whyItStopped(job.log) };
}
