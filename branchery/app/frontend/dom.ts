/**
 * Small helpers for markup and formatting -- and the two rules about a name the
 * container states first and this has to state the same way: what git takes as
 * a branch, and what that becomes as a hostname.
 */

import type { TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import type { RunStep, SdsButton, SdsIcon, SdsRadio, SdsSelect } from '@typo3/soul-frontend';
import type { JobStepDetail } from './types.js';

export function query<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
    const node = root.querySelector<T>(selector);
    if (!node) {
        throw new Error(`Element not found: ${selector}`);
    }
    return node;
}

export function maybe<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T | null {
    return root.querySelector<T>(selector);
}

/**
 * As the container spells the same rule. Asked in two places that would
 * otherwise disagree quietly: the field the name is typed into, and the address
 * a branch is read at.
 */
export function isBranchName(value: string): boolean {
    return BRANCH_PATTERN.test(value);
}

const BRANCH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/;

/**
 * Same rule as Project::slug(): hostnames only take [a-z0-9-]. The same rule
 * and not merely the same idea -- the page offers a name and the container makes
 * the directory, the address and the database under it, and a reader who is
 * shown one name and given another has no way of telling where that happened.
 *
 * Which is why the letters are lowered one range at a time rather than by
 * toLowerCase(): PHP lowers bytes, so "İ" reaches strtolower() as two it does
 * not know and comes out a separator, where toLowerCase() would make it an "i".
 */
export function slug(value: string): string {
    return value
        .replace(/[A-Z]/g, (letter) => letter.toLowerCase())
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Segment by segment and as numbers: read as text, "8.10" comes before "8.9",
 * and the list of runtimes a worktree may be set to is where that is decided.
 * A segment the other does not have counts as zero, so "8.4" and "8.4.0" are
 * the same version.
 */
export function compareVersions(a: string, b: string): number {
    const left = a.split('.').map(Number);
    const right = b.split('.').map(Number);
    for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
        const diff = (left[index] ?? 0) - (right[index] ?? 0);
        if (diff !== 0) {
            return diff;
        }
    }

    return 0;
}

/**
 * "TYPO3GmbH/blog" -- what the forge calls it and what a developer says out
 * loud. The address itself is still what the link carries. Anything that is not
 * an address is handed back as it stands.
 */
export function repositoryName(url: string): string {
    try {
        return new URL(url).pathname.replace(/^\/+|\/+$/g, '') || url;
    } catch {
        return url;
    }
}

/**
 * `https://` says nothing about which worktree this is, and a column of
 * addresses all beginning with the same eight characters is read from the ninth.
 */
export function host(url: string): string {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * The same rows on the stage while an operation runs and in a worktree's
 * history afterwards.
 */
export function runSteps(steps: readonly JobStepDetail[]): RunStep[] {
    return steps.map((step) => ({
        label: step.label,
        state: step.state,
        meta: formatSpan(step.seconds),
        output: step.output,
    }));
}

/** A length of time as a log reads it: "8s", "3m 20s". */
export function formatSpan(seconds: number): string {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const rest = seconds % 60;

    return rest === 0 ? `${Math.floor(seconds / 60)}m` : `${Math.floor(seconds / 60)}m ${rest}s`;
}

/**
 * A list of operations is read for which one is which -- the build from ten
 * minutes ago or the one from last week -- and that is answered by distance,
 * not by a date. The unit is the largest one that still says something.
 */
export function formatWhen(epochSeconds: number, language: string): string {
    const ago = Math.max(0, Math.round(Date.now() / 1000) - epochSeconds);
    const [amount, unit]: [number, Intl.RelativeTimeFormatUnit] =
        ago < 60
            ? [ago, 'second']
            : ago < 3600
              ? [Math.round(ago / 60), 'minute']
              : ago < 86400
                ? [Math.round(ago / 3600), 'hour']
                : [Math.round(ago / 86400), 'day'];

    try {
        return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(-amount, unit);
    } catch {
        return `${amount} ${unit}`;
    }
}

export function formatDuration(seconds: number): string {
    const total = Math.max(0, Math.round(seconds));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** A byte count in the reader's language, at the scale at which it is useful. */
export function formatBytes(bytes: number, language: string): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = Math.max(0, bytes);
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }

    return `${new Intl.NumberFormat(language, { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value)} ${units[unit]}`;
}

/**
 * A control of this system whose word may change while it stands. The component
 * takes the label out of the element and puts it inside the button it draws, so
 * written again the new word goes where nothing reads it while the attributes
 * of the same element update perfectly.
 *
 * So the word is made the identity of the control: a different one is a
 * different element, drawn rather than written into.
 */
export function saying(word: string, control: TemplateResult): unknown {
    return keyed(word, control);
}

/**
 * The label is written as the element's content, which is where this system
 * puts it. The component lifts that content once and renders the very same node
 * inside the button it draws, which is what makes it safe to rewrite later.
 */
export function buildButton(
    label: string,
    variant: 'primary' | 'secondary' | 'ghost' | 'danger',
    onClick: () => void,
    size?: 'sm' | 'md' | 'lg',
): SdsButton {
    const button = document.createElement('sds-button') as SdsButton;
    button.variant = variant;
    if (size) {
        button.size = size;
    }
    button.append(document.createTextNode(label));
    button.addEventListener('click', onClick);

    return button;
}

/**
 * Waited for, because the component takes its content out of the element on
 * connect and puts it back inside the button a tick later.
 *
 * Nothing is written where there is nothing to say: a label saying nothing is
 * left out of what the component draws, and the node it was given goes with it
 * -- after which the next label lands beside the button and the render after
 * that throws it away for good.
 */
export function setButtonLabel(button: SdsButton, label: string): void {
    if (label.trim() === '') {
        return;
    }

    void button.updateComplete.then(() => {
        // The component wraps a plain label in a span of its own, so the node to
        // write into sits deeper than the button's own children.
        const text = document.createTreeWalker(button, NodeFilter.SHOW_TEXT).nextNode();
        if (text) {
            text.nodeValue = label;

            return;
        }
        (button.querySelector('button, a') ?? button).append(document.createTextNode(label));
    });
}

/**
 * A control, and not a line of text: these stand beside the presses that change
 * the worktree and are reached for by the same hand. An anchor all the same,
 * `href` and not a handler, so the middle click and the status line are the
 * browser's own.
 */
export function buildWayOut(url: string, label: string): SdsButton {
    const button = document.createElement('sds-button') as SdsButton;
    const icon = document.createElement('sds-icon') as SdsIcon;
    icon.name = 'actions-window-open';
    icon.size = 16;
    button.variant = 'secondary';
    button.href = url;
    button.rel = 'external';
    button.append(document.createTextNode(label), icon);

    return button;
}

/**
 * Soul's own select rather than the browser's: a native one opens a list the
 * page has no reach into, so a dark page opens a light window.
 *
 * Only ever reached through buildChoice.
 */
function buildSelect(
    options: readonly { value: string; label: string; disabled?: boolean }[],
    current: string,
    onChange: (value: string) => void,
    label: string,
    caption?: string,
): SdsSelect {
    const select = document.createElement('sds-select') as SdsSelect;
    select.options = options.map((option) => ({
        label: option.label,
        value: option.value,
        disabled: option.disabled === true,
    }));
    select.value = current;
    select.filled = current !== '';
    select.label = label;
    // A field in a form says what it is; one in a table cell is said by the
    // column it stands in, and is drawn to the height of that row.
    if (caption === undefined) {
        select.size = 'sm';
    } else {
        select.caption = caption;
    }
    select.addEventListener('sds-change', (event) => onChange((event as CustomEvent<string>).detail));

    return select;
}

/** Radio groups drawn so far; one name per set is what keeps two apart. */
let groups = 0;

/**
 * A short set is laid out whole, because a step that asks one question should
 * show what the answers are rather than hide them behind a control. Past
 * roughly six the set stops being scannable, which is where Soul says to use a
 * select instead.
 */
export function buildChoice(
    options: readonly { value: string; label: string; hint?: string }[],
    current: string,
    onChange: (value: string) => void,
    legend: string,
): HTMLElement {
    if (options.length > 6) {
        return buildSelect(
            options.map((option) => ({ value: option.value, label: option.label })),
            current,
            onChange,
            legend,
            legend,
        );
    }

    const radio = document.createElement('sds-radio') as SdsRadio;
    // One name for the whole set is what makes it one choice.
    groups += 1;
    radio.name = `choice-${groups}`;
    radio.legend = legend;
    radio.choices = options.map((option) => ({
        label: option.label,
        value: option.value,
        ...(option.hint === undefined ? {} : { hint: option.hint }),
    }));
    radio.value = current;
    radio.addEventListener('sds-change', (event) => onChange((event as CustomEvent<string>).detail));

    return radio;
}
