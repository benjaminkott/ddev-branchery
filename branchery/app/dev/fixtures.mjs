/**
 * The project the mock API pretends to manage. Everything the interface can
 * show is written out here once. The shapes are those of src/Model and of
 * frontend/types.ts; only the content is invented.
 *
 * The step lists below are the ones WorktreeManager reports, in the same order
 * and with the same totals.
 */

import { deflateSync } from 'node:zlib';

export const TLD = 'branchery.ddev.site';

/** Same rule as Project::slug(): hostnames only take [a-z0-9-]. */
export function slug(value) {
    return value
        .replace(/[A-Z]/g, (letter) => letter.toLowerCase())
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function url(name) {
    return name === null ? `https://${TLD}/` : `https://${name}.${TLD}/`;
}

/** Where the project lies on the machine it is checked out on. */
export const HOST_ROOT = '/home/dev/projects/branchery';

/** The database DDEV creates for the project itself. */
export const PROJECT_DATABASE = 'db';

/** Same rule as ProjectDatabase::nameFor(): one database per worktree. */
export function databaseName(name) {
    return `branchery_${name.replace(/-/g, '_')}`;
}

function worktree(values) {
    const path = values.isProject ? HOST_ROOT : `${HOST_ROOT}/.worktrees/${values.name ?? ''}`;

    return {
        name: '',
        branch: '',
        // Set it apart from `branch` on one of them below to see the way back
        // offered.
        madeFor: values.branch ?? null,
        // Written down when the cut is made, so a worktree of a branch that
        // already existed has nothing here.
        forkedFrom: null,
        forkedAt: null,
        php: '8.3',
        minPhp: null,
        // Null is a container without any Node, which is a project this add-on
        // works in just as well -- and the one state where the fact is not shown.
        node: '22.11.0',
        database: values.isProject ? PROJECT_DATABASE : databaseName(values.name ?? ''),
        profile: 'typo3-app',
        docroot: 'public',
        changes: 0,
        // Null is "tracks nothing", not "in step".
        ahead: 0,
        behind: 0,
        ready: true,
        // Both are what the tidying offer is built on, and both are hard to
        // produce against a real project -- set them here to see it.
        merged: false,
        gone: false,
        // Both are invisible in a real project until a fortnight has passed.
        builtAt: null,
        stale: false,
        // A build that began and never got to its end. Hard to produce against a
        // real project on purpose, and the state a worktree spends the longest
        // looking finished in.
        incomplete: false,
        // In a real project these come out of the commit's own trailers, which is
        // exactly what a mock has none of.
        review: null,
        issue: null,
        issueId: null,
        // What a graph shows with a lane and a label, and what the list says in
        // words. Null for the trunk itself.
        base: { branch: 'main', own: 1, moved: 0 },
        tip: { sha: '5e9a71b', subject: '[BUGFIX] Keep the language of a copied record' },
        isProject: false,
        url: url(values.name ?? null),
        entrypoints: (values.profile ?? 'typo3-app').startsWith('typo3')
            ? [{ name: 'Backend', url: `${url(values.name ?? null)}typo3` }]
            : [],
        // Null where the configuration says nothing about accounts, and "made" is
        // the state a fork is in: it inherited the project's data and with it every
        // account in it. Press the button and it turns.
        account: (values.profile ?? 'typo3-app').startsWith('typo3')
            ? { user: values.name ?? '', password: '#Password1', made: false }
            : null,
        path,
        // What the container works out from the marks in the project and the
        // machine it stands on -- written out here, because the mock has neither.
        // Empty is a machine nothing was found on, which is a state worth seeing.
        editors: [
            { name: 'VS Code', url: `vscode://vscode-remote/wsl+Ubuntu${path}` },
            { name: 'PhpStorm', url: `phpstorm://open?file=\\\\wsl$\\Ubuntu${path.replace(/\//g, '\\')}` },
        ],
        ...values,
    };
}

/**
 * The moment is counted from now rather than written down: a fixed date would
 * have every row saying "two years ago" by the time anybody looks.
 */
function branch(name, daysAgo, sha, subject, values = {}) {
    return {
        name,
        when: Math.round(Date.now() / 1000 - daysAgo * 86400),
        tip: { sha, subject },
        onRemote: true,
        ...values,
    };
}

export const PHP_VERSIONS = ['8.2', '8.3', '8.4'];

/** A fresh world for every server start -- the mock keeps no state on disk. */
export function createWorld() {
    return {
        tld: TLD,
        projectName: 'branchery',
        branch: 'main',
        remotes: ['origin', 'upstream'],
        // Set it to null to see a project cloned from a directory, which has a
        // remote and nowhere to link to.
        repository: 'https://github.com/benjaminkott/ddev-branchery',
        phpVersions: PHP_VERSIONS,
        // Put a sentence here to see the shell's note about a broken
        // .ddev/branchery.yaml.
        recipeProblem: null,
        // Which image is answering. Change it while a tab is open and restart
        // the mock: the page should fetch itself again rather than go on running
        // the interface the version before served.
        version: 'dev',
        unconfigured: false,
        updateWaiting: false,
        updateAvailable: null,
        // Null while the port is the developer's own machine's. "router" and
        // "container" are the two ways it stops being -- see Exposure.
        exposed: null,
        projectPhp: '8.3',
        // The same application as the worktrees cut from it, so it has a type and
        // a way in like they do. Named as DDEV names the project, which is what
        // the container answers with.
        project: worktree({
            name: 'branchery',
            branch: 'main',
            isProject: true,
            changes: 3,
            url: url(null),
            entrypoints: [{ name: 'Backend', url: `${url(null)}typo3` }],
            base: null,
            tip: { sha: 'b02c8d4', subject: '[TASK] Raise doctrine/dbal to 4.2' },
        }),
        worktrees: [
            worktree({
                name: 'feature-checkout',
                forkedFrom: 'main',
                forkedAt: '5e9a71b3c2d4e6f8a0b1c2d3e4f5a6b7c8d9e0f1',
                branch: 'feature/checkout',
                php: '8.3',
                changes: 12,
                ahead: 3,
                base: { branch: 'main', own: 3, moved: 2 },
                tip: { sha: '9c4d2e1', subject: '[FEATURE] Check out a branch into a worktree of its own' },
                review: 'https://review.typo3.org/q/I4e71cccf7b662070d934680cf283e896a110dc99',
                issue: 'https://forge.typo3.org/issues/81291',
                issueId: '81291',
                // More than one, because a project has as many pages worth
                // opening as it has -- and that is what the header draws.
                entrypoints: [
                    { name: 'Backend', url: `${url('feature-checkout')}typo3` },
                    { name: 'Storybook', url: `${url('feature-checkout')}storybook` },
                ],
            }),
            worktree({
                name: 'bugfix-cache-headers',
                branch: 'bugfix/cache-headers',
                php: '8.2',
                minPhp: '8.2',
                // A container without any Node: the fact is then not shown at all.
                node: null,
                profile: 'composer',
                docroot: '',
                // One that an operation left half-made: the dependencies were never
                // installed, and the list says so.
                ready: false,
            }),
            worktree({
                name: 'v13',
                // One that has wandered: a patch was checked out in it, which is where the
                // way back is offered and what a review workflow leaves behind.
                branch: 'backport-95411',
                madeFor: '13.4',
                php: '8.4',
                base: { branch: '13.4', own: 1, moved: 0 },
                tip: { sha: 'e1f2a3b', subject: '[BUGFIX] Backport the livesearch filter to 13.4' },
                node: '24.14.0',
                profile: 'typo3-core',
                docroot: '',
                changes: 1,
                review: 'https://review.typo3.org/q/Ibb426e12fe37d89471c4b7fa8cb11fade77ba5f3',
                issue: 'https://forge.typo3.org/issues/110493',
                issueId: '110493',
            }),
            // The rest are here so the list is the length a list gets: everything that
            // only shows up at that length -- the filter, the head that stays -- is
            // invisible in a list of three. One merged the ordinary way and one whose
            // pull request was squashed: the two shapes the tidying offer tells apart.
            worktree({
                name: 'feature-search-facets',
                branch: 'feature/search-facets',
                php: '8.3',
                merged: true,
                base: { branch: 'main', own: 0, moved: 4 },
                tip: { sha: '7a1b2c3', subject: '[FEATURE] Facets in the search result' },
            }),
            worktree({ name: 'bugfix-broken-redirects', branch: 'bugfix/broken-redirects', php: '8.3', changes: 4 }),
            worktree({
                name: 'v11-legacy',
                branch: 'v11-legacy',
                php: '8.2',
                node: '18.20.4',
                stale: true,
                builtAt: Math.round(Date.now() / 1000) - 19 * 86400,
            }),
            // Everything a finished build leaves is here except the end of the build
            // itself. Nothing else about this row tells it from a finished one.
            worktree({
                name: 'v10-legacy',
                branch: 'v10-legacy',
                php: '8.2',
                node: null,
                profile: 'typo3-core',
                docroot: '',
                incomplete: true,
            }),
            worktree({
                name: 'task-old-endpoint',
                branch: 'task/old-endpoint',
                php: '8.3',
                gone: true,
                ahead: null,
                behind: null,
                base: { branch: 'main', own: 4, moved: 12 },
                tip: { sha: '3f74a19', subject: '[TASK] Drop the old endpoint' },
            }),
            worktree({
                name: 'renovate-typo3-13',
                branch: 'renovate/typo3-13',
                php: '8.4',
                profile: 'composer',
                ahead: 1,
                behind: 4,
                base: { branch: 'main', own: 1, moved: 4 },
                tip: { sha: 'd4e5f6a', subject: 'Update typo3/cms-core to 13.4.12' },
            }),
            // A release branch: off the trunk a long way back, and the trunk has gone
            // on since -- what a base that is far away looks like.
            worktree({
                name: 'v12',
                branch: '12.4',
                php: '8.2',
                minPhp: '8.1',
                node: '22.11.0',
                profile: 'typo3-core',
                docroot: '',
                behind: 14,
                base: { branch: 'main', own: 312, moved: 1480 },
                tip: { sha: '0a9b8c7', subject: '[RELEASE] 12.4.30' },
            }),
            // A branch that was never pushed: everything on it is here alone.
            worktree({
                name: 'spike-image-pipeline',
                branch: 'spike/image-pipeline',
                php: '8.4',
                // A generator ran, or a rebase stopped halfway: a few hundred files at
                // once, which is the case the list has to survive.
                changes: 217,
                ahead: null,
                behind: null,
                ready: false,
            }),
            // The name nothing has room for: the row has to hold its shape.
            worktree({
                name: 'bugfix-add-fallback-to-typoscript-conditions',
                branch: 'bugfix/add-fallback-to-typoscript-conditions',
                php: '8.3',
                changes: 2,
            }),
        ],
        /**
         * Branches without a worktree yet, the one that moved last first -- the order
         * git is asked in. More of them than the list shows at once, so the press that
         * brings the rest is there to look at; and one that is on no remote.
         */
        branches: [
            branch('bugfix/flexform-migration', 0.02, 'a41f0c2', '[BUGFIX] Keep the default value of a FlexForm field'),
            branch('feature/redirect-import', 0.5, '7d1e88a', '[FEATURE] Import redirects from a CSV file'),
            branch('renovate/symfony-7', 1, 'c93b204', '[TASK] Raise symfony/console to 7.2'),
            // Pulled down for review and never pushed anywhere.
            branch('review/98211', 2, '0b7fa63', '[BUGFIX] Show staged element information only once', {
                onRemote: false,
            }),
            branch('main', 3, 'b02c8d4', '[TASK] Raise doctrine/dbal to 4.2'),
            branch('13.4', 4, '3f5c1de', '[BUGFIX] Respect the storage of a file reference'),
            branch('feature/checkout', 6, '5e9a71b', '[FEATURE] Take payment at the counter'),
            branch('bugfix/cache-headers', 9, 'ea20f77', '[BUGFIX] Send no cache headers for a staged page'),
            branch('renovate/typo3-13', 14, '81c4b90', '[TASK] Raise typo3/cms-core to 13.4.3'),
            branch('feature/search-facets', 21, 'd6708ca', '[FEATURE] Narrow a search by its facets'),
            branch('bugfix/broken-redirects', 30, '4a9e12f', '[BUGFIX] Follow a redirect to a deleted page'),
            // The name nothing has room for, in this list as in the other.
            branch(
                'bugfix/add-fallback-to-typoscript-conditions',
                45,
                'f10b3d8',
                '[BUGFIX] Add a fallback to TypoScript conditions',
            ),
            branch('feature/multi-language-sitemap', 60, '2c8ab41', '[FEATURE] One sitemap per language'),
            branch('task/drop-the-old-installer', 63, 'ab77e05', '[TASK] Drop the installer nobody runs any more'),
            branch('bugfix/slug-collisions', 70, '58cd913', '[BUGFIX] Keep two pages of the same name apart'),
            branch('feature/webhook-log', 74, 'e4b1a70', '[FEATURE] Keep what a webhook was answered with'),
            branch('renovate/phpunit-12', 81, '7fa0c39', '[TASK] Raise phpunit/phpunit to 12.0'),
            branch('review/94770', 96, 'cc5e4a1', '[BUGFIX] Read the mount point of a shortcut', { onRemote: false }),
            branch('task/typed-properties', 110, '1d90e6b', '[TASK] Type what the extension configuration holds'),
            branch('12.4', 120, '9be705c', '[TASK] Set the version to 12.4.25'),
        ],
        /**
         * Three states of a branch the list cannot show and the page about one has
         * words for. In a real project git answers all three.
         */
        mergedBranches: ['feature/multi-language-sitemap'],
        goneBranches: ['task/drop-the-old-installer'],
        remoteOnlyBranches: ['renovate/phpunit-12'],
        jobs: new Map(),
        past: pastOperations(),
    };
}

/**
 * What was done to the worktrees before this session began. Without it, the
 * band that lists the operations and the line a failed one leaves behind show
 * only after running something, and only on the worktree it was run on.
 *
 * The one on v10-legacy is the point of the list: that worktree is the
 * unfinished build, and the page about it says where the build stopped by
 * reading the operation that stopped it.
 *
 * The moments are relative because the page says how long ago each was.
 */
function pastOperations() {
    const hour = 3600;

    return [
        {
            worktree: 'v11-legacy',
            command: 'worktree:add',
            ago: 30 * 24 * hour,
            steps: plans.add('v11-legacy', '11.5'),
        },
        {
            worktree: 'feature-checkout',
            command: 'worktree:fork',
            ago: 6 * 24 * hour,
            steps: plans.fork('feature-checkout', 'feature/checkout', 'main'),
        },
        {
            worktree: 'feature-checkout',
            command: 'database:sync',
            ago: 2 * 24 * hour,
            steps: plans.sync('feature-checkout', ''),
        },
        // The build that stopped, and the worktree whose row says so.
        {
            worktree: 'v10-legacy',
            command: 'worktree:add',
            ago: 4 * hour,
            steps: plans.add('v10-legacy', '10.4'),
            failed: true,
        },
        {
            worktree: 'feature-checkout',
            command: 'worktree:provision',
            ago: 2 * hour,
            steps: plans.provision('feature-checkout'),
        },
    ];
}

/**
 * Cut here, or found on the remote by a fetch. One cut here is on no remote
 * until somebody pushes it, which is the state the list has a word for.
 */
export function newBranch(name, tip, onRemote = false) {
    return { name, when: Math.round(Date.now() / 1000), tip, onRemote };
}

export function newWorktree(world, { name, branch, profile }) {
    return worktree({
        name,
        branch,
        php: world.projectPhp,
        profile: profile ?? 'typo3-app',
        // Just cut, and standing where it was cut.
        base: { branch: world.branch, own: 0, moved: 0 },
        tip: world.project.tip,
    });
}

/**
 * A worktree with an unpushed commit on it takes real work to produce, and it
 * is the state the page's own list and the question before dropping them are
 * drawn from.
 */
function nowMinus(seconds) {
    return Math.round(Date.now() / 1000) - seconds;
}

/**
 * The last of it, newest first, with what the remote has not marked. Two carry
 * something of their own -- one with a working copy that is not clean, which is
 * the state dropping them is refused in, and one clean, which is the state it
 * runs in.
 */
export function commitsOf(name) {
    // Asked by either name and answered out of one list: a branch that has a
    // worktree is one piece of work, and must not carry three commits on one
    // page and none on the other.
    const carried = CARRIED[name] ?? CARRIED[CHECKED_OUT_IN[name] ?? ''] ?? [];

    // What is on every branch under whatever it is carrying: somebody else's
    // work, which is what a page opened on an old worktree is asking about.
    const behind = [
        ['5e9a71b', '[BUGFIX] Keep the language of a copied record', 6 * 3600],
        ['b02c8d4', '[TASK] Raise doctrine/dbal to 4.2', 27 * 3600],
        ['3f74a19', '[FEATURE] Allow a site to be served under several hosts', 2 * 86400],
        ['c81e0af', '[BUGFIX] Do not swallow the exception of a failed import', 4 * 86400],
        ['a7d3f52', '[TASK] Drop the last of the TypoScript conditions parser', 5 * 86400],
        ['6b90c13', '[BUGFIX] Reset the workspace preview on logout', 6 * 86400],
        ['0d4e8a7', '[TASK] Move the redirect handler behind the middleware', 8 * 86400],
        ['9a1c05e', '[BUGFIX] Escape the label of a select in the list module', 9 * 86400],
        // The one commit here that changed nothing of its own: what a merge did is
        // what the two sides did.
        ['bb4d0f2', "Merge branch 'main' into feature/checkout", 10 * 86400],
        ['48f2b6d', '[FEATURE] Add a console command for the sitemap', 11 * 86400],
        ['e35a09c', '[TASK] Update the composer platform to PHP 8.3', 13 * 86400],
        // Past the first page, which is what makes the way further back visible: a
        // mock that stopped at ten said the branch stopped at ten.
        ['2c9f4b1', '[BUGFIX] Keep the sorting of a reordered file collection', 15 * 86400],
        ['77ae1d3', '[TASK] Let the scheduler report what it skipped', 16 * 86400],
        ['f0b2c85', '[FEATURE] Offer a preview link with a lifetime of its own', 18 * 86400],
        ['31d7e94', '[BUGFIX] Do not lose the mount point of a shortcut page', 19 * 86400],
        ['8ce50a2', '[TASK] Move the image processing behind an interface', 21 * 86400],
        ['a04b7f6', '[BUGFIX] Restore the label of a hidden content element', 23 * 86400],
        ['d6193ce', '[TASK] Read the site configuration once per request', 25 * 86400],
        ['5b8f207', '[FEATURE] Allow a redirect to be limited to one language', 27 * 86400],
        ['e7c3a41', '[BUGFIX] Escape the search word in the indexed search form', 29 * 86400],
        ['1f60d9b', '[TASK] Drop the compatibility layer for PHP 8.1', 31 * 86400],
        ['b93c076', '[BUGFIX] Keep a workspace record out of the live sitemap', 33 * 86400],
        ['4a2e8d5', '[TASK] Name every argument of the link builder', 35 * 86400],
    ].map(([sha, subject, ago]) => ({
        sha,
        subject,
        when: nowMinus(ago),
        author: 'Core Team',
        pushed: true,
        url: `https://github.com/benjaminkott/ddev-branchery/commit/${sha}`,
    }));

    // The container builds this out of what the project's own file says under
    // "links.commit" -- set it to null here to see the shape without one.
    const read = (sha) => `https://github.com/benjaminkott/ddev-branchery/commit/${sha}`;

    return [...carried.map((commit) => ({ ...commit, pushed: false, url: read(commit.sha) })), ...behind];
}

/**
 * By the name it is asked about: a worktree by its directory, a branch by its
 * branch name. Everything not named here carries nothing yet and stands where
 * the trunk does, which is the state a branch is in the day it is cut.
 */
const CARRIED = {
    'feature-checkout': [
        {
            sha: '9b31d02',
            subject: 'Do not cache a redirect that was never resolved',
            when: nowMinus(2 * 3600),
            author: 'Dev',
        },
        { sha: '4f2a1c9', subject: 'Add a test for the redirect cache', when: nowMinus(26 * 3600), author: 'Dev' },
        { sha: '1a2b3c4', subject: 'WIP: try it without the wrapper', when: nowMinus(3 * 86400), author: 'Dev' },
    ],
    'renovate-typo3-13': [
        { sha: '7c1d4e8', subject: 'Pin the lock file to what the build had', when: nowMinus(5 * 3600), author: 'Dev' },
    ],
    'review/98211': [
        {
            sha: '0b7fa63',
            subject: '[BUGFIX] Show staged element information only once',
            when: nowMinus(2 * 86400),
            author: 'Reviewer',
        },
        {
            sha: 'ce41a08',
            subject: '[BUGFIX] Read the staged element once per request',
            when: nowMinus(3 * 86400),
            author: 'Reviewer',
        },
    ],
    'feature/redirect-import': [
        {
            sha: '7d1e88a',
            subject: '[FEATURE] Import redirects from a CSV file',
            when: nowMinus(12 * 3600),
            author: 'Dev',
        },
        {
            sha: '2b90fc4',
            subject: '[TASK] Describe the columns the import expects',
            when: nowMinus(20 * 3600),
            author: 'Dev',
        },
        {
            sha: 'aa17b3e',
            subject: '[TASK] Add the command that runs the import',
            when: nowMinus(30 * 3600),
            author: 'Dev',
        },
    ],
    'bugfix/flexform-migration': [
        {
            sha: 'a41f0c2',
            subject: '[BUGFIX] Keep the default value of a FlexForm field',
            when: nowMinus(1800),
            author: 'Dev',
        },
    ],
};

const CHECKED_OUT_IN = {
    'feature/checkout': 'feature-checkout',
    'renovate/typo3-13': 'renovate-typo3-13',
};

/** The names that carry something, for a commit looked for across all of them. */
export const CARRYING = Object.keys(CARRIED);

/**
 * Invented from the list rather than kept beside it: the subject, the author
 * and the hash are the list's and have to be the same on both pages. What is
 * added here is what only the detail has.
 */
export function commitOf(name, sha) {
    // One repository holds every commit, however many checkouts stand around
    // it -- which is what the page about a commit on a branch without a
    // worktree does: it reads out of the project's own checkout.
    let commits = commitsOf(name);
    let at = commits.findIndex((commit) => commit.sha === sha);
    for (const other of CARRYING) {
        if (at !== -1) {
            break;
        }
        commits = commitsOf(other);
        at = commits.findIndex((commit) => commit.sha === sha);
    }
    if (at === -1) {
        return null;
    }
    const commit = commits[at];
    // What the container returns for a merge: two parents and no files, which
    // is git's own answer to what a merge changed.

    const merge = commit.subject.startsWith('Merge ');

    return {
        ...commit,
        id: `${commit.sha}${'0f3a9c14be7d25'.repeat(4)}`.slice(0, 40),
        body: bodyOf(commit.subject),
        parents: commits.slice(at + 1, at + (merge ? 3 : 2)).map((parent) => parent.sha),
        files: merge ? [] : filesOf(commit.sha),
    };
}

/** A message under a subject, in the register these are actually written in. */
function bodyOf(subject) {
    return [
        `${subject.replace(/^\[[A-Z]+\] /, '')} -- what it was doing instead was`,
        'reading the state once and then answering out of it, which is right',
        'until anything else writes.',
        '',
        'Resolves: #91234',
        'Releases: main, 13.4',
    ].join('\n');
}

/**
 * Taken from the same pool the uncommitted list uses and cut by the hash, so
 * the same commit always shows the same files.
 */
function filesOf(sha) {
    const pool = [
        ['modified', 'packages/site/Classes/Controller/PageController.php'],
        ['modified', 'packages/site/Resources/Public/Images/logo.png'],
        ['modified', 'packages/site/Configuration/Services.yaml'],
        ['added', 'packages/site/Tests/Functional/PageControllerTest.php'],
        ['modified', 'packages/site/Resources/Private/Templates/Page/Default.html'],
        ['deleted', 'packages/site/Classes/Legacy/PageResolver.php'],
        ['renamed', 'packages/site/Classes/Service/PageAccess.php'],
        ['modified', 'composer.lock'],
    ];
    const many = (parseInt(sha.slice(0, 2), 16) % pool.length) + 1;

    return pool.slice(0, many).map(([status, path]) => ({ status, path }));
}

/** The same, as the operation that drops them writes them into its log. */
export function unpushedOf(name) {
    return commitsOf(name).filter((commit) => !commit.pushed);
}

/**
 * A step of an operation: what the bar says while it runs, how long it takes
 * and what it writes into the log while it does.
 */
function step(label, seconds, ...lines) {
    return { label, seconds, lines };
}

export const plans = {
    add: (name, branch) => [
        step('Reading what the branch needs', 1, '→ Requires PHP ^8.2, running on 8.3.'),
        step(
            `Checking out worktree (origin/${branch})`,
            3,
            `Preparing worktree (new branch '${branch}')`,
            `HEAD is now at 4f2a1c9 ${branch}: latest state`,
        ),
        step('Reading how this is built', 1, '→ typo3-app (docroot: public)'),
        step('Choosing the versions', 1, '→ The project asks for PHP 8.3.', '→ Built with Node 22.11.0.'),
        step(
            'Installing dependencies',
            9,
            'Loading composer repositories with package information',
            'Updating dependencies',
            'Lock file operations: 0 installs, 0 updates, 0 removals',
            'Installing dependencies from lock file (including require-dev)',
            'Package operations: 128 installs, 0 updates, 0 removals',
            'Generating autoload files',
        ),
        step('Writing the configuration', 2, `→ vhost: ${name}.${TLD}`, '→ php-fpm pool written'),
        step(
            `Preparing the database (${databaseName(name)})`,
            5,
            `→ Creating database ${databaseName(name)}`,
            `→ Copying the database from ${PROJECT_DATABASE}`,
            `→ ${name}.${TLD}`,
            '→ Fitting the copied data to this code. Whether it fits is what the attempt answers, so a failure below is an answer and not a broken operation.',
            ' [OK] Extension(s) "core, extbase, fluid, frontend, fluid_styled_content, seo,',
            '      backend, install" successfully set up.',
        ),
        step('Finishing up', 2, '→ Flushing caches'),
    ],

    /**
     * The same operation where the data turns out not to fit the code it was
     * copied into -- the one outcome nothing can be known about beforehand, and
     * which no real project produces on demand. It shows the shape of that in the
     * log: a word before the attempt, the tool's own account once, and the two
     * lines that say what was done about it. The operation succeeds.
     */
    addWhereTheDataDoesNotFit: (name, branch) => [
        ...plans.add(name, branch).slice(0, -2),
        step(
            `Preparing the database (${databaseName(name)})`,
            11,
            `→ Creating database ${databaseName(name)}`,
            `→ Copying the database from ${PROJECT_DATABASE}`,
            `→ ${name}.${TLD}`,
            '→ Fitting the copied data to this code. Whether it fits is what the attempt answers, so a failure below is an answer and not a broken operation.',
            'In GroupResolver.php line 42:',
            '  Too few arguments to function TYPO3\\CMS\\Core\\Authentication\\GroupResolver::__construct(),',
            `  1 passed in /var/www/html/.worktrees/${name}/var/cache/code/di/DependencyInjectionContainer.php`,
            '  on line 2841 and exactly 2 expected',
            'extension:setup [-e|--extension EXTENSION]',
            '→ The data does not fit this code -- what the attempt said stands above.',
            '→ Installing the application instead; the copied data is dropped.',
            ' [OK] TYPO3 was successfully set up.',
        ),
        step('Finishing up', 2, '→ Flushing caches'),
    ],

    fork: (name, branch, from) => [
        step('Reading what the branch needs', 1, '→ Requires PHP ^8.2, running on 8.3.'),
        step(`Creating branch "${branch}" (4f2a1c9)`, 2, `Branched off from ${from || 'the project checkout'}`),
        step('Carrying over unversioned files', 2, '→ 4 files copied'),
        ...plans.add(name, branch).slice(2, -2),
        step(
            `Preparing the database (${databaseName(name)})`,
            6,
            `→ Creating database ${databaseName(name)}`,
            `→ Copying the database from ${from ? databaseName(from) : PROJECT_DATABASE}`,
        ),
        step('Finishing up', 2, '→ Flushing caches'),
    ],

    // A worktree built before, so its database holds an installation -- the
    // case the container fits to the code rather than installing over.
    provision: (name) => [
        step('Reading what the worktree needs', 1, '→ Requires PHP ^8.2, running on 8.3.'),
        ...plans.add(name, 'main').slice(2, -2),
        step(
            `Preparing the database (${databaseName(name)})`,
            4,
            '→ The database already holds an installation; fitting it to this code.',
        ),
        step('Finishing up', 2, '→ Flushing caches'),
    ],

    /** The same, with the database thrown away first. */
    reinstall: (name) => [
        step('Reading what the worktree needs', 1, '→ Requires PHP ^8.2, running on 8.3.'),
        ...plans.add(name, 'main').slice(2, -2),
        step(
            `Preparing the database (${databaseName(name)})`,
            6,
            `→ Dropping ${databaseName(name)} -- the application is installed anew.`,
            `→ Creating database ${databaseName(name)}`,
            '→ Importing the initial dataset',
        ),
        step('Finishing up', 2, '→ Flushing caches'),
    ],

    sync: (name, from) => [
        step(
            `Copying ${from ? databaseName(from) : PROJECT_DATABASE} into ${databaseName(name)}`,
            6,
            `→ Dropping ${databaseName(name)}`,
            `→ Creating database ${databaseName(name)}`,
            '→ 214 tables copied',
        ),
        step('Putting the addresses back', 1, `→ ${name}.${TLD}`),
        step(
            'Fitting the data to this code',
            4,
            ' [OK] Extension(s) "core, extbase, fluid, frontend, fluid_styled_content, seo,',
            '      backend, install" successfully set up.',
        ),
        step('Flushing caches', 2, '→ Flushing caches'),
    ],

    remove: (name) => [
        step('Removing database', 2, `→ Dropping ${databaseName(name)}`),
        step('Removing worktree', 3, `Removing worktrees/${name}`),
        step('Cleaning up', 1, '→ vhost and php-fpm pool removed'),
    ],

    /**
     * The one that takes something away: the branch back on its remote, and what
     * it was carrying alone named as it goes.
     */
    discard: (branch, upstream, commits) => [
        step(
            `Updating ${upstream.split('/')[0]}`,
            3,
            'From github.com:example/project',
            `   4f2a1c9..9b31d02  ${branch}       -> ${upstream}`,
        ),
        step(
            `Putting ${branch} back on ${upstream}`,
            1,
            `HEAD is now at 9b31d02 ${branch}: latest state`,
            ...commits.map((commit) => `→ Dropped ${commit.sha} ${commit.subject}`),
            '→ 1 commit no longer in any branch. "git reflog" in this worktree still finds them until git next collects.',
        ),
    ],

    /** The way back: off what was tried, onto what the worktree is named for. */
    restore: (left, wanted, upstream, behind) => [
        step(
            `Going back to ${wanted}`,
            1,
            `Switched to branch '${wanted}'`,
            `→ ${left} stays where it is; nothing committed on it is lost.`,
        ),
        ...plans.pull(wanted, upstream, behind),
    ],

    /**
     * Both ends of it: a branch that had something to catch up with, and one
     * already where the remote is -- the answer most often, and the one that has
     * to read as a success rather than as nothing.
     */
    account: (name) => [step('Making an account', 2, `→ 1 row affected.`, `Backend user "${name}" created.`)],
    pull: (branch, upstream, behind) => [
        step(
            `Updating ${upstream.split('/')[0]}`,
            3,
            'From github.com:example/project',
            `   4f2a1c9..9b31d02  ${branch}       -> ${upstream}`,
        ),
        behind === 0
            ? step(`Moving ${branch} onto ${upstream}`, 1, `→ ${branch} is already what ${upstream} has.`)
            : step(
                  `Moving ${branch} onto ${upstream}`,
                  1,
                  'Updating 4f2a1c9..9b31d02',
                  'Fast-forward',
                  ' composer.lock                    |  38 ++++----',
                  ' packages/core/Classes/Page.php   |  12 +--',
                  ' 2 files changed, 25 insertions(+), 25 deletions(-)',
                  `→ ${behind} commits brought in. The dependencies and the database are still the ones of before.`,
              ),
    ],

    fetch: (remote) => [
        step(
            `Update ${remote}`,
            4,
            `From github.com:example/${remote}`,
            '   4f2a1c9..9b31d02  main       -> origin/main',
            ' * [new branch]      feature/search-facets -> origin/feature/search-facets',
        ),
    ],
};

/**
 * Invented from the count rather than kept per worktree: the row's number is
 * the fixture, and a list that disagreed with it would be the mock lying about
 * the first thing the page reads.
 */
export function changesOf(worktree) {
    const pool = [
        ['modified', 'composer.json'],
        ['modified', 'packages/site/Resources/Public/Images/logo.png'],
        ['modified', 'config/sites/main/config.yaml'],
        ['added', 'packages/site/Resources/Public/Images/hero.jpg'],
        ['untracked', 'notes.md'],
        ['deleted', 'public/fileadmin/legacy-banner.gif'],
        ['added', 'packages/site/Classes/Middleware/RedirectCache.php'],
        ['deleted', 'packages/site/Configuration/TypoScript/Legacy.typoscript'],
        ['renamed', 'packages/site/Classes/Service/Redirects.php'],
        ['modified', 'packages/site/Tests/Functional/RedirectCacheTest.php'],
        ['modified', 'public/.htaccess'],
        ['untracked', 'public/typo3temp/assets/debug.log'],
        ['modified', 'composer.lock'],
        ['modified', 'packages/site/ext_localconf.php'],
        ['modified', 'config/system/settings.php'],
    ];

    return Array.from({ length: worktree.changes }, (_, index) => {
        const [status, path] = pool[index % pool.length];

        return { status, path: index < pool.length ? path : `${path}.${index}` };
    });
}

/** A hunk of the kind a review reads, invented from the path. */
export function diffOf(path) {
    const name = path.split('/').pop() ?? path;
    const lines = [
        { kind: 'context', text: '@@ -12,7 +12,8 @@' },
        { kind: 'context', text: `// ${name}` },
        { kind: 'del', text: '$cache->set($key, $response);' },
        { kind: 'add', text: 'if ($response->getStatusCode() < 300) {' },
        { kind: 'add', text: '    $cache->set($key, $response);' },
        { kind: 'add', text: '}' },
        { kind: 'context', text: '' },
        { kind: 'context', text: 'return $response;' },
    ];

    return { lines, truncated: path.endsWith('composer.lock') };
}

/**
 * Which files the interface shows as images rather than as a diff. The same
 * list App\Git\Images keeps, minus the media types: what the mock hands out is
 * always a PNG, whatever the file is called.
 */
const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico'];

export function isImage(path) {
    return IMAGE_TYPES.includes((path.split('.').pop() ?? '').toLowerCase());
}

/**
 * An image the mock hands out, drawn here rather than kept as a file: what a
 * fixture has to be is two of them that differ, and a pair of base64 blocks in
 * a source file is two things nobody can read or change.
 *
 * The path and the side decide what it looks like, so the same file is the same
 * image every time it is asked for and no two of them are alike.
 */
export function drawingOf(path, side) {
    const seed = [...`${path}:${side}`].reduce((sum, letter) => (sum * 31 + letter.codePointAt(0)) % 9973, 7);
    const wide = side === 'before' ? 320 : 384;

    return png(wide, 240, (x, y) => {
        const band = Math.floor((y / 240) * 6);
        const inside = x > wide / 6 && x < (wide * 5) / 6 && y > 60 && y < 180;
        const shade = (seed + band * 23) % 200;

        return inside
            ? [255 - shade, 40 + ((seed * 3) % 120), 90 + shade / 2]
            : [30 + shade / 3, 40 + band * 12, 90 + ((seed + band * 40) % 140)];
    });
}

/**
 * A PNG of one colour per pixel: the header, one deflated block of scanlines
 * and the end. Written out because an image is what this fixture is about --
 * every other way to have one is a binary file in the repository.
 */
function png(width, height, colour) {
    const raw = Buffer.alloc((width * 3 + 1) * height);
    for (let y = 0; y < height; y += 1) {
        // The first byte of every scanline says how it is filtered; none of them is.
        const start = y * (width * 3 + 1);
        for (let x = 0; x < width; x += 1) {
            const [red, green, blue] = colour(x, y);
            raw[start + 1 + x * 3] = red & 0xff;
            raw[start + 2 + x * 3] = green & 0xff;
            raw[start + 3 + x * 3] = blue & 0xff;
        }
    }

    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    // Eight bits a channel, three channels, and none of the optional machinery.
    header.set([8, 2, 0, 0, 0], 8);

    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', header),
        chunk('IDAT', deflateSync(raw)),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

function chunk(type, data) {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, 'ascii');
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(crc(Buffer.concat([head.subarray(4), data])), 0);

    return Buffer.concat([head, data, tail]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    return value >>> 0;
});

function crc(bytes) {
    let value = 0xffffffff;
    for (const byte of bytes) {
        value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
    }

    return (value ^ 0xffffffff) >>> 0;
}
