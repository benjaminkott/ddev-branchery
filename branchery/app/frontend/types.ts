/** The data shapes of the REST API. */

/**
 * Where a branch was cut from and how far both sides have gone since. What a
 * graph says with a lane.
 */
export interface Cut {
    branch: string;
    own: number;
    moved: number;
}

/** The commit a checkout or a branch stands on: the short hash and the subject. */
export interface Tip {
    sha: string;
    subject: string;
}

export interface Worktree {
    name: string;
    branch: string;
    /**
     * Not always the one it is on: a patch tried in it leaves the checkout
     * somewhere else while the name, the address and the database still say
     * this. Null for the project's own checkout.
     */
    madeFor: string | null;
    /** Null where the worktree was not branched off. */
    forkedFrom: string | null;
    forkedAt: string | null;
    php: string;
    /** Minimum version according to composer.lock; below it every request aborts. */
    minPhp: string | null;
    /**
     * Nothing is served with it, so it is a fact about the build and not
     * about the address; null where the container has no Node at all.
     */
    node: string | null;
    database: string;
    profile: string | null;
    docroot: string;
    changes: number;
    /**
     * Null where it tracks nothing: the branch is then not in step with a
     * remote, it is on none.
     */
    ahead: number | null;
    behind: number | null;
    ready: boolean;
    isProject: boolean;
    url: string;
    /** Where the application's own editing interface answers, where it has one. */
    backend: string | null;
    /** Where it lies on the machine, as the terminal would have to be told. */
    path: string;
    /** Letting the worktree go loses nothing that is not kept elsewhere. */
    merged: boolean;
    /**
     * The branch it tracked is gone from the remote -- what a squashed pull
     * request leaves behind. Its commits are nowhere in the base under their
     * own names, so this is offered, not assumed.
     */
    gone: boolean;
    /** Unix time; null before it ever was built. */
    builtAt: number | null;
    /**
     * The checkout has moved since it was built, so its dependencies and its
     * schema were made for other code -- which nothing on the outside shows.
     */
    stale: boolean;
    /**
     * A build was begun here and never got to its end -- or is running now,
     * which is the same fact: everything a finished build writes is written
     * at the far end of it.
     */
    incomplete: boolean;
    /**
     * Null where the commit says nothing, or where the project has not said
     * where reviews and issues live.
     */
    review: string | null;
    issue: string | null;
    /** The issue's number, which is what the way to it is called. */
    issueId: string | null;
    /** Null for the trunk itself, which is cut from nothing. */
    base: Cut | null;
    tip: Tip | null;
}

/**
 * A branch nothing is checked out of. What a reader choosing one goes by is its
 * name, when it last moved, and what the commit on top of it is about --
 * "review/95618" says nothing on its own.
 */
export interface Branch {
    name: string;
    /** Seconds since the epoch. */
    when: number;
    tip: Tip | null;
    /**
     * A branch the remote does not have is here and nowhere else, which is the
     * one thing worth saying in a list before anybody checks it out.
     */
    onRemote: boolean;
}

/**
 * One branch, as the page about it reads it: everything a worktree would add is
 * missing because it does not exist.
 */
export interface BranchDetail extends Branch {
    base: Cut | null;
    /** Null where it tracks none. */
    upstream: string | null;
    ahead: number | null;
    behind: number | null;
    /** Every commit of it is in the project's own branch. */
    merged: boolean;
    /** It tracked a remote branch and the remote has it no longer. */
    gone: boolean;
    /** The worktree standing on it, where one does after all. */
    worktree: string | null;
}

/**
 * The short sha and not the whole one -- it is what git prints, what a reader
 * recognises and what is typed after "git show".
 */
export interface Commit {
    sha: string;
    subject: string;
    /** Seconds since the epoch. */
    when: number;
    author: string;
    /** What it is not is what would be lost. */
    pushed: boolean;
    /**
     * The commits above the cut. Everything is its own on the trunk, which has
     * no base.
     */
    own: boolean;
    /**
     * The project says the shape of that address in its own file -- the forge
     * is the project's, and a link guessed out of a remote is a link to a page
     * that may not be there.
     */
    url: string | null;
}

/**
 * The upstream is here rather than derived from the branch's name: a branch can
 * follow a remote branch called something else, and the question asked before
 * dropping commits has to name the right one.
 */
export interface Commits {
    upstream: string | null;
    /** Null for the trunk. */
    base: string | null;
    commits: Commit[];
    /** Whether there is anything behind this page of the log. */
    more: boolean;
}

/**
 * One commit as its own page reads it. The changes themselves are not here:
 * each is a door of its own, a commit that touched two hundred files not being
 * an answer anybody asked for in full.
 */
export interface CommitDetail extends Commit {
    /** The message under its subject, or "" where there is none. */
    body: string;
    /** The whole hash, which is what a commit is named by where it matters. */
    id: string;
    /** As git abbreviates them: what a merge has two of, and what leads back. */
    parents: string[];
    files: Change[];
}

/** One uncommitted file, and the one word for what happened to it. */
export interface Change {
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
    path: string;
}

export interface Changes {
    changes: Change[];
}

/** Space owned by a worktree; project-wide resources are deliberately absent. */
export interface DiskUsage {
    files: number;
    database: number;
    total: number;
}

/** The change in one file, as the lines the diff element draws. */
export interface ChangeDiff {
    path: string;
    lines: { kind: 'add' | 'del' | 'context'; text: string }[];
    truncated: boolean;
}

/**
 * What creating a worktree would run into, answered before it is created: the
 * version it will be served with -- null where that is read from a file that
 * does not exist yet -- and what the operation would stop on.
 */
export interface Preview {
    php: string | null;
    readFrom: string | null;
    warnings: string[];
}

/** The step being worked on, as the bar reads it. */
export interface JobStep {
    no: number;
    total: number;
    label: string;
}

/** One step of an operation, with what the tools wrote while it ran. */
export interface JobStepDetail {
    no: number;
    label: string;
    output: string;
    state: 'done' | 'running' | 'failed';
    /** How long it took, or has been running so far. */
    seconds: number;
}

export interface Job {
    id: string;
    status: 'running' | 'done' | 'failed' | 'unknown';
    /** Empty where it is about none. */
    subject: string;
    /** The console command it runs, which is what says what kind it is. */
    command: string;
    step: JobStep | null;
    /** Every step that has begun, in order. */
    steps: JobStepDetail[];
    elapsed: number;
    log: string;
    /**
     * It did not end; it stopped. The process is gone without an exit code and
     * the log breaks off mid-sentence.
     */
    interrupted: boolean;
}

/** One operation in the history of a worktree, as the list of them needs it. */
export interface JobSummary {
    id: string;
    command: string;
    status: Job['status'];
    elapsed: number;
    /** Seconds since the epoch. */
    started: number;
}

/**
 * It decides what the end of it says: a worktree that was built is opened and
 * logged into, one whose data was fetched is neither.
 */
export type JobKind = 'create' | 'sync' | 'pull' | 'restore' | 'discard' | 'remove' | 'fetch';

/** A running operation together with the worktree it concerns. */
export interface TrackedJob extends Job {
    expected: string | null;
    kind: JobKind;
}

/** A running operation, as much of it as a list needs. */
export interface RunningJob {
    id: string;
    /** Empty where it is about none. */
    subject: string;
    command: string;
    step: JobStep | null;
}

/** Without a kind the operation is asked what it is. */
export interface JobHandlers {
    onJob(job: string, expected?: string | null, kind?: JobKind | null): void;
}

export interface ServerState {
    /** Namespace of the addresses, e.g. site-new.ddev.site */
    tld: string;
    /** What DDEV calls this project, which is its name where it has no other */
    projectName: string;
    branch: string;
    project: Worktree | null;
    worktrees: Worktree[];
    /** Branches without a worktree, the one that moved last first */
    branches: Branch[];
    /** Remotes of the repository, origin first; empty without any */
    remotes: string[];
    /**
     * Null is the ordinary answer for a clone of a directory: it has a remote
     * and the remote has no page. Nothing is drawn then.
     */
    repository: string | null;
    phpVersions: string[];
    /**
     * Everything running right now, oldest first -- one operation per worktree,
     * and only enough of each to mark the row it belongs to.
     */
    runningJobs: RunningJob[];
    /**
     * Read rather than thrown, so a file with a typo in it costs the operations
     * and not the page: the list still stands, and the sentence says what to fix.
     */
    recipeProblem: string | null;
    /** Whether the project has said anything at all about how it is built. */
    unconfigured: boolean;
    /**
     * The project asks for another version than the one answering: a container
     * keeps the image it was made from, and an update that appears to have
     * worked is the worst shape one can take.
     */
    updateWaiting: boolean;
}

export interface AppState extends ServerState {
    strings: Record<string, string>;
    /** An answer is on its way; what draws a list draws its shape instead. */
    loading: boolean;
    language: string;
    /** The operation on the stage, where one is. */
    job: TrackedJob | null;
    error: string;
    /** The last attempt to read the project did not arrive. */
    unreachable: boolean;
}
