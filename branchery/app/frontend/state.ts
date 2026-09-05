/** Shared state and the actions every view reaches for. */

import { api, ApiError } from './api.js';
import { loadStrings, translate } from './i18n.js';
import { keep, recall } from './kept.js';
import { createStore, differs } from './store.js';
import type { AppState, JobKind, RunningJob, ServerState, TrackedJob } from './types.js';

const LANGUAGE_KEY = 'branchery-language';

export const { state, subscribe } = createStore<AppState>({
    tld: location.host,
    projectName: '',
    worktrees: [],
    project: null,
    branch: '',
    branches: [],
    remotes: [],
    repository: null,
    phpVersions: [],
    strings: {},
    loading: true,
    language: recall(LANGUAGE_KEY) || document.documentElement.lang || 'en',
    job: null,
    runningJobs: [],
    error: '',
    unreachable: false,
    recipeProblem: null,
    unconfigured: false,
    updateWaiting: false,
});

export function t(key: string, params: Record<string, string | number> = {}): string {
    return translate(state.strings, key, params);
}

export async function setLanguage(language: string): Promise<void> {
    state.strings = await loadStrings(language);
    state.language = language;
    document.documentElement.lang = language;
    keep(LANGUAGE_KEY, language);

    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
        const key = element.dataset['i18n'];
        if (key) {
            element.textContent = t(key);
        }
    });
}

/**
 * Quietly where the reader did not ask for it: turning a standing list into grey
 * bars for the length of a request says "gone" about something that is still
 * there. Where the reader pressed something, the wait is theirs.
 */
export async function refresh(quiet = false): Promise<RunningJob[]> {
    // One look at a time: the page is asked to look from several places, and
    // two within the same moment sent the same request twice -- each a second
    // of git and docker. The second asker gets the answer the first waits for.
    if (inFlight !== null) {
        if (!quiet) {
            state.loading = true;
        }

        return inFlight;
    }
    inFlight = look(quiet).finally(() => {
        inFlight = null;
    });

    return inFlight;
}

/** The look that is on its way, where one is. */
let inFlight: Promise<RunningJob[]> | null = null;

async function look(quiet: boolean): Promise<RunningJob[]> {
    state.loading = !quiet;
    try {
        const running = await load();
        state.unreachable = false;

        return running;
    } catch (error) {
        // An answer the container gave is that sentence, said on the page: the
        // project was reached and had something to say. No answer at all is another
        // matter -- the container is restarted while this page stands open, so what
        // was read last stays, said to be old, with the way to ask again beside it.
        if (error instanceof ApiError) {
            state.unreachable = false;
            setError(error.message);
        } else {
            state.unreachable = true;
        }

        return state.runningJobs;
    } finally {
        state.loading = false;
    }
}

async function load(): Promise<RunningJob[]> {
    const data = await api.state();
    put('worktrees', data.worktrees);
    put('branches', data.branches);
    put('remotes', data.remotes);
    put('repository', data.repository ?? null);
    put('branch', data.branch);
    put('project', data.project);
    put('phpVersions', data.phpVersions);
    put('tld', data.tld || location.host);
    // Every field is taken as it may arrive and not as the type says it must:
    // the container answering can be older than this page was built against --
    // which is the very state `updateWaiting` reports.
    put('projectName', data.projectName ?? '');
    put('recipeProblem', data.recipeProblem ?? null);
    put('unconfigured', data.unconfigured === true);
    put('updateWaiting', data.updateWaiting ?? false);
    put('runningJobs', data.runningJobs ?? []);

    return state.runningJobs;
}

/**
 * Only what has changed is written, because writing is what redraws. Every
 * answer is a fresh set of objects and the store cannot tell a fresh object
 * from a different one, so every poll was the whole page drawn again.
 */
function put<K extends keyof ServerState>(key: K, value: ServerState[K]): void {
    if (differs(state[key], value)) {
        // Through the narrower type: the store holds more than the answer carries,
        // and the key is one of the answer's.
        (state as ServerState)[key] = value;
    }
}

export function setError(message: string): void {
    state.error = message;
}

/**
 * An answer the container gave is its own sentence and is shown as it came. No
 * answer at all is the note over the page, the one with the way to ask again:
 * it is about the project and not about what was pressed, and said in both
 * places it reads as two things wrong.
 */
export function reportError(error: unknown): void {
    if (unreachable(error)) {
        state.unreachable = true;

        return;
    }
    setError(errorSentence(error));
}

/**
 * Anything but a sentence the container gave counts as not reached: the
 * browser's own failure to connect is an error without a status.
 */
function unreachable(error: unknown): boolean {
    return error instanceof Error && !(error instanceof ApiError);
}

/** The same sentence, for a view that says it in a place of its own. */
export function errorSentence(error: unknown): string {
    return error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? t('error.unreachable')
          : t('error.generic');
}

/**
 * Several worktrees can be worked on at once, and the one the reader is watching
 * is only one of them -- without this the others look untouched for a minute and
 * are then different, which reads as the page being wrong. An operation that has
 * not named its step still has to mark its row, so the kind of work stands in.
 */
export function busyWith(name: string): string | undefined {
    const job = state.runningJobs.find((running) => running.subject === name);

    return job === undefined ? undefined : (job.step?.label ?? doingWord(job.command));
}

export function trackJob(id: string, expected: string | null = null, kind: JobKind = 'create'): TrackedJob {
    const job: TrackedJob = {
        id,
        expected,
        kind,
        status: 'running',
        // Until the first answer arrives, what the press that started it knew is
        // all there is; the operation names itself a second later.
        subject: expected ?? '',
        command: '',
        step: null,
        steps: [],
        elapsed: 0,
        log: '',
        size: 0,
        partial: false,
        interrupted: false,
    };
    state.job = job;
    return job;
}

/**
 * What kind of operation a console command is, what it is called in a worktree's
 * history, and what a row says while it runs. One table, because those three
 * places used to keep one each -- and an operation called two things is two
 * operations to whoever reads both. Anything not named here builds a worktree.
 */
const COMMANDS: Record<string, { kind: JobKind; history: string; doing: string }> = {
    'worktree:add': { kind: 'create', history: 'history.add', doing: 'job.doing.create' },
    'worktree:fork': { kind: 'create', history: 'history.fork', doing: 'job.doing.create' },
    'worktree:provision': { kind: 'create', history: 'history.provision', doing: 'job.doing.provision' },
    'worktree:remove': { kind: 'remove', history: 'history.remove', doing: 'job.doing.remove' },
    'database:sync': { kind: 'sync', history: 'history.sync', doing: 'job.doing.sync' },
    'worktree:pull': { kind: 'pull', history: 'history.pull', doing: 'job.doing.pull' },
    'worktree:restore': { kind: 'restore', history: 'history.restore', doing: 'job.doing.restore' },
    'worktree:discard': { kind: 'discard', history: 'history.discard', doing: 'job.doing.discard' },
    'git:fetch': { kind: 'fetch', history: 'history.fetch', doing: 'job.doing.fetch' },
};

export function kindOf(command: string): JobKind {
    return COMMANDS[command]?.kind ?? 'create';
}

/** What an operation is called, from the command it ran. */
export function operationName(command: string): string {
    return t(COMMANDS[command]?.history ?? 'history.other');
}

/** What a row says about an operation that has not said which step it is on. */
export function doingWord(command: string): string {
    return t(COMMANDS[command]?.doing ?? 'job.doing.create');
}

/**
 * The step list draws them as a mark and a colour, which reaches nobody who is
 * listening; these are the same three facts in words. Here rather than in the
 * component, which would then have to know the reader's language.
 */
export function stateWords(): Record<'running' | 'done' | 'failed', string> {
    return {
        running: t('step.state.running'),
        done: t('step.state.done'),
        failed: t('step.state.failed'),
    };
}
