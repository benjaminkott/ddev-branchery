/**
 * A page of this application, as an element.
 *
 * What a page keeps -- which worktree it is about, what was read beside it,
 * which file is open -- used to be `let` at the top of its module, which made
 * every page a single instance with no way of saying when it began or ended.
 * The shell said it for them: it held a list of which page was on screen
 * and called `leaveWorktree()`, `leaveCommit()`, `leaveBranch()` by name when
 * the address changed, and a page added without a line in all three places kept
 * answering requests for a reader who had gone.
 *
 * An element is told. It is put on the page and taken off it by the same
 * template that decides which page is open, and what it holds goes with it.
 */

import { LitElement } from 'lit';
import { subscribe } from '../state.js';
import { onWizardClose, wizardOpen } from './wizard.js';

export abstract class View extends LitElement {
    /** @var what this page has to let go of when it is taken off the screen */
    private letGo: (() => void)[] = [];

    /**
     * Soul's stylesheet is the document's own, and a shadow root is where it
     * stops: drawn in one, every page of this would come out unstyled. There is
     * nothing a boundary would protect either -- these are the pages of this
     * application and never a control somebody else embeds.
     */
    protected override createRenderRoot(): HTMLElement | DocumentFragment {
        return this;
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.letGo.push(subscribe(() => this.requestUpdate()));
        // The stage is given back: what was decided while it stood open is what
        // this page is about now.
        this.letGo.push(onWizardClose(() => this.requestUpdate()));
        this.arrived();
    }

    override disconnectedCallback(): void {
        for (const release of this.letGo) {
            release();
        }
        this.letGo = [];
        this.left();
        super.disconnectedCallback();
    }

    /**
     * While an operation runs the stage belongs to the progress dialog and
     * nothing behind it is redrawn: the reader is watching the dialog, and a
     * page rebuilding underneath it is movement nobody asked for. Drawn again
     * when the stage is given back, which is what the listener above is for.
     */
    protected override shouldUpdate(): boolean {
        // Never the first draw, though. A page opened straight at "#new" has the
        // wizard over it before it has drawn anything, and held back here it
        // stood as bars behind the whole of the flow -- saying "still reading"
        // about a list that had been read.
        return !this.hasUpdated || !wizardOpen();
    }

    /**
     * Drawn now, rather than on the microtask an update is otherwise put off to.
     *
     * For the shell, which decides which page is open and then draws it: between
     * that decision and the next microtask a dialog can go up over the page, and
     * the rule above would then hold back the very draw that was asked for --
     * which is a page opened straight at "#new" standing empty behind it.
     */
    drawNow(): void {
        this.requestUpdate();
        this.performUpdate();
    }

    /** Whatever this page holds beyond the store. Neither has to be written. */
    protected arrived(): void {}

    protected left(): void {}

    /** What this page has to let go of, for whoever subscribes to more. */
    protected untilLeft(release: () => void): void {
        this.letGo.push(release);
    }
}
