/** Access to the REST API under /api. */

import type {
    BranchDetail,
    ChangeDiff,
    Changes,
    CommitDetail,
    Commits,
    DiskUsage,
    Job,
    JobSummary,
    Preview,
    ServerState,
} from './types.js';

const BASE = '/api';

/** An answer the container gave, with the status it gave it under. */
export class ApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
    }
}

/**
 * No answer from the container: what came back was said by something in front of
 * it. The same thing to the page as a request that never arrived, and kept apart
 * from `ApiError`, which is a sentence the project had to say.
 */
export class UnreachableError extends Error {
    constructor(readonly status: number) {
        super(`No answer from the container, only a ${status} from in front of it.`);
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = options.body ? { 'Content-Type': 'application/json' } : {};
    const response = await fetch(`${BASE}/${path}`, { ...options, headers });

    if (!response.ok && unanswered(response.status, response.headers.get('Content-Type'))) {
        throw new UnreachableError(response.status);
    }

    const data: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = (data as { error?: string }).error;
        throw new ApiError(message ?? `Request failed with status ${response.status}`, response.status);
    }
    return data as T;
}

/**
 * The container answers JSON and nothing else, but it stands behind DDEV's
 * router, which answers for it while it is away: "404 page not found" in plain
 * text, or a bad gateway for one not yet listening. Both used to reach the page
 * as "Request failed with status 404", over a list that was fine.
 *
 * Only those statuses, and only without JSON: a 500 from the container itself
 * is the application having broken.
 */
export function unanswered(status: number, contentType: string | null): boolean {
    const json = (contentType ?? '').split(';')[0]?.trim().toLowerCase() === 'application/json';

    return !json && GATEWAY_STATUSES.includes(status);
}

const GATEWAY_STATUSES = [404, 502, 503, 504];

export const api = {
    state: (): Promise<ServerState> => request<ServerState>('state'),

    createWorktree: (payload: Record<string, string>): Promise<{ job: string }> =>
        request<{ job: string }>('worktrees', { method: 'POST', body: JSON.stringify(payload) }),

    /** What creating that worktree would run into -- asked before it is. */
    preview: (query: Record<string, string>): Promise<Preview> =>
        request<Preview>(`worktrees/preview?${new URLSearchParams(query).toString()}`),

    updateWorktree: (name: string, payload: Record<string, string>): Promise<{ job?: string }> =>
        request<{ job?: string }>(`worktrees/${encodeURIComponent(name)}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),

    /** With `fresh` the database goes and the application is installed anew. */
    provisionWorktree: (name: string, fresh = false): Promise<{ job: string }> =>
        request<{ job: string }>(`worktrees/${encodeURIComponent(name)}/provision`, {
            method: 'POST',
            body: JSON.stringify({ fresh }),
        }),

    syncWorktree: (name: string, from = ''): Promise<{ job: string }> =>
        request<{ job: string }>(`worktrees/${encodeURIComponent(name)}/sync`, {
            method: 'POST',
            body: JSON.stringify(from !== '' ? { from } : {}),
        }),

    /** Its branch onto what the remote has; nothing else about it is touched. */
    pullWorktree: (name: string): Promise<{ job: string }> =>
        request<{ job: string }>(`worktrees/${encodeURIComponent(name)}/pull`, { method: 'POST' }),

    /**
     * A page at a time: what is skipped is what the reader has already been shown,
     * so asking for more is asking from where the list ends.
     */
    commits: (name: string, skip = 0): Promise<Commits> =>
        request<Commits>(`worktrees/${encodeURIComponent(name)}/commits${skip > 0 ? `?skip=${skip}` : ''}`),

    /**
     * Behind the question mark and not in the path: a branch name carries slashes,
     * and a path segment that may hold one cannot say where it ends.
     */
    branch: (name: string): Promise<BranchDetail> => request<BranchDetail>(`branch?branch=${encodeURIComponent(name)}`),

    /** What is on it, newest first, a page at a time -- as for a worktree. */
    branchCommits: (name: string, skip = 0): Promise<Commits> =>
        request<Commits>(`branch/commits?branch=${encodeURIComponent(name)}${skip > 0 ? `&skip=${skip}` : ''}`),

    /** One of them in full: its message, what it leads back to, what it touched. */
    commit: (name: string, sha: string): Promise<CommitDetail> =>
        request<CommitDetail>(`worktrees/${encodeURIComponent(name)}/commits/${encodeURIComponent(sha)}`),

    /** The change that commit made to one file. */
    commitDiff: (name: string, sha: string, path: string): Promise<ChangeDiff> =>
        request<ChangeDiff>(
            `worktrees/${encodeURIComponent(name)}/commits/${encodeURIComponent(sha)}/diff?path=${encodeURIComponent(path)}`,
        ),

    /** What is uncommitted in it, file by file. */
    changes: (name: string): Promise<Changes> => request<Changes>(`worktrees/${encodeURIComponent(name)}/changes`),

    /** The checkout and database owned by one worktree, measured on demand. */
    worktreeUsage: (name: string): Promise<DiskUsage> =>
        request<DiskUsage>(`worktrees/${encodeURIComponent(name)}/usage`),

    /** The change in one of those files, against the last commit. */
    changeDiff: (name: string, path: string): Promise<ChangeDiff> =>
        request<ChangeDiff>(`worktrees/${encodeURIComponent(name)}/changes/diff?path=${encodeURIComponent(path)}`),

    /** Its branch back on the remote, dropping what it carried alone. */
    discardWorktree: (name: string): Promise<{ job: string }> =>
        request<{ job: string }>(`worktrees/${encodeURIComponent(name)}/discard`, { method: 'POST' }),

    /** Back onto the branch it was made for, and up to date on it. */
    restoreWorktree: (name: string): Promise<{ job: string }> =>
        request<{ job: string }>(`worktrees/${encodeURIComponent(name)}/restore`, { method: 'POST' }),

    accountWorktree: (name: string): Promise<{ job: string }> =>
        request<{ job: string }>(`worktrees/${encodeURIComponent(name)}/account`, { method: 'POST' }),

    removeWorktree: (name: string): Promise<{ job: string }> =>
        request<{ job: string }>(`worktrees/${encodeURIComponent(name)}`, { method: 'DELETE' }),

    fetch: (remote?: string): Promise<{ job: string }> =>
        request<{ job: string }>('fetch', {
            method: 'POST',
            body: JSON.stringify(remote !== undefined ? { remote } : {}),
        }),

    /**
     * What has happened since the last look, which is what `since` says -- the
     * size the last answer reported. Asked once a second while an operation runs,
     * and its log is the largest thing this interface ever reads.
     */
    job: (id: string, since = 0): Promise<Job> =>
        request<Job>(`jobs/${encodeURIComponent(id)}${since > 0 ? `?since=${since}` : ''}`),

    /** Everything that was done to one worktree, newest first. */
    worktreeJobs: (name: string): Promise<JobSummary[]> => request(`worktrees/${encodeURIComponent(name)}/jobs`),
};
