/**
 * Facts about a thing, in the groups they are read in: the system's own set,
 * with the value set as what it is -- a branch or a path is handed to a terminal
 * and set in the mono face, a sentence is read and set as text.
 */

import { html, nothing, type TemplateResult } from 'lit';
import { t } from '../state.js';
import type { Cut } from '../types.js';
import { bar } from './waiting.js';

export interface Fact {
    label: string;
    value: string;
    /** Whether it is a value that ends up somewhere else. */
    copy?: boolean;
    /**
     * Whether it is read rather than typed. A branch, a path and a database
     * name are what a terminal is handed; a sentence in mono is a value the
     * reader goes looking for somewhere to paste.
     */
    said?: boolean;
    /**
     * The labels of a group are the same every time, so the shape is known
     * before the answer is -- the one condition a bar standing in for a line
     * is honest under. A row that said "Reading ..." alone was a group of one
     * that became a group of four, moving every label on the page.
     */
    waiting?: boolean;
}

/** Facts of one kind, under the name of what they have in common. */
export interface FactGroup {
    title: string;
    facts: Fact[];
    /**
     * The press these rows are about, where there is one. A reader looks for it
     * where its outcome is stated, and a group of facts with nothing to do about
     * them reads as a group nothing can be done about.
     *
     * Handed in as the element itself and kept by whoever built it: Soul's button
     * takes its label out of the element it is given, so one written again from a
     * template keeps the word it was first drawn with.
     */
    press?: Element | null;
}

/** A group of them, or nothing at all where it has no rows. */
export function shownGroup(group: FactGroup): TemplateResult | typeof nothing {
    return group.facts.length === 0
        ? nothing
        : html`
        <div class="sds-facts-group">
            <p class="sds-label">${group.title}</p>
            <dl class="sds-facts">${group.facts.map(shownFact)}</dl>
            ${group.press ?? nothing}
        </div>`;
}

/**
 * `sds-copy` is the value and the press on one line, and it names itself after
 * what it holds: a block of these is four glyphs in a column, and "Copy" four
 * times names none of them.
 */
function shownFact(fact: Fact, at: number): TemplateResult {
    return html`
        <dt>${fact.label}</dt>
        <dd>${
            fact.waiting === true
                ? bar(at)
                : fact.copy === true
                  ? html`<sds-copy value=${fact.value} label=${fact.label}></sds-copy>`
                  : fact.said === true
                    ? fact.value
                    : html`<code class="sds-mono">${fact.value}</code>`
        }</dd>`;
}

/**
 * What this branch has of its own and what the base gained meanwhile -- the
 * second being the reason to rebase, and invisible everywhere but in a graph.
 * One row on two pages, so it is written once.
 */
export function sinceBase(base: Cut): string {
    return [
        base.own > 0 ? t('detail.ownCommits', { count: base.own }) : t('detail.ownNone'),
        ...(base.moved > 0 ? [t('table.baseMoved', { base: base.branch, count: base.moved })] : []),
    ].join(' \u00b7 ');
}
