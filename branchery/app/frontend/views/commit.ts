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

import { html, nothing, type TemplateResult } from 'lit';
import { api } from '../api.js';
import { buildWayOut, formatWhen } from '../dom.js';
import { reader } from '../rules/reading.js';
import { errorSentence, state, t } from '../state.js';
import { aside, readInto } from '../rules/aside.js';
import type { ChangeDiff, CommitDetail } from '../types.js';
import { backTo } from './back.js';
import { waiting } from './waiting.js';
import { fileList, keepDiff, type Shown, toggleFile } from './files.js';
import { View } from './view.js';

/**
 * The checkout and the hash together: the same commit read on another branch is
 * another page, with another way back.
 */
function keyOf(name: string, sha: string): string {
    return `${name}\u001f${sha}`;
}

export class CommitView extends View {
    /** Where the reader came in: the worktree, or the empty name for a branch. */
    name = '';

    sha = '';

    /** The branch it was read on, where it was read on one rather than in a worktree. */
    branch = '';

    /**
     * Kept until another is opened. A commit does not change, so nothing here is
     * ever read a second time for the same sha; what makes it stale is the reader
     * going somewhere else.
     */
    private readonly read = aside<CommitDetail>();

    /** The change in each file the reader opened, and whether the rest are shown. */
    private diffs = new Map<string, Shown<ChangeDiff>>();

    private all = false;

    private readonly reading = reader(errorSentence, () => this.requestUpdate());

    /** The checkout it is read out of, which for a branch is the project's own. */
    private get of(): string {
        return this.branch === '' ? this.name : state.projectName;
    }

    override willUpdate(): void {
        const of = this.of;
        if (this.read.about(keyOf(of, this.sha))) {
            this.diffs = new Map();
            this.all = false;
            void this.readCommit(of, this.sha);
        }
    }

    /**
     * Where the reader came in: the worktree the commit was read in, or the branch.
     * Not the checkout it was read out of -- for a branch that is the project,
     * which is a page the reader never saw.
     */
    override render(): TemplateResult {
        const of = this.of;
        const commit = this.read.of(keyOf(of, this.sha));

        return html`
      <div class="sds-bands">
        <section class="sds-band">
            ${
                this.branch === ''
                    ? backTo(this.name, `#/w/${encodeURIComponent(this.name)}`)
                    : backTo(this.branch, `#/b/${encodeURIComponent(this.branch)}`)
            }
            ${commit === null ? this.beforeTheAnswer(of, this.sha) : head(of, commit, this.branch)}
        </section>
        ${commit === null ? nothing : this.touched(of, commit)}
      </div>`;
    }

    /**
     * A sha that this checkout does not carry is the ordinary way this page is
     * wrong, so what is said is what the container said, under the hash asked about.
     */
    private beforeTheAnswer(of: string, sha: string): TemplateResult {
        const trouble = this.read.trouble(keyOf(of, sha));

        // The hash under the way back either way: it is in the address, so it is
        // true before anything is read, and it is the title the page keeps once the
        // subject arrives beside it.
        return html`
        <h1 class="sds-h2"><span class="sds-mono">${sha}</span></h1>
        ${
            trouble === ''
                ? waiting()
                : html`<sds-note tone="warn" body=${`${t('detail.commitFailed')} ${trouble}`}></sds-note>`
        }`;
    }

    /**
     * A merge has nothing here, which is git's own answer to what a merge changed.
     * Said in a sentence rather than left as an empty list, which under a heading
     * reads as an answer that failed to arrive.
     */
    private touched(of: string, commit: CommitDetail): TemplateResult {
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
                          diffs: this.diffs,
                          press: (path) => this.toggleDiff(of, commit.sha, path),
                          all: this.all,
                          showAll: () => {
                              this.all = true;
                              this.requestUpdate();
                          },
                      })
            }
        </section>`;
    }

    private toggleDiff(of: string, sha: string, path: string): void {
        toggleFile(this.diffs, path, () => void this.readDiff(of, sha, path));
        this.requestUpdate();
    }

    /** Whether an answer about a commit is still wanted: this one, still on the page. */
    private stillReading(of: string, sha: string): boolean {
        return this.read.stillOn(keyOf(of, sha));
    }

    private async readCommit(name: string, sha: string): Promise<void> {
        await readInto(this.read, keyOf(name, sha), () => api.commit(name, sha), this.reading);
    }

    private async readDiff(of: string, sha: string, path: string): Promise<void> {
        await this.reading(
            () => api.commitDiff(of, sha, path),
            // The file has to be open still, and not only the commit: what was asked
            // for is the change in one row of a list the reader closed.
            () => this.stillReading(of, sha) && this.diffs.has(path),
            (diff, trouble) => keepDiff(this.diffs, path, diff, trouble),
        );
    }
}

customElements.define('branchery-commit', CommitView);

/**
 * The message is set as it stands, line breaks and all: a commit message is
 * written to be read at a fixed width, and a body reflowed into a paragraph
 * turns a list of three points into one sentence with dashes in it.
 */
function head(of: string, commit: CommitDetail, branch: string): TemplateResult {
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
                    (parent, at) => html`${at === 0 ? nothing : ' \u00b7 '}<sds-link
                    href=${
                        branch === ''
                            ? `#/w/${encodeURIComponent(of)}/c/${parent}`
                            : `#/b/${encodeURIComponent(branch)}/c/${parent}`
                    } label=${parent}></sds-link>`,
                )}</dd>`
            }
        </dl>
        ${commit.body === '' ? nothing : html`<pre class="branchery-message">${commit.body}</pre>`}`;
}
