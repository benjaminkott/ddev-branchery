/**
 * Building a worktree again, and the one question that decides what that means.
 * Everything else is the same either way; the database is the one part that is
 * a decision -- the data in it is either the work being done or the reason the
 * worktree has to be rebuilt, and nobody but the reader knows which.
 */

import { html, render } from 'lit';
import { buildChoice } from '../dom.js';
import { t } from '../state.js';
import type { Worktree } from '../types.js';
import { runFlow, type Flow, type FlowStep } from './wizard.js';

export function openProvision(worktree: Worktree, build: (fresh: boolean) => unknown): void {
    const answers = { fresh: false };

    const flow: Flow = {
        steps: [dataStep(worktree, answers)],
        // The button says which of the two answers it carries out.
        finishLabel: () => (answers.fresh ? t('provision.fresh') : t('table.provision')),
        finish: () => build(answers.fresh),
    };

    runFlow(flow);
}

function dataStep(worktree: Worktree, answers: { fresh: boolean }): FlowStep {
    return {
        label: t('table.database'),
        heading: t('provision.heading', { name: worktree.name }),
        lead: t('provision.lead'),
        enter(body, control) {
            render(
                html`${buildChoice(
                    [
                        { value: 'keep', label: t('provision.keep'), hint: t('provision.keepHint') },
                        { value: 'fresh', label: t('provision.fresh'), hint: t('provision.freshHint') },
                    ],
                    answers.fresh ? 'fresh' : 'keep',
                    (value) => {
                        answers.fresh = value === 'fresh';
                        control.update();
                    },
                    t('table.database'),
                )}`,
                body,
            );
        },
    };
}
