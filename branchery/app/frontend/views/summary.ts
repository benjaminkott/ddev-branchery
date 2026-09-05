/**
 * What is settled about a worktree, in the groups a reader asks after. It draws
 * and nothing else: what has been read and measured about the worktree is the
 * page's, and is handed over on every draw.
 */

import { EDITOR } from '../editor.js';
import { formatBytes, formatWhen, host } from '../dom.js';
import { state, t } from '../state.js';
import { wandered } from '../rules/actions.js';
import type { DiskUsage, Worktree } from '../types.js';
import { type FactGroup, sinceBase } from './facts.js';

/**
 * Measured only when a page asks, so it arrives after the rest -- which is why
 * the group states its own shape while it waits.
 */
export interface Usage {
    value: DiskUsage | null;
    trouble: string;
}

/**
 * One grid and not four lists: the values on a side come to rest at one edge and
 * the rule over a group in the second row stands level with the one beside it.
 *
 * The three that change without anybody touching the worktree used to stand
 * across the top as figures. The answer is not a second register for the same
 * facts: a state that asks for something is a note carrying the press that
 * answers it, and everything else is a fact among facts.
 */
export function summaryFacts(worktree: Worktree, usage: Usage): FactGroup[] {
    return [
        {
            // The name is the worktree's and the branch is what it stands on -- two
            // different things the moment somebody tries a patch in it, which is
            // exactly when the second one has to be readable.
            title: t('detail.repository'),
            facts: [
                { label: t('table.branch'), value: worktree.branch },
                ...(wandered(worktree) ? [{ label: t('detail.madeFor'), value: worktree.madeFor ?? '' }] : []),
                // The answer to the first question asked about a worktree a fortnight on.
                // The commit it was cut at is known where the cut was made here; a branch
                // that was checked out has a base all the same, read off where they part.
                ...(worktree.base !== null
                    ? [
                          {
                              label: t('detail.base'),
                              value:
                                  worktree.forkedAt !== null && worktree.forkedFrom === worktree.base.branch
                                      ? `${worktree.base.branch} @ ${worktree.forkedAt.slice(0, 11)}`
                                      : worktree.base.branch,
                          },
                          { label: t('detail.sinceBase'), value: sinceBase(worktree.base), said: true },
                      ]
                    : []),
                { label: t('detail.commits'), value: standing(worktree), said: true },
                {
                    label: t('detail.changes'),
                    value: worktree.changes > 0 ? t('table.changes', { count: worktree.changes }) : t('detail.clean'),
                    said: true,
                },
                ...(worktree.builtAt === null
                    ? []
                    : [
                          {
                              label: t('detail.built'),
                              value: formatWhen(worktree.builtAt, state.language),
                              said: true,
                          },
                      ]),
            ],
        },
        {
            // Every address it answers on, written out: the presses at the top open
            // them, and this is where one is taken from.
            title: t('table.address'),
            facts: [
                { label: t('detail.site'), value: host(worktree.url), copy: true },
                ...(worktree.backend === null
                    ? []
                    : [{ label: t('detail.backend'), value: host(worktree.backend), copy: true }]),
            ],
        },
        {
            // What was decided when it was built, and holds until it is built again.
            title: t('detail.serving'),
            facts: [
                {
                    label: t('table.php'),
                    // Only where the code asks for another version than the one serving:
                    // "8.2 (at least 8.2)" said the same thing twice.
                    value:
                        worktree.php +
                        (worktree.minPhp !== null && worktree.minPhp !== worktree.php
                            ? ` (${t('detail.minPhp', { version: worktree.minPhp })})`
                            : ''),
                },
                // A decision of the build: a branch whose .nvmrc says another version is
                // built with that one, and this is the only place that says so afterwards.
                ...(worktree.node === null ? [] : [{ label: t('table.node'), value: worktree.node }]),
                { label: t('table.profile'), value: worktree.profile ?? t('table.noProfile') },
                { label: t('table.docroot'), value: worktree.docroot === '' ? '/' : worktree.docroot },
            ],
        },
        {
            // The values that are not read but taken: the directory into a terminal,
            // the database into a database tool, the login into a form. Each carries
            // the button that copies it, and they stand together because that is what
            // a reader comes to this block to do.
            title: t('detail.taken'),
            facts: [
                { label: t('table.directory'), value: worktree.path, copy: true },
                { label: t('table.database'), value: worktree.database, copy: true },
                // The same login every time and in the documentation; having it here is
                // the difference between opening the backend and hunting through the log
                // of an operation from last week.
                //
                // Two rows and not one, because a login is pasted into two fields, one at
                // a time -- "admin / Password1!" was one button copying a line that fits
                // in neither of them.
                ...(worktree.backend === null
                    ? []
                    : [
                          { label: t('detail.user'), value: EDITOR.user, copy: true },
                          { label: t('detail.password'), value: EDITOR.password, copy: true },
                      ]),
            ],
        },
        ...(worktree.isProject ? [] : [storageGroup(usage)]),
    ];
}

/**
 * Measured while the page is already up, so the group keeps the shape it will
 * have: one row that said "Reading ..." and became four was the widest label on
 * the page arriving late, and every label is set against the widest of them.
 */
function storageGroup(usage: Usage): FactGroup {
    if (usage.trouble !== '') {
        return {
            title: t('detail.storage'),
            facts: [
                {
                    label: t('detail.storageTotal'),
                    value: `${t('detail.storageFailed')} ${usage.trouble}`,
                    said: true,
                },
            ],
        };
    }
    if (usage.value === null) {
        return {
            title: t('detail.storage'),
            facts: [
                { label: t('detail.storageTotal'), value: '', waiting: true },
                { label: t('detail.storageFiles'), value: '', waiting: true },
                { label: t('detail.storageDatabase'), value: '', waiting: true },
                { label: t('detail.storageShared'), value: t('detail.storageExcluded'), said: true },
            ],
        };
    }

    return {
        title: t('detail.storage'),
        facts: [
            { label: t('detail.storageTotal'), value: formatBytes(usage.value.total, state.language), said: true },
            { label: t('detail.storageFiles'), value: formatBytes(usage.value.files, state.language), said: true },
            {
                label: t('detail.storageDatabase'),
                value: formatBytes(usage.value.database, state.language),
                said: true,
            },
            { label: t('detail.storageShared'), value: t('detail.storageExcluded'), said: true },
        ],
    };
}

/**
 * Four answers, and they are not degrees of the same thing: in step, out of step
 * by so much, the branch it tracked gone from the remote, or tracking nothing at
 * all -- which means everything on it is here and nowhere else. The gone one
 * comes first, since "tracks no remote branch" about a branch that tracked one
 * until yesterday would be true and misleading at once.
 */
function standing(worktree: Worktree): string {
    if (worktree.gone) {
        return t('table.gone');
    }
    if (worktree.ahead === null || worktree.behind === null) {
        return t('detail.noRemote');
    }

    const apart = [
        ...(worktree.ahead > 0 ? [t('table.unpushed', { count: worktree.ahead })] : []),
        ...(worktree.behind > 0 ? [t('table.behind', { count: worktree.behind })] : []),
    ];

    return apart.length === 0 ? t('detail.inStep') : apart.join(' · ');
}
