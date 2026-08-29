/**
 * Changing what a worktree runs on. The version is picked and nothing happens
 * until the last stop: a control that acts the moment it is touched gives
 * nobody the chance to think better of it.
 */

import { html, render } from 'lit';
import type { SdsNote } from '@typo3/soul-frontend';
import { api } from '../api.js';
import { buildChoice, compareVersions, maybe } from '../dom.js';
import { errorSentence, refresh, reportError, setError, state, t } from '../state.js';
import type { Worktree } from '../types.js';
import { closeWizard, runFlow, type Flow, type FlowStep } from './wizard.js';

/** One change the summary lists: what is set, its new value, and what that means. */
interface Effect {
    label: string;
    value: string;
    note: string;
}

export function openEdit(worktree: Worktree): void {
    const answers = { php: worktree.php };

    // One row per change, said as the summary of a creation says its facts.
    const pending = (): Effect[] => {
        const effects: Effect[] = [];
        if (answers.php !== worktree.php) {
            effects.push({ label: t('table.php'), value: answers.php, note: t('edit.effect.php') });
        }

        return effects;
    };

    const flow: Flow = {
        steps: [phpStep(worktree, answers), reviewStep(worktree, pending)],
        finishLabel: () => t('action.apply'),
        finish: () => apply(worktree, answers),
    };

    runFlow(flow);
}

/**
 * Only what this worktree can actually run, and the version it runs on whatever
 * that is -- the same rule the row follows.
 */
function phpStep(worktree: Worktree, answers: { php: string }): FlowStep {
    return {
        label: t('table.php'),
        heading: t('edit.step.php.heading', { name: worktree.name }),
        lead: t('edit.step.php.lead'),
        // The version it already runs on is not an answer to this question: going
        // on with it reaches a summary of nothing and a button that cannot be
        // pressed, which is a dead end with a Back button.
        ready: () => answers.php !== worktree.php,
        enter(body, control) {
            const versions = state.phpVersions.filter(
                (version) =>
                    version === worktree.php ||
                    worktree.minPhp === null ||
                    compareVersions(version, worktree.minPhp) >= 0,
            );

            render(
                html`${buildChoice(
                    versions.map((version) => ({
                        value: version,
                        label: version,
                        ...(version === worktree.php ? { hint: t('edit.current') } : {}),
                    })),
                    answers.php,
                    (value) => {
                        answers.php = value;
                        control.update();
                    },
                    t('table.php'),
                )}`,
                body,
            );
        },
    };
}

/**
 * The stop before this one only lets go once there is something to say here, so
 * there is no empty case to draw.
 */
function reviewStep(worktree: Worktree, pending: () => Effect[]): FlowStep {
    return {
        label: t('step.review.label'),
        heading: t('edit.step.review.heading', { name: worktree.name }),
        lead: t('step.review.lead'),
        enter(body) {
            render(
                html`
                <div class="branchery-preview">
                    <dl>
                        ${pending().map(
                            (effect) => html`
                            <dt>${effect.label}</dt>
                            <dd>${effect.value}<span class="branchery-preview__note">${effect.note}</span></dd>`,
                        )}
                    </dl>
                </div>
                <sds-note tone="error" id="editError" hidden></sds-note>`,
                body,
            );
        },
    };
}

/** What was picked, sent off; the version takes effect at once. */
async function apply(worktree: Worktree, answers: { php: string }): Promise<void> {
    try {
        if (answers.php !== worktree.php) {
            await api.updateWorktree(worktree.name, { php: answers.php });
        }
        setError('');
        await refresh();
        closeWizard();
    } catch (error) {
        reportError(error);
        // Only where the summary is still on the stage: the answer can arrive after
        // the reader has gone back a step, and then the page's own note is the one
        // place left to say it.
        const note = maybe<SdsNote>('#editError');
        if (note !== null) {
            note.body = errorSentence(error);
            note.hidden = false;
        }
    }
}
