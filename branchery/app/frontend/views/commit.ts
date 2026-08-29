/**
 * One commit, in full: the page behind a subject, which raises exactly the
 * question it cannot answer.
 *
 * It has an address of its own -- #/w/<name>/c/<sha>, or #/b/<branch>/c/<sha>
 * for a commit read on a branch that has no worktree -- and that address
 * outlives the branch: a sha this checkout no longer carries is a page saying
 * so. One repository holds the object, so the way back is what differs.
 *
 * The changes themselves are a door each.
 */

import { html, nothing, render, type TemplateResult } from 'lit';
import { api } from '../api.js';
import { buildWayOut, formatWhen, query } from '../dom.js';
import { reader } from '../reading.js';
import { currentRoute } from '../router.js';
import { stillOn } from '../routes.js';
import { errorSentence, state, t } from '../state.js';
import type { ChangeDiff, CommitDetail } from '../types.js';
import { backTo } from './back.js';
import { waiting } from './waiting.js';
import { fileList, keepDiff, type Shown, toggleFile } from './files.js';

/**
 * `where` is where the reader came from: a worktree by name, or a branch that
 * has none. `name` is the checkout the commit is read out of, which for a
 * branch is the project's own.
 */
interface Opened {
    name: string;
    sha: string;
    branch: string;
}

let showing: Opened | null = null;

/**
 * Kept until another is opened. A commit does not change, so nothing here is
 * ever read a second time for the same sha; what makes it stale is the reader
 * going somewhere else.
 */
let read: { name: string; sha: string; commit: CommitDetail | null; trouble: string } = {
    name: '',
    sha: '',
    commit: null,
    trouble: '',
};

/** The change in each file the reader opened, and whether the rest are shown. */
let diffs = new Map<string, Shown<ChangeDiff>>();
let all = false;

const reading = reader(errorSentence, again);

/**
 * The reader has gone somewhere else: an answer still on its way is dropped,
 * since drawing it would put this page back over the one they went to.
 */
export function leaveCommit(): void {
    showing = null;
}

/**
 * Read where it lies: in a worktree, or -- with a branch given -- out of the
 * project's own checkout, which holds every branch's commits.
 */
export function renderCommit(name: string, sha: string, branch = ''): void {
    const of = branch === '' ? name : state.projectName;
    showing = { name: of, sha, branch };
    if (read.name !== of || read.sha !== sha) {
        read = { name: of, sha, commit: null, trouble: '' };
        diffs = new Map();
        all = false;
        void readCommit(of, sha);
    }

    render(page(of, sha, branch), query<HTMLElement>('#main'));
}

/** Whether an answer about a commit is still wanted: this one, on this view. */
function onPage(opened: Opened): boolean {
    return (
        showing?.name === opened.name &&
        showing.sha === opened.sha &&
        showing.branch === opened.branch &&
        stillOn(currentRoute(), {
            view: 'commit',
            name: opened.branch === '' ? opened.name : '',
            sha: opened.sha,
            branch: opened.branch,
        })
    );
}

function again(): void {
    if (showing !== null && onPage(showing)) {
        renderCommit(showing.branch === '' ? showing.name : '', showing.sha, showing.branch);
    }
}

/**
 * Where the reader came in: the worktree the commit was read in, or the branch.
 * Not the checkout it was read out of -- for a branch that is the project,
 * which is a page the reader never saw.
 */
function page(name: string, sha: string, branch: string): TemplateResult {
    const commit = read.commit;

    return html`
      <div class="sds-bands">
        <section class="sds-band">
            ${
                branch === ''
                    ? backTo(name, `#/w/${encodeURIComponent(name)}`)
                    : backTo(branch, `#/b/${encodeURIComponent(branch)}`)
            }
            ${commit === null ? beforeTheAnswer(sha) : head(commit, branch)}
        </section>
        ${commit === null ? nothing : touched(name, commit)}
      </div>`;
}

/**
 * A sha that this checkout does not carry is the ordinary way this page is
 * wrong, so what is said is what the container said, under the hash asked about.
 */
function beforeTheAnswer(sha: string): TemplateResult {
    // The hash under the way back either way: it is in the address, so it is
    // true before anything is read, and it is the title the page keeps once the
    // subject arrives beside it.
    return html`
        <h1 class="sds-h2"><span class="sds-mono">${sha}</span></h1>
        ${
            read.trouble === ''
                ? waiting()
                : html`<sds-note tone="warn" body=${`${t('detail.commitFailed')} ${read.trouble}`}></sds-note>`
        }`;
}

/**
 * The message is set as it stands, line breaks and all: a commit message is
 * written to be read at a fixed width, and a body reflowed into a paragraph
 * turns a list of three points into one sentence with dashes in it.
 */
function head(commit: CommitDetail, branch: string): TemplateResult {
    return html`
        <div class="sds-row">
            <h1 class="sds-h2">
                ${commit.subject}
                ${commit.pushed ? nothing : html`<sds-badge label=${t('detail.notPushed')} tone="warn"></sds-badge>`}
            </h1>
            <span class="sds-row sds-row__end">
                ${commit.url === null ? nothing : html`${buildWayOut(commit.url, t('detail.commitAtForge'))}`}
            </span>
        </div>
        <dl class="sds-facts">
            <dt>${t('table.author')}</dt>
            <dd>${commit.author}</dd>
            <dt>${t('table.when')}</dt>
            <dd>${formatWhen(commit.when, state.language)}</dd>
            <dt>${t('table.commit')}</dt>
            ${
                /* The whole hash and not the short one: what is taken from here is
                  pasted after "git show" or into a forge's search, and how far this
                  repository abbreviates is not how far the next one does. */ ''
            }
            <dd><sds-copy value=${commit.id} label=${t('table.commit')}></sds-copy></dd>
            ${
                commit.parents.length === 0
                    ? nothing
                    : html`
                <dt>${t('detail.parents')}</dt>
                ${
                    /* The commit before it is read where this one was read: following a
                      parent out of a branch into the project's own page would be a way
                      out nobody asked for. */ ''
                }
                <dd>${commit.parents.map(
                    (parent, at) => html`${at === 0 ? nothing : ' · '}<sds-link
                    href=${
                        branch === ''
                            ? `#/w/${encodeURIComponent(read.name)}/c/${parent}`
                            : `#/b/${encodeURIComponent(branch)}/c/${parent}`
                    } label=${parent}></sds-link>`,
                )}</dd>`
            }
        </dl>
        ${commit.body === '' ? nothing : html`<pre class="branchery-message">${commit.body}</pre>`}`;
}

/**
 * A merge has nothing here, which is git's own answer to what a merge changed.
 * Said in a sentence rather than left as an empty list, which under a heading
 * reads as an answer that failed to arrive.
 */
function touched(name: string, commit: CommitDetail): TemplateResult {
    return html`
        <section class="sds-band sds-band--quiet">
            ${
                /* A heading counting to nothing says nothing: where a merge changed no
                  file, the noun stands alone and the sentence under it says why. */ ''
            }
            <h2 class="sds-h3">${
                commit.files.length === 0
                    ? t('detail.touchedNothingHeading')
                    : t('detail.touched', { count: commit.files.length })
            }</h2>
            ${
                commit.files.length === 0
                    ? html`<p class="branchery-list__quiet">${t('detail.touchedNothing')}</p>`
                    : fileList({
                          files: commit.files,
                          diffs,
                          press: (path) => toggleDiff(name, commit.sha, path),
                          all,
                          showAll: () => {
                              all = true;
                              again();
                          },
                      })
            }
        </section>`;
}

function toggleDiff(name: string, sha: string, path: string): void {
    toggleFile(diffs, path, () => void readDiff(name, sha, path));
    again();
}

/** Whether an answer about a commit is still wanted: this one, still on the page. */
function stillReading(name: string, sha: string): boolean {
    return read.name === name && read.sha === sha;
}

async function readCommit(name: string, sha: string): Promise<void> {
    await reading(
        () => api.commit(name, sha),
        () => stillReading(name, sha),
        (commit, trouble) => {
            read = { name, sha, commit, trouble };
        },
    );
}

async function readDiff(name: string, sha: string, path: string): Promise<void> {
    await reading(
        () => api.commitDiff(name, sha, path),
        // The file has to be open still, and not only the commit: what was asked
        // for is the change in one row of a list the reader closed.
        () => stillReading(name, sha) && diffs.has(path),
        (diff, trouble) => keepDiff(diffs, path, diff, trouble),
    );
}
