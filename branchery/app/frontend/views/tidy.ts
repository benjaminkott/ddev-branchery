/**
 * The worktrees that look finished, and letting them go together. Nothing about
 * a merged branch announces itself: the worktree sits there, serving, holding a
 * database, looking exactly like the one being worked on.
 *
 * So it is asked of git rather than of memory, in the two ways a branch can be
 * finished. What is offered is a removal like any other, and they run side by
 * side -- which makes clearing four of them a moment rather than four.
 */

import { html, render } from 'lit';
import { api } from '../api.js';
import { reportError, t } from '../state.js';
import type { JobHandlers, Worktree } from '../types.js';
import { finished, losesNothing } from '../rules/finished.js';
import { closeWizard, runFlow, setStage } from './wizard.js';

export type TidyHandlers = Pick<JobHandlers, 'onJob'>;

export function openTidy(worktrees: Worktree[], handlers: TidyHandlers): void {
    const offered = finished(worktrees);
    // Ticked where nothing can be lost, offered where something might: that
    // difference is the whole reason this asks rather than simply removing.
    const chosen = new Set(offered.filter(losesNothing).map((worktree) => worktree.name));

    runFlow({
        // Four entries already ask for more room than three radio buttons do.
        tall: offered.length > 3,
        steps: [
            {
                label: t('tidy.step'),
                heading: t('tidy.heading'),
                lead: t('tidy.lead'),
                enter(body, control) {
                    // The system's own set of boxes under one question. A choice takes a
                    // label and a hint, both words, so the branch goes into the hint where
                    // the reason already is -- one register fewer to read.
                    render(
                        html`
                    <sds-checkbox-group
                        legend=${t('tidy.heading')}
                        legend-said-only
                        name="tidy"
                        .choices=${offered.map((worktree) => ({
                            label: worktree.name,
                            value: worktree.name,
                            hint: `${worktree.branch} \u00b7 ${why(worktree)}`,
                        }))}
                        .values=${[...chosen]}
                        @sds-change=${(event: CustomEvent<readonly string[]>) => {
                            chosen.clear();
                            for (const name of event.detail) {
                                chosen.add(name);
                            }
                            control.update();
                        }}></sds-checkbox-group>`,
                        body,
                    );
                },
                ready: () => chosen.size > 0,
            },
        ],
        finishLabel: () => t('tidy.confirm', { count: chosen.size }),
        finish: () =>
            letGo(
                offered.filter((worktree) => chosen.has(worktree.name)),
                handlers,
            ),
    });
}

/**
 * Not the branch name: it stands above as the label, and a hint that begins by
 * repeating what it hangs under is a line the eye skips.
 */
function why(worktree: Worktree): string {
    return worktree.merged ? t('tidy.why.merged') : t('tidy.why.gone');
}

/**
 * One operation per worktree, started together: they share nothing but the
 * moment each writes git's bookkeeping. The first is followed on the stage; the
 * rest say what they are doing on their own rows.
 */
async function letGo(worktrees: Worktree[], handlers: TidyHandlers): Promise<void> {
    setStage(t('tidy.working'), t('tidy.workingLead', { count: worktrees.length }));

    // Asked for all at once, and kept beside the name each was asked about, so
    // the one followed is named after the worktree it is actually removing and
    // not after the first in the list, which may have been refused.
    const answers = await Promise.allSettled(worktrees.map((worktree) => api.removeWorktree(worktree.name)));
    const started: { job: string; name: string }[] = [];
    answers.forEach((answer, index) => {
        const name = worktrees[index]?.name ?? '';
        if (answer.status === 'fulfilled') {
            started.push({ job: answer.value.job, name });
        } else {
            reportError(answer.reason);
        }
    });

    const first = started[0];
    if (first === undefined) {
        // Nothing to follow, so nothing for the stage to show: what went wrong is
        // said on the page under it.
        closeWizard();

        return;
    }
    handlers.onJob(first.job, first.name, 'remove');
}
