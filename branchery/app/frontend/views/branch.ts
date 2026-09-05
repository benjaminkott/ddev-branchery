/**
 * One branch that nothing is checked out of, answering the question that used to
 * cost a worktree: what is actually on this branch -- four commits or four
 * hundred, cut from what, in the trunk already or not.
 *
 * Not a worktree's page with the fields left empty: there is no address, no
 * database and no build, because none of those exists yet, and drawing them
 * with dashes would say something is missing rather than never made.
 *
 * The one press opens the wizard rather than creating anything.
 */

import { html, nothing, type TemplateResult } from 'lit';
import { api } from '../api.js';
import { formatWhen, saying } from '../dom.js';
import { reader } from '../rules/reading.js';
import { errorSentence, state, t } from '../state.js';
import { aside } from '../rules/aside.js';
import type { BranchDetail, JobHandlers } from '../types.js';
import { backTo } from './back.js';
import { commitLog } from './commits.js';
import { type FactGroup, shownGroup, sinceBase } from './facts.js';
import { openCreate } from './create.js';
import { waiting } from './waiting.js';
import { View } from './view.js';

export type BranchHandlers = JobHandlers;

export class BranchView extends View {
    /** Which branch this page is about, out of the address. */
    name = '';

    /** Set by the shell, which is what a press here reaches an operation through. */
    handlers!: BranchHandlers;

    /** What was read about it, and about which branch -- see aside.ts. */
    private readonly read = aside<BranchDetail>();

    private readonly reading = reader(errorSentence, () => this.requestUpdate());

    /** Its commits, read a page at a time -- the same holder the worktree keeps. */
    private readonly log = commitLog(
        (name, skip) => api.branchCommits(name, skip),
        this.reading,
        () => this.requestUpdate(),
    );

    override willUpdate(): void {
        if (this.read.about(this.name)) {
            void this.readBranch(this.name);
        }
        this.log.about(this.name);
    }

    override render(): TemplateResult {
        const name = this.name;
        const branch = this.read.of(name);

        return html`
      <div class="sds-bands">
        <section class="sds-band">
            ${state.error === '' ? nothing : html`<sds-note tone="error" body=${state.error}></sds-note>`}
            ${backTo(t('detail.back'), '#/')}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${name}</span>
                    ${branch === null ? nothing : marks(branch)}
                </h1>
            </div>
            ${branch === null ? this.beforeTheAnswer(name) : this.offer(branch)}
        </section>
        ${
            branch === null
                ? nothing
                : html`
            <section class="sds-band sds-band--quiet">
                <h2 class="sds-h3">${t('detail.settled')}</h2>
                <div class="sds-facts-set">${groups(branch).map(shownGroup)}</div>
            </section>`
        }
        ${
            /* Where the branch itself could not be read there is nothing to say
              about its commits either, and the head above has said why. */
            branch === null && this.read.trouble(name) !== '' ? nothing : this.commits(name)
        }
      </div>`;
    }

    /**
     * A branch name in an address outlives the branch, so what is said is what the
     * container said, under the name that was asked about.
     */
    private beforeTheAnswer(name: string): TemplateResult {
        const trouble = this.read.trouble(name);

        return trouble === '' ? waiting() : html`<sds-note tone="warn" body=${trouble}></sds-note>`;
    }

    /**
     * A branch reached from the list has no worktree by definition -- but an address
     * outlives the list it was read in, and offering a second checkout of a branch
     * that has one is offering an operation that will be refused.
     */
    private offer(branch: BranchDetail): TemplateResult {
        if (branch.worktree !== null) {
            return html`
            <p class="branchery-list__quiet">${t('detail.branchHasWorktree')}
                <sds-link href=${`#/w/${encodeURIComponent(branch.worktree)}`}
                          label=${branch.worktree}></sds-link></p>`;
        }

        return html`
        <div class="sds-row">
            ${saying(
                t('nav.newWorktree'),
                html`<sds-button variant="primary"
                        @click=${() => openCreate(this.handlers, branch.name)}>${t('nav.newWorktree')}</sds-button>`,
            )}
        </div>`;
    }

    /**
     * The same table the worktree's page draws, because it is the same reading; what
     * differs is where a subject leads.
     */
    private commits(name: string): TemplateResult {
        const trouble = this.log.trouble(name);

        // The band is drawn before the answer is here, as the shape it will have:
        // holding it back left the page one band tall until it arrived and then
        // three.
        return html`
        <section class="sds-band">
            <h2 class="sds-h3">${t('detail.commitsHeading')}</h2>
            ${
                trouble === ''
                    ? this.log.body(name, (sha) => `#/b/${encodeURIComponent(name)}/c/${sha}`)
                    : html`<sds-note tone="warn" body=${trouble}></sds-note>`
            }
        </section>`;
    }

    private async readBranch(name: string): Promise<void> {
        await this.reading(
            () => api.branch(name),
            () => this.read.stillOn(name),
            (branch, trouble) => {
                if (branch === null) {
                    this.read.failed(name, trouble);

                    return;
                }
                this.read.put(name, branch);
            },
        );
    }
}

customElements.define('branchery-branch', BranchView);

/**
 * It is in the trunk already, its remote has dropped it, or it is here and
 * nowhere else -- the same three words the list uses.
 */
function marks(branch: BranchDetail): TemplateResult | typeof nothing {
    if (branch.merged) {
        return html`<sds-badge label=${t('table.merged', { branch: state.project?.branch ?? state.branch })}
                               tone="neutral"></sds-badge>`;
    }
    if (branch.gone) {
        return html`<sds-badge label=${t('table.gone')} tone="warn"></sds-badge>`;
    }
    if (!branch.onRemote && state.remotes.length > 0) {
        return html`<sds-badge label=${t('table.nowhere')} tone="warn"></sds-badge>`;
    }

    return nothing;
}

/** Where the branch stands, in the rows the worktree's page says the same in. */
function groups(branch: BranchDetail): FactGroup[] {
    return [
        {
            title: t('detail.repository'),
            facts: [
                ...(branch.base === null
                    ? []
                    : [
                          { label: t('detail.base'), value: branch.base.branch },
                          { label: t('detail.sinceBase'), value: sinceBase(branch.base), said: true },
                      ]),
                { label: t('detail.commits'), value: standing(branch), said: true },
                { label: t('detail.moved'), value: formatWhen(branch.when, state.language), said: true },
            ],
        },
    ];
}

/**
 * And, for a branch that is only on the remote, that it is what its own remote
 * has: it tracks nothing because it is the thing tracked.
 */
function standing(branch: BranchDetail): string {
    if (branch.gone) {
        return t('table.gone');
    }
    if (branch.upstream === null) {
        return branch.onRemote ? t('detail.onRemoteOnly') : t('detail.noRemote');
    }

    const apart = [
        ...(branch.ahead !== null && branch.ahead > 0 ? [t('table.unpushed', { count: branch.ahead })] : []),
        ...(branch.behind !== null && branch.behind > 0 ? [t('table.behind', { count: branch.behind })] : []),
    ];

    return apart.length === 0 ? t('detail.inStep') : `${branch.upstream} · ${apart.join(' · ')}`;
}
