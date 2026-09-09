/**
 * Putting a worktree back in shape, and the one question that decides what that
 * means.
 *
 * One press and not two: "build it again" and "copy the data" are the same
 * question asked twice -- a reader with a worktree that has gone wrong wants it
 * right, and which of the two does that is what they came here to be told. What
 * the three answers do differs, so each says it: two build the worktree again
 * and differ over its database, the third touches nothing but the database.
 */

import { html, render } from 'lit';
import { buildChoice } from '../dom.js';
import { t } from '../state.js';
import type { Worktree } from '../types.js';
import { runFlow, type Flow, type FlowStep } from './wizard.js';

/** What was chosen: the worktree built again, or its data replaced. */
export type Rebuild = { built: true; fresh: boolean } | { built: false };

const CHOICES = ['keep', 'fresh', 'data'] as const;

type Choice = (typeof CHOICES)[number];

export function openRebuild(worktree: Worktree, run: (chosen: Rebuild) => unknown): void {
    const answers: { choice: Choice } = { choice: 'keep' };

    const flow: Flow = {
        steps: [choiceStep(worktree, answers)],
        // The button says which of the three answers it carries out.
        finishLabel: () => t(`rebuild.${answers.choice}`),
        finish: () =>
            run(answers.choice === 'data' ? { built: false } : { built: true, fresh: answers.choice === 'fresh' }),
    };

    runFlow(flow);
}

function choiceStep(worktree: Worktree, answers: { choice: Choice }): FlowStep {
    return {
        label: t('rebuild.legend'),
        heading: t('rebuild.heading', { name: worktree.name }),
        lead: t('rebuild.lead'),
        enter(body, control) {
            render(
                html`${buildChoice(
                    CHOICES.map((choice) => ({
                        value: choice,
                        label: t(`rebuild.${choice}`),
                        hint: t(`rebuild.${choice}Hint`),
                    })),
                    answers.choice,
                    (value) => {
                        answers.choice = value as Choice;
                        control.update();
                    },
                    t('rebuild.legend'),
                )}`,
                body,
            );
        },
    };
}
