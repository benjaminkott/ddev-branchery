/**
 * The one dialog of this interface, and the way through it. A flow is a sequence
 * of steps written down; each says what it asks, draws its own fields and
 * decides when it may be left.
 *
 * Asking one thing per stage lets each question be asked properly -- the answers
 * can stand as a list to pick from -- at the price of having to tell the reader
 * where they are, which the bar is for.
 *
 * A running operation is staged here too, through
 * `setStage`/`stageBody`/`setFooter`: not a question, so it has no steps.
 */

import { nothing, render, type TemplateResult } from 'lit';
import type { SdsButton, SdsProgress } from '@typo3/soul-frontend';
import { maybe, query, setButtonLabel } from '../dom.js';
import { latch } from '../inflight.js';
import { t } from '../state.js';

/** What a step reaches back for while it is on the stage. */
export interface StepControl {
    /** Re-read the answers, so the forward button follows what `ready` says. */
    update(): void;
}

export interface FlowStep {
    /** A word or two over the bar, not a sentence. */
    label: string;
    /** The question, as the title over the body. */
    heading: string;
    /** One line saying what is decided here, under the title. */
    lead?: string;
    /** A step an earlier answer has made moot is not drawn and is not counted. */
    when?(): boolean;
    /** The body is empty; whatever is put in it is the step. */
    enter(body: HTMLElement, control: StepControl): void;
    /** Whether the step may be left. Without one it always may. */
    ready?(): boolean;
    /**
     * The step is being left. What it set going for itself and nobody else --
     * a question it was about to ask -- is its to call off here.
     */
    leave?(): void;
}

export interface Flow {
    steps: readonly FlowStep[];
    /**
     * The box is measured once for the whole walk, or the buttons move out from
     * under the pointer between one press and the next. Which measure it is,
     * though, is the flow's own: three radio buttons in a box built for a
     * hundred branches is a dialog that is mostly nothing.
     */
    tall?: boolean;
    /** What the forward button says on the last step. */
    finishLabel(): string;
    /**
     * What it hands back is waited for: a second press while it is pending
     * would send the same request twice.
     */
    finish(): unknown;
}

const dialog = query<HTMLDialogElement>('#wizard');
const form = query<HTMLFormElement>('#wizForm');
const progress = query<SdsProgress>('#wizProgress');
const title = query('#wizTitle');
const lead = query('#wizLead');
const body = query('#wizBody');
const foot = query('#wizFoot');
const backButton = query<SdsButton>('#wizBack');
const nextButton = query<SdsButton>('#wizNext');

let flow: Flow | null = null;
let at = 0;

/** Whether what is on the stage is no longer a question but an operation. */
let staged = false;

/** The last stop's request, while it is on its way. */
const finishing = latch();

const control: StepControl = {
    update: () => paintFooter(),
};

export function runFlow(started: Flow): void {
    flow = started;
    at = 0;
    staged = false;
    size(started.tall === true);
    paintStep();
    openDialog();
}

/**
 * Two of the system's own sizes, and set once: Soul measures a modal to what is
 * in it, which is right for a box that says one thing and closes. This one says
 * five things in turn, and measuring each moves the buttons out from under the
 * pointer between one press and the next.
 */
function size(tall: boolean): void {
    dialog.classList.toggle('sds-modal--lg', tall);
    dialog.classList.toggle('sds-modal--md', !tall);
}

/** The one dialog of this interface, whatever is staged in it. */
export function openDialog(): void {
    if (!dialog.open) {
        dialog.showModal();
    }
}

export function closeWizard(): void {
    if (dialog.open) {
        dialog.close();
    }
}

/** Whether the stage is on screen at all. */
export function wizardOpen(): boolean {
    return dialog.open;
}

/**
 * The difference matters to whoever else wants to draw there: a running
 * operation followed from a terminal may not draw over a question the reader is
 * in the middle of, and the address moving away closes a question while an
 * operation is not the address's to close.
 */
export function flowOpen(): boolean {
    return dialog.open && flow !== null;
}

/** What is staged is not always what is running -- the dialog can be closed. */
export function onWizardClose(listener: () => void): void {
    dialog.addEventListener('close', listener);
}

/**
 * What an answer has made moot is gone, and gone from the count as well: a bar
 * measured against a stop the reader will never see is lying about how far
 * there is to go.
 */
function visible(): readonly FlowStep[] {
    return flow === null ? [] : flow.steps.filter((step) => step.when === undefined || step.when());
}

/** The step on the stage is told it is being left, where there is one. */
function leaving(): void {
    visible()[at]?.leave?.();
}

function paintStep(): void {
    const steps = visible();
    const step = steps[at];
    if (!step) {
        return;
    }

    title.textContent = step.heading;
    // Through the renderer, like everything else written into this line: a
    // stage that draws it and a step that wrote it by hand would each leave the
    // other's text standing.
    render(step.lead ?? nothing, lead);
    lead.hidden = step.lead === undefined;
    paintProgress(steps);

    // Emptied through the renderer rather than around it: a body cleared by
    // hand leaves the renderer holding nodes no longer in the page, and the
    // next stop is drawn against them.
    render(nothing, body);
    step.enter(body, control);
    paintFooter();

    // It waits, because what a step appends may be a component that draws its
    // own markup a tick later.
    window.setTimeout(() => {
        maybe<HTMLInputElement>('input:not([type]), input[type="text"]', body)?.focus();
    }, 20);
}

/**
 * Which question this is, of how many -- the one being asked counts, so the bar
 * is full on the last of them: the result is a press away, and that is what a
 * full bar says. A flow of one stop is not a sequence and draws nothing.
 */
function paintProgress(steps: readonly FlowStep[]): void {
    progress.hidden = steps.length < 2;
    if (steps.length < 2) {
        return;
    }

    progress.caption = steps[at]?.label ?? '';
    progress.label = t('step.progress');
    progress.max = steps.length;
    progress.value = at + 1;
}

function paintFooter(): void {
    const steps = visible();
    const step = steps[at];
    if (!step || flow === null) {
        return;
    }
    const last = at === steps.length - 1;

    setFooter({
        back: at === 0 ? t('action.cancel') : t('action.back'),
        onBack: backward,
        next: last ? flow.finishLabel() : t('action.next'),
        onNext: forward,
    });
    // After the footer, which clears the state a step may have set on it.
    nextButton.disabled = step.ready?.() === false;
}

function forward(): void {
    const steps = visible();
    const step = steps[at];
    if (!step || flow === null || step.ready?.() === false) {
        return;
    }
    if (at >= steps.length - 1) {
        const started = flow;
        // Once, however often it is asked for while the request is out. The button
        // is put back only where the question is still on the stage.
        const sent = finishing.run(
            () => started.finish(),
            () => {
                if (flow === started && !staged) {
                    paintFooter();
                }
            },
        );
        if (sent) {
            nextButton.disabled = true;
        }

        return;
    }
    leaving();
    at += 1;
    paintStep();
}

function backward(): void {
    if (at === 0) {
        closeWizard();

        return;
    }
    leaving();
    at -= 1;
    paintStep();
}

/**
 * The surface is a `<form method="dialog">`, so a return anywhere in it submits
 * -- and a submitted dialog form closes the dialog, which in a stack of steps
 * would throw every answer away at the first return key.
 */
form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (flow !== null) {
        forward();
    }
});

dialog.addEventListener('close', () => {
    leaving();
    flow = null;
    staged = false;
});

export function setFooter(
    options: { back?: string | null; next?: string | null; onBack?: () => void; onNext?: () => void } = {},
): void {
    // A footer of two hidden buttons is still a ruled strip of padding under
    // the body, standing as long as the stage has nothing to press.
    foot.hidden = options.back == null && options.next == null;
    backButton.hidden = options.back == null;
    setButtonLabel(backButton, options.back ?? '');
    backButton.onclick = options.onBack ?? null;
    nextButton.hidden = options.next == null;
    setButtonLabel(nextButton, options.next ?? '');
    nextButton.disabled = false;
    nextButton.onclick = options.onNext ?? null;
}

/**
 * The stage taken over by something that is not a question. There are no steps
 * left to walk then, so the bar goes and the flow with it.
 */
export function setStage(heading: string, note: string | TemplateResult = ''): void {
    // Only when the stage is taken over: an operation a flow started keeps the
    // size that flow asked for, or the surface would change measure between the
    // last question and the work it set going.
    if (!staged) {
        staged = true;
        if (flow === null) {
            size(false);
        }
    }
    leaving();
    flow = null;
    progress.hidden = true;
    title.textContent = heading;
    // The line under the title is where an operation says how it is going and
    // what came of it, so it takes a template as readily as a word -- which is
    // what lets it carry the way into what was just built.
    render(note === '' ? nothing : note, lead);
    lead.hidden = note === '';
}

/**
 * A flow's step is handed the body itself and puts what it likes in it; a stage
 * that is not a question hands over a template and lets the renderer keep what
 * did not change.
 */
export function stageBody(shown: TemplateResult): void {
    render(shown, body);
}
