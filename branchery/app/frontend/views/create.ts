/**
 * Creating a worktree, one question at a time -- each a stop of its own, so it
 * can be answered by picking from what there is rather than by filling in a
 * field. The database is not among them: there is one server, and the worktree
 * gets a database of its own on it.
 *
 * The answers live in one object the steps write into, and every stop is a
 * template drawn from it. Nothing is remembered in the markup, which is what
 * makes going back and changing an answer work.
 */

import { html, nothing, render, type TemplateResult } from 'lit';
import type { SdsSelect } from '@typo3/soul-frontend';
import type { JobHandlers, Preview } from '../types.js';
import { api } from '../api.js';
import { isBranchName, maybe, slug } from '../dom.js';
import { errorSentence, reportError, state, t } from '../state.js';
import { runFlow, type Flow, type FlowStep, type StepControl } from './wizard.js';
import { bar } from './waiting.js';

export type CreateHandlers = Pick<JobHandlers, 'onJob'>;

type Mode = 'branch' | 'fork';

interface Answers {
    mode: Mode;
    /** The branch to check out, or the one to create. */
    branch: string;
    /** Which worktree a new branch starts from; empty is the project checkout. */
    from: string;
    /** The directory, where it should not be the one derived from the branch. */
    name: string;
}

/**
 * How to say, on the last stop, what the server said when it refused. Set when
 * that stop is entered and used from the press that leaves it.
 */
let refused: ((said: string) => void) | null = null;

/**
 * Asked once per set of answers, when the summary is entered. Undefined is an
 * answer on its way, null one that did not arrive -- the summary then says what
 * it said before there was anything to ask.
 */
const foreseen = new Map<string, Preview | null>();

/** The questions on their way, so that a summary drawn twice asks once. */
const asking = new Set<string>();

/**
 * The name is typed into the summary and every keystroke is a new question.
 * Asked once the typing pauses: a name of twelve letters is otherwise twelve
 * trips to git and the database, for eleven answers nobody will see.
 */
const TYPING_PAUSE = 300;
let typing: number | undefined;

/** What is written where a branch name is not one, and nothing where it is. */
function malformed(branch: string): string {
    return branch !== '' && !isBranchName(branch) ? t('error.branchName') : '';
}

/**
 * The ones the worktrees stand on, the project's own, and the ones the remote
 * has: every one the server would refuse to cut again. Asked at the field
 * rather than at the end of the walk, where the refusal used to arrive.
 */
function taken(branch: string): boolean {
    return (
        branch === state.branch ||
        state.project?.branch === branch ||
        state.branches.some((free) => free.name === branch) ||
        state.worktrees.some((worktree) => worktree.branch === branch)
    );
}

/** What is wrong with a new branch's name, where something is. */
function refusable(branch: string): string {
    const shape = malformed(branch);
    if (shape !== '') {
        return shape;
    }

    return branch !== '' && taken(branch) ? t('error.branchExists', { branch }) : '';
}

/**
 * The stop is entered even with a branch already picked rather than skipped:
 * what is being created is still a name, a PHP version and a database.
 */
export function openCreate(handlers: CreateHandlers, branch = ''): void {
    const answers: Answers = {
        // Nothing to check out means the question is already answered.
        mode: state.branches.length > 0 ? 'branch' : 'fork',
        branch,
        from: '',
        name: '',
    };

    const derivedName = (): string => answers.name.trim() || slug(answers.branch);

    // The project's own name, which every door would take for the project
    // checkout, or one a worktree already has. A sentence rather than a yes,
    // because the two are not the same trouble.
    const nameTrouble = (): string => {
        const name = derivedName();
        if (name !== '' && name === state.projectName) {
            return t('preview.isProject', { name });
        }

        return state.worktrees.some((worktree) => worktree.name === name) ? t('preview.exists', { name }) : '';
    };

    const flow: Flow = {
        // Its first stop is a list of every branch there is to check out.
        tall: true,
        steps: [modeStep(answers), forkStep(answers), reviewStep(answers, derivedName, nameTrouble)],
        finishLabel: () => (answers.mode === 'fork' ? t('action.fork') : t('action.create')),
        finish: () => create(answers, derivedName(), handlers),
    };

    runFlow(flow);
}

/**
 * The branches stand under the answer they belong to instead of behind it: a
 * stop whose whole content is "now pick one of these" is a click that buys
 * nothing. Where there is no branch to check out the answer is greyed with the
 * reason in its place, rather than taken away.
 *
 * The markup is written out rather than handed to `sds-radio`, which takes its
 * answers as data: an answer carrying a list of its own is not a string.
 */
function modeStep(answers: Answers): FlowStep {
    return {
        label: t('step.mode.label'),
        heading: t('step.mode.heading'),
        lead: t('step.mode.lead'),
        ready: () => answers.mode === 'fork' || isBranchName(answers.branch),
        enter(body, control) {
            const offered = state.branches.length > 0;
            if (!offered) {
                answers.mode = 'fork';
            }

            const draw = (): void => {
                // A radio's answer cannot be offered and refused at once, so a project
                // with every branch already checked out is not shown the answer it cannot
                // give: the set says why under its own legend instead.
                //
                // Its legend is the question the stop already asks in its title, said and
                // not drawn: an empty legend leaves the set nameless.
                //
                // What the first answer needs stands under the set rather than under the
                // answer itself: the element draws its choices as one set.
                render(
                    html`
                    <sds-radio
                        legend=${t('step.mode.heading')}
                        legend-said-only
                        name="createMode"
                        hint=${offered ? '' : t('mode.branchNone')}
                        value=${answers.mode}
                        .choices=${[
                            ...(offered
                                ? [{ label: t('mode.branch'), value: 'branch', hint: t('mode.branchHint') }]
                                : []),
                            { label: t('mode.fork'), value: 'fork', hint: t('mode.forkHint') },
                        ]}
                        @sds-change=${(event: CustomEvent<string>) => {
                            answers.mode = event.detail === 'branch' ? 'branch' : 'fork';
                            // The two modes ask for a branch in opposite directions, so an
                            // answer given under the other one is not an answer to this.
                            answers.branch = '';
                            draw();
                        }}></sds-radio>
                    <div class="branchery-choice-detail" ?hidden=${answers.mode !== 'branch'}>
                        <div class="branchery-choice-find">
                            <sds-field
                                label=${t('field.branch')}
                                value=${answers.branch === '' ? t('field.branchFilter') : answers.branch}
                                ?filled=${answers.branch !== ''}
                                @sds-input=${(event: CustomEvent<string>) => {
                                    answers.branch = event.detail.trim();
                                    draw();
                                }}></sds-field>
                            <span class="branchery-choice-count"
                                  >${t('overview.branches', { count: state.branches.length })}</span>
                        </div>
                        <div class="branchery-picklist">${branches(answers, draw)}</div>
                        <sds-note tone="error" ?hidden=${malformed(answers.branch) === ''}
                                  body=${malformed(answers.branch)}></sds-note>
                    </div>`,
                    body,
                );
                control.update();
            };

            draw();
        },
    };
}

/**
 * A name that is one of the branches is a pick, not a filter: narrowing the
 * list to the one just clicked would take the others away at the moment the
 * reader might want them back.
 */
function branches(answers: Answers, draw: () => void): TemplateResult | TemplateResult[] {
    const needle = answers.branch.toLowerCase();
    const names = state.branches.map((branch) => branch.name);
    const matches = names.includes(answers.branch)
        ? names
        : names.filter((branch) => branch.toLowerCase().includes(needle));

    if (matches.length === 0) {
        return html`<p class="branchery-picklist__empty">${t('step.branch.noMatch')}</p>`;
    }

    return matches.map(
        (branch) => html`
        <button type="button" class="branchery-picklist__item"
                aria-pressed=${String(branch === answers.branch)}
                @click=${(): void => {
                    answers.branch = branch;
                    draw();
                }}>${branch}</button>`,
    );
}

/** The other way round: a branch that does not exist yet, and where it starts. */
function forkStep(answers: Answers): FlowStep {
    return {
        label: t('step.fork.label'),
        heading: t('step.fork.heading'),
        lead: t('step.fork.lead'),
        when: () => answers.mode === 'fork',
        ready: () => isBranchName(answers.branch) && !taken(answers.branch),
        enter(body, control) {
            const draw = (): void => {
                render(
                    html`
                    ${
                        /* Caption, control and hint are one element: a caption is what turns a
                          bare field into a field in a form. The placeholder is the field's
                          value until somebody types, so it is stated on every draw and comes
                          back the moment the field is emptied. */ ''
                    }
                    <sds-field
                        field-id="newBranch"
                        caption=${t('field.newBranch')}
                        value=${answers.branch === '' ? t('field.newBranchPlaceholder') : answers.branch}
                        ?filled=${answers.branch !== ''}
                        @sds-input=${(event: CustomEvent<string>) => {
                            answers.branch = event.detail.trim();
                            draw();
                        }}></sds-field>
                    ${source(answers)}
                    <sds-note tone="error" ?hidden=${refusable(answers.branch) === ''}
                              body=${refusable(answers.branch)}></sds-note>`,
                    body,
                );
                control.update();
            };

            draw();
        },
    };
}

/** Without a choice the project checkout applies. */
function source(answers: Answers): SdsSelect {
    const select = document.createElement('sds-select') as SdsSelect;
    select.caption = t('field.branchFrom');
    select.options = [
        { label: t('field.branchFromProject', { branch: state.branch }), value: '' },
        ...state.worktrees.map((worktree) => ({ label: worktree.name, value: worktree.name })),
    ];
    select.value = answers.from;
    select.filled = true;
    select.addEventListener('sds-change', (event) => {
        answers.from = (event as CustomEvent<string>).detail;
    });

    return select;
}

/**
 * The directory name stands here rather than in a stop of its own: it is the
 * one answer with a good default, and the place to notice it is beside the
 * address it decides.
 */
function reviewStep(answers: Answers, derivedName: () => string, nameTrouble: () => string): FlowStep {
    return {
        label: t('step.review.label'),
        heading: t('step.review.heading'),
        lead: t('step.review.lead'),
        ready: () => derivedName() !== '' && nameTrouble() === '',
        enter(body, control) {
            refused = (said) => drawReview(answers, derivedName, nameTrouble, body, control, said);
            // What the first step of the operation would find, found now: the answer
            // draws the summary again when it arrives.
            void foresee(answers, derivedName(), () => {
                if (maybe('#name') !== null) {
                    drawReview(answers, derivedName, nameTrouble, body, control);
                }
            });
            drawReview(answers, derivedName, nameTrouble, body, control);
        },
        leave() {
            window.clearTimeout(typing);
        },
    };
}

/** The answers as one key, which is what an answer from the container is filed under. */
function keyOf(answers: Answers, name: string): string {
    return JSON.stringify([answers.mode, answers.branch, answers.mode === 'fork' ? answers.from : '', name]);
}

async function foresee(answers: Answers, name: string, arrived: () => void): Promise<void> {
    const key = keyOf(answers, name);
    // An answer that did not arrive is asked for again the next time the
    // summary is entered: a bad moment remembered as a fact would leave the
    // summary guessing for the rest of the tab's life.
    if (foreseen.get(key) != null || asking.has(key)) {
        return;
    }
    asking.add(key);
    let answer: Preview | null = null;
    try {
        answer = await api.preview({
            mode: answers.mode,
            branch: answers.branch,
            from: answers.from,
            name: answers.name,
        });
    } catch {
        // Nothing to say beforehand: the operation says the same things, one step
        // in.
    } finally {
        asking.delete(key);
    }
    foreseen.set(key, answer);
    arrived();
}

/**
 * Without this the summary asked once, on the way in, and a name typed
 * afterwards was a key nothing ever asked about -- the PHP row stood as a bar
 * for as long as the name differed, and the warnings were about the old one.
 */
function foreseeLater(
    answers: Answers,
    derivedName: () => string,
    nameTrouble: () => string,
    body: HTMLElement,
    control: StepControl,
): void {
    window.clearTimeout(typing);
    typing = window.setTimeout(() => {
        void foresee(answers, derivedName(), () => {
            if (maybe('#name') !== null) {
                drawReview(answers, derivedName, nameTrouble, body, control);
            }
        });
    }, TYPING_PAUSE);
}

/**
 * The error under it is the stop's own -- a name that is taken -- or the
 * server's, where creating was tried and refused: to the reader they are the
 * same thing.
 */
function drawReview(
    answers: Answers,
    derivedName: () => string,
    nameTrouble: () => string,
    body: HTMLElement,
    control: StepControl,
    said = '',
): void {
    const from =
        answers.mode === 'fork' ? state.worktrees.find((worktree) => worktree.name === answers.from) : undefined;
    // Both kinds take the data of what they were cut from. Where there is none
    // the application is installed instead, which only the operation can know.
    // Named by the database that is copied, not by the branch: "copy of
    // master" read as if a branch held data.
    const database = t('preview.databaseCopy', { name: from?.database ?? state.project?.database ?? 'db' });
    const trouble = said !== '' ? said : nameTrouble();
    // The version as the operation's first step reads it, and what that step
    // would stop on. Until the answer is here the row says it is being read.
    const seen = foreseen.get(keyOf(answers, derivedName()));
    // A bar and not the word: it is the last row of a set whose other rows are
    // filled in, so the shape is known and what is missing is one line of it. A
    // word there read as an answer.
    const php =
        seen === undefined
            ? bar(2)
            : seen === null
              ? from
                  ? from.php
                  : t('preview.phpFromProject')
              : (seen.php ?? t('preview.phpRead', { file: seen.readFrom ?? '' }));

    render(
        html`
        <div class="branchery-preview">
            <dl>
                <dt>${t('preview.branch')}</dt>
                <dd><code class="sds-mono">${answers.branch}</code></dd>
                <dt>${t('preview.directory')}</dt>
                <dd><code class="sds-mono">.worktrees/${derivedName()}</code></dd>
                <dt>${t('preview.address')}</dt>
                <dd><code class="sds-mono">https://${slug(derivedName())}.${state.tld}</code></dd>
                <dt>${t('preview.database')}</dt>
                <dd>${database}</dd>
                <dt>${t('preview.php')}</dt>
                <dd>${php}</dd>
            </dl>
        </div>
        ${
            /* What the operation would say at its first step, said before the
              press. In the register of a warning, because that is what the
              operation makes of them -- this is the chance to not press at all. */
            (seen?.warnings ?? []).map((warning) => html`<sds-note tone="warn" body=${warning}></sds-note>`)
        }
        <sds-field
            field-id="name"
            caption=${t('field.nameOverride')}
            hint=${t('field.namePlaceholder')}
            value=${answers.name === '' ? slug(answers.branch) : answers.name}
            ?filled=${answers.name !== ''}
            @sds-input=${(event: CustomEvent<string>) => {
                answers.name = event.detail.trim();
                drawReview(answers, derivedName, nameTrouble, body, control);
                foreseeLater(answers, derivedName, nameTrouble, body, control);
            }}></sds-field>
        ${trouble === '' ? nothing : html`<sds-note tone="error" body=${trouble}></sds-note>`}`,
        body,
    );
    control.update();
}

async function create(answers: Answers, expected: string, handlers: CreateHandlers): Promise<void> {
    const payload: Record<string, string> =
        answers.mode === 'fork'
            ? { mode: 'fork', branch: answers.branch, from: answers.from, name: answers.name }
            : { mode: 'branch', branch: answers.branch, name: answers.name };

    try {
        const result = await api.createWorktree(payload);
        handlers.onJob(result.job, expected);
    } catch (error) {
        // Said on the summary where it is still on the stage -- the field it draws
        // is the sign of that -- and on the page where the reader has since gone
        // elsewhere: an answer drawn over another step would be a summary
        // appearing in the middle of a question.
        reportError(error);
        if (maybe('#name') !== null) {
            refused?.(errorSentence(error));
        }
    }
}
