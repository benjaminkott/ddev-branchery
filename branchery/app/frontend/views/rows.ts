/**
 * A worktree as it is shown in the list, and the one checkout that stands over
 * it.
 *
 * All of it is drawing and none of it is the page: what a row is made of, the
 * badges that say how a build went and where a branch got to, and the block
 * above the rows for the project's own checkout -- which is of another kind,
 * the worktrees being cut from it. Kept apart from the overview because that
 * page is about which rows are shown and this is about what one looks like,
 * and the two answer to nothing of each other's.
 */

import { html, nothing, type TemplateResult } from 'lit';
import type { Row } from '@typo3/soul-frontend';
import { bar } from './waiting.js';
import { busyWith, doingWord, state, t } from '../state.js';
import { host, saying } from '../dom.js';
import type { Branch, RunningJob, Worktree } from '../types.js';

/**
 * Its name and what is being done, there being no address or database until the
 * operation has got that far. Not a link, either -- the page about it would
 * only say it does not exist.
 */
export function making(job: RunningJob): Row {
    return {
        cells: [
            {
                value: html`<span class="branchery-list__title">${job.subject}</span>`,
                note: doing(`${t('table.making')} · ${job.step?.label ?? doingWord(job.command)}`),
            },
            '',
            '',
            '',
        ],
    };
}

/** What is being done to a checkout, in the three places that say it. */
function doing(what: string): TemplateResult {
    return html`<span class="branchery-list__meta--busy"><sds-icon
                    class="sds-spinner" name="actions-circle-half" size="em"
                    aria-hidden="true"></sds-icon>${what}</span>`;
}

export function row(worktree: Worktree): Row {
    const busy = busyWith(worktree.name);

    return {
        cells: [
            {
                value: html`<a class="branchery-list__title" href="#/w/${worktree.name}">${worktree.name}</a>${
                    busy !== undefined ? nothing : mark(worktree)
                }`,
                // In the place of what was true a moment ago, so the row keeps its height
                // and nothing below it moves.
                note: busy === undefined ? described(worktree) : doing(busy),
            },
            outstanding(worktree),
            worktree.php,
            ways(worktree),
        ],
    };
}

/**
 * The word at the end is the way into the page about the worktree; the site is
 * the glyph beside it, a second way out without a second sentence. Both are
 * presses and not links: the end of a row is where a hand goes looking for
 * something to hit, and what it finds there has an edge.
 */
function ways(worktree: Worktree): TemplateResult {
    return html`
        <span class="branchery-list__ways">
            ${
                /* Named by where it goes: a dozen presses all called "open the site"
                  name nothing to whoever reads the page as a list. */ ''
            }
            <sds-button variant="secondary" size="sm" icon-only
                        href=${worktree.url} rel="external"
                        title=${t('table.openSiteAt', { host: host(worktree.url) })}><sds-icon
                name="actions-window-open" size="16"></sds-icon></sds-button>
            ${saying(
                t('table.view'),
                html`<sds-button variant="secondary" size="sm" href="#/w/${worktree.name}"
                        title=${t('table.viewOf', { name: worktree.name })}>${t('table.view')}</sds-button>`,
            )}
        </span>`;
}

/**
 * One word to the browser, it broke wherever the column ran out. The
 * opportunities are elements and not characters, so what is copied out of the
 * cell is still the name.
 */
function breakable(name: string): TemplateResult[] {
    return name.split('_').map((part, index) => (index === 0 ? html`${part}` : html`_<wbr>${part}`));
}

/**
 * A state and never a count, the numbers having a column of their own. Three
 * questions, each answered at most once -- how the build went, where the branch
 * got to (merged wins over gone, being the more useful), and whether what is
 * installed still matches what is checked out.
 */
function mark(worktree: Worktree): TemplateResult {
    return html`${built(worktree)}${became(worktree)}${
        worktree.stale ? html` <sds-badge label=${t('table.staleMark')} tone="warn"></sds-badge>` : nothing
    }`;
}

function built(worktree: Worktree): TemplateResult | typeof nothing {
    if (!worktree.ready) {
        return html` <sds-badge label=${t('table.unbuilt')} tone="warn"></sds-badge>`;
    }
    if (worktree.incomplete) {
        return html` <sds-badge label=${t('table.unfinished')} tone="warn"></sds-badge>`;
    }

    return nothing;
}

function became(worktree: Worktree): TemplateResult | typeof nothing {
    if (worktree.merged) {
        // The one badge of the set that is not a warning: work that arrived where
        // it was going is the good end of a worktree.
        return html` <sds-badge label=${t('table.mergedMark')} tone="ok"></sds-badge>`;
    }
    if (worktree.gone) {
        return html` <sds-badge label=${t('table.goneMark')} tone="warn"></sds-badge>`;
    }

    return nothing;
}

/**
 * Over the worktrees rather than among them: it is of another kind -- they are
 * cut from it, and it is the one checkout Branchery neither made nor can
 * remove. Its PHP, database and address are stated as facts, which is worth
 * doing once and was the name written out three times in every row.
 */
export function checkout(): TemplateResult | typeof nothing {
    const project = state.project;
    if (project === null) {
        return state.loading ? waitingCheckout() : nothing;
    }
    const busy = busyWith(project.name);

    return checkoutBlock({
        name: html`<a class="branchery-checkout__name"
                      href="#/w/${project.name}">${project.name}</a>${busy !== undefined ? nothing : mark(project)}`,
        meta: busy === undefined ? html`${described(project)}${settlement(project)}` : doing(busy),
        php: project.php,
        database: html`<code class="sds-mono">${breakable(project.database)}</code>`,
        address: html`<sds-link external href=${project.url} label=${host(project.url)}></sds-link>`,
    });
}

/**
 * It stands between the name and the list, so its arrival would push the list
 * down under a reader already looking at it; its shape is fixed, so bars can
 * stand in it.
 */
function waitingCheckout(): TemplateResult {
    return checkoutBlock({
        name: html`<span class="branchery-checkout__name">${bar(0, 'branchery-waiting__title')}</span>`,
        meta: bar(1),
        php: bar(0),
        database: bar(1),
        address: bar(2),
    });
}

interface Checkout {
    name: TemplateResult;
    meta: TemplateResult;
    php: TemplateResult | string;
    database: TemplateResult;
    address: TemplateResult;
}

/**
 * Written once because the shape is the whole point of drawing it twice: kept
 * apart, the two drift the moment a fact is added to one of them.
 */
function checkoutBlock(shown: Checkout): TemplateResult {
    return html`
        <div class="branchery-checkout">
            <p class="sds-label">${t('overview.checkout')}</p>
            <div class="branchery-checkout__body">
                <div class="branchery-checkout__what">
                    ${shown.name}
                    <p class="branchery-checkout__meta">${shown.meta}</p>
                </div>
                <dl class="sds-facts branchery-checkout__facts">
                    <dt>${t('table.php')}</dt>
                    <dd>${shown.php}</dd>
                    <dt>${t('table.database')}</dt>
                    <dd>${shown.database}</dd>
                    <dt>${t('table.address')}</dt>
                    <dd>${shown.address}</dd>
                </dl>
            </div>
        </div>`;
}

/**
 * Said only where there is a remote for the branch to be missing from: without
 * one it is true of every branch.
 */
export function aboutBranch(branch: Branch): TemplateResult {
    const nowhere = !branch.onRemote && state.remotes.length > 0;

    return html`${nowhere ? html`<span>${t('table.nowhere')}</span>` : nothing}${
        branch.tip === null
            ? nothing
            : html`<span
            class="branchery-list__tip">${branch.tip.subject} · ${branch.tip.sha}</span>`
    }`;
}

/**
 * One line, cut off rather than wrapped -- five clauses joined by dots came to
 * four lines in every row. The subject is what a graph puts at every tip:
 * "[TASK] Register the event listeners by attribute" names a piece of work
 * faster than task/cleanup-and-docs does. Without its hash, which is a thing to
 * copy and not to scan.
 */
function described(worktree: Worktree): TemplateResult {
    return html`<span class="branchery-list__what">${worktree.branch}${
        worktree.tip === null ? nothing : html` · ${worktree.tip.subject}`
    }</span>`;
}

/**
 * Three counts of the same kind -- work that is somewhere it will not stay --
 * which is one movement of the eye rather than eleven sentences read to the
 * end. A quiet row says nothing: a dash in each is a column of dashes.
 */
function outstanding(worktree: Worktree): TemplateResult | string {
    const said = unsettled(worktree);

    return said.length === 0
        ? ''
        : html`${said.map((line) => html`<span class="branchery-list__count">${line}</span>`)}`;
}

/** The same counts where there is no column to hold them, joined into a line. */
function settlement(worktree: Worktree): TemplateResult | typeof nothing {
    const said = unsettled(worktree);

    return said.length === 0 ? nothing : html`<span class="branchery-list__count">${said.join(' · ')}</span>`;
}

function unsettled(worktree: Worktree): string[] {
    const said = [];
    if (worktree.changes > 0) {
        said.push(t('table.changes', { count: worktree.changes }));
    }
    if (worktree.ahead !== null && worktree.ahead > 0) {
        said.push(t('table.unpushed', { count: worktree.ahead }));
    }
    if (worktree.behind !== null && worktree.behind > 0) {
        said.push(t('table.behind', { count: worktree.behind }));
    }

    return said;
}
