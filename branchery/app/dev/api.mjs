/**
 * The REST API of the management application, without the application.
 *
 * The route table is the one from src/Http/Router.php, and every answer keeps
 * the status and the shape ApiController gives it. The interface must not be
 * able to tell the difference; only what happens behind the routes is invented.
 *
 * Operations do not run, they pass: a job is a list of steps with durations,
 * and its state is computed from the clock whenever it is asked for.
 */

import {
    changesOf,
    commitOf,
    commitsOf,
    createWorld,
    diffOf,
    drawingOf,
    isImage,
    newBranch,
    newWorktree,
    plans,
    slug,
    unpushedOf,
} from './fixtures.mjs';

/** A branch or name carrying this word makes its operation fail -- for the error views. */
const FAILURE_MARKER = 'fail';

/**
 * And this one makes it go past something it could not do: a recipe line the
 * project called optional, a PHP pool the image has not. The ending worth
 * looking at, because it used to be drawn exactly like the one where
 * everything worked.
 */
const WARNING_MARKER = 'warn';

/**
 * And this one stands for a lock file composer would refuse: the one thing the
 * summary warns about before the press, and the one state a mock cannot read
 * out of two files it does not have.
 */
const STALE_MARKER = 'stale';

/** What the container writes when it goes past a line the recipe allowed to fail. */
const WENT_ON_WITHOUT_IT =
    '⚠ The recipe calls this line optional, and the build went on without it. ' +
    'cd Build && npm ci failed with exit status 1.';

export function createApi() {
    const world = createWorld();
    rememberWhatWasDone(world);

    const routes = [
        ['GET', /^\/api\/state$/, () => state()],
        ['GET', /^\/api\/worktrees$/, () => json(world.worktrees)],
        ['POST', /^\/api\/worktrees$/, (_, payload) => create(payload)],
        // Before the pattern that would swallow it, as in the container.
        ['GET', /^\/api\/worktrees\/preview$/, (_, _payload, query) => preview(query)],
        ['PATCH', /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)$/, (v, payload) => update(v.name, payload)],
        [
            'POST',
            /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/provision$/,
            (v, payload) => provision(v.name, payload),
        ],
        ['POST', /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/sync$/, (v, payload) => sync(v.name, payload)],
        ['POST', /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/pull$/, (v) => pull(v.name)],
        ['POST', /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/restore$/, (v) => restore(v.name)],
        ['POST', /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/discard$/, (v) => discard(v.name)],
        ['POST', /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/account$/, (v) => account(v.name)],
        [
            'GET',
            /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/commits$/,
            (v, _payload, query) => commits(v.name, query),
        ],
        [
            'GET',
            /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/commits\/(?<sha>[0-9a-f]{4,40})$/,
            (v) => commit(v.name, v.sha),
        ],
        [
            'GET',
            /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/commits\/(?<sha>[0-9a-f]{4,40})\/diff$/,
            (v, _payload, query) => commitDiff(v.name, v.sha, query),
        ],
        ['GET', /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/changes$/, (v) => changes(v.name)],
        [
            'GET',
            /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/changes\/diff$/,
            (v, _payload, query) => changeDiff(v.name, query),
        ],
        [
            'GET',
            /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/file$/,
            (v, _payload, query) => file(v.name, query),
        ],
        ['GET', /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/usage$/, (v) => usage(v.name)],
        ['DELETE', /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)$/, (v) => remove(v.name)],
        ['GET', /^\/api\/branches$/, () => json(available())],
        // The branch travels behind the question mark and not in the path: its
        // name has slashes in it, and a segment that may hold one cannot say where
        // it ends.
        ['GET', /^\/api\/branch$/, (_v, _payload, query) => branch(query)],
        ['GET', /^\/api\/branch\/commits$/, (_v, _payload, query) => branchCommits(query)],
        ['POST', /^\/api\/fetch$/, (_, payload) => fetch(payload)],
        ['GET', /^\/api\/php-versions$/, () => json(world.phpVersions)],
        ['GET', /^\/api\/worktrees\/(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)\/jobs$/, (v) => json(history(v.name))],
        ['GET', /^\/api\/jobs\/(?<id>[A-Za-z0-9-]+)$/, (v, _body, query) => json(jobState(v.id, since(query)))],
    ];

    /**
     * @param {string} method
     * @param {string} path
     * @param {string} body raw request body
     * @param {Record<string, string>} query what stood behind the question mark
     */
    function dispatch(method, path, body, query = {}) {
        // Whatever ran out while nobody was watching takes effect before the next
        // answer is written.
        settle();

        // Like the router: the path decides which routes are candidates, the
        // method which of them answers.
        let known = false;
        for (const [verb, pattern, handler] of routes) {
            const match = pattern.exec(path);
            if (!match) {
                continue;
            }
            known = true;
            if (verb !== method) {
                continue;
            }
            try {
                return handler(match.groups ?? {}, payload(body), query);
            } catch (error) {
                // index.php answers 400 for what the caller asked for wrongly, 404 for
                // what it named and is not here, 409 for a worktree already being worked
                // on, and 500 for everything else.
                const status =
                    error instanceof RangeError
                        ? 400
                        : error instanceof MissingError
                          ? 404
                          : error instanceof BusyError
                            ? 409
                            : 500;

                return json({ error: error.message }, status);
            }
        }

        return known ? json({ error: 'Method not allowed.' }, 405) : json({ error: 'Unknown endpoint.' }, 404);
    }

    function state() {
        return json({
            tld: world.tld,
            projectName: world.projectName,
            branch: world.branch,
            project: world.project,
            worktrees: world.worktrees,
            branches: available(),
            remotes: world.remotes,
            repository: world.repository ?? null,
            phpVersions: world.phpVersions,
            runningJobs: running(),
            // A project whose recipe is wrong: set it in the fixtures to see it.
            recipeProblem: world.recipeProblem ?? null,
            // A project that has said nothing about how its worktrees are built: set
            // it in the fixtures to see the note that says so.
            unconfigured: world.unconfigured ?? false,
            // Which image is answering. Change it in the fixtures while the page is
            // open to see what a restart under an open tab does.
            version: world.version ?? 'dev',
            // A version installed but not yet built into the image: set it in the
            // fixtures to see what the shell says about it.
            updateWaiting: world.updateWaiting ?? false,
            // A newer version than the one this project asks for: set it in the
            // fixtures to see the note that says so and how to fetch it.
            updateAvailable: world.updateAvailable ?? null,
            exposed: world.exposed ?? null,
        });
    }

    /** Branches that do not have a worktree yet. */
    function available() {
        const taken = new Set([world.project?.branch, ...world.worktrees.map((entry) => entry.branch)]);

        return world.branches.filter((branch) => !taken.has(branch.name));
    }

    /**
     * What the container reads out of git is invented here: where the branch was
     * cut from, what it tracks, and the two states a list cannot show -- a branch
     * already in the trunk, and one the remote has dropped.
     */
    function branch(query) {
        const name = String(query.branch ?? '').trim();
        if (!BRANCH_NAME.test(name)) {
            return error('Invalid branch name.');
        }
        const found = world.branches.find((entry) => entry.name === name);
        if (!found) {
            throw new MissingError('There is no such branch.');
        }
        const base = baseOf(name);
        const own = base?.own ?? 0;
        // A branch that is only on the remote tracks nothing: it is the thing that
        // would be tracked. One on no remote tracks nothing either.
        const tracked = found.onRemote && !world.remoteOnlyBranches.includes(name);

        return json({
            ...found,
            base,
            upstream: tracked ? `origin/${name}` : null,
            ahead: tracked ? own : null,
            behind: tracked ? 0 : null,
            merged: world.mergedBranches.includes(name),
            gone: world.goneBranches.includes(name),
            worktree: on(name),
        });
    }

    /** What is on one branch, newest first -- as for a worktree. */
    function branchCommits(query) {
        const name = String(query.branch ?? '').trim();
        if (!BRANCH_NAME.test(name)) {
            return error('Invalid branch name.');
        }
        if (!world.branches.some((entry) => entry.name === name)) {
            throw new MissingError('There is no such branch.');
        }
        const skip = Math.max(0, parseInt(query.skip ?? '0', 10) || 0);
        const base = baseOf(name);
        const all = commitsOf(name).map((commit, at) => ({
            ...commit,
            own: base === null || at < base.own,
        }));

        return json({
            upstream: world.remoteOnlyBranches.includes(name) ? null : `origin/${name}`,
            base: base?.branch ?? null,
            more: all.length > skip + COMMIT_PAGE,
            commits: all.slice(skip, skip + COMMIT_PAGE),
        });
    }

    /**
     * The project's own branch, unless it is that branch or a release branch of its
     * own -- those are cut from nothing.
     */
    function baseOf(name) {
        if (name === world.branch || /^\d+\.\d+$/.test(name)) {
            return null;
        }

        return { branch: world.branch, own: commitsOf(name).filter((commit) => !commit.pushed).length, moved: 4 };
    }

    /** The worktree standing on a branch, where one does. */
    function on(name) {
        return world.project?.branch === name
            ? world.project.name
            : (world.worktrees.find((entry) => entry.branch === name)?.name ?? null);
    }

    function create(payload) {
        const name = optionalName(payload.name) ?? slug(String(payload.branch ?? ''));
        const branch = String(payload.branch ?? '').trim();

        if (!BRANCH_NAME.test(branch)) {
            return error('Invalid branch name.');
        }
        if (name === world.project.name) {
            return error(itself(name));
        }
        assertFree(name);

        const fork = (payload.mode ?? 'branch') === 'fork';
        const from = fork ? String(payload.from ?? '') : '';
        // Refused here rather than minutes later by the operation, as the
        // container does.
        if (from !== '') {
            mustFind(from);
        }

        // The release branch of this invented project is where the copied data
        // does not fit the code it lands in -- the one outcome that cannot be
        // produced on demand against a real one.
        const add = branch === '13.4' ? plans.addWhereTheDataDoesNotFit : plans.add;

        return accepted(
            start(
                fork ? plans.fork(name, branch, from) : add(name, branch),
                () => {
                    world.worktrees = [...world.worktrees, newWorktree(world, { name, branch })];
                    if (fork && !world.branches.some((entry) => entry.name === branch)) {
                        world.branches = [...world.branches, newBranch(branch, world.project.tip)];
                    }
                },
                `${branch} ${name}`,
                name,
                fork ? 'worktree:fork' : 'worktree:add',
            ),
        );
    }

    /**
     * The same answers ApiController::preview() gives: the version the first step
     * reads, and what that step would stop on.
     */
    function preview(query) {
        const branch = String(query.branch ?? '').trim();
        if (!BRANCH_NAME.test(branch)) {
            return error('Invalid branch name.');
        }
        const fork = query.mode === 'fork';
        const from = fork ? String(query.from ?? '').trim() : '';
        const source = from !== '' ? mustFind(from) : null;
        if (!fork && !world.branches.some((entry) => entry.name === branch)) {
            return error(`Branch "${branch}" is unknown.`);
        }

        const warnings = [];
        // The one refusal about the name, said as the container's foresee() says it.
        const name = optionalName(query.name) ?? slug(branch);
        if (name === world.project.name) {
            warnings.push(itself(name));
        }
        if (branch.includes(STALE_MARKER)) {
            const origin = source ? `worktree "${from}"` : 'the project checkout';
            warnings.push(
                fork
                    ? `The composer.lock carried over from ${origin} lacks a9f/typo3-fractor, which composer.json requires. ` +
                          `composer install refuses such a lock file, so the build will stop at the dependencies -- ` +
                          `"composer update a9f/typo3-fractor" in ${origin} puts it right.`
                    : `composer.lock on origin/${branch} lacks a9f/typo3-fractor, which composer.json requires. ` +
                          `composer install refuses such a lock file, so the build will stop at the dependencies -- ` +
                          `"composer update a9f/typo3-fractor" on that branch, committed, puts it right.`,
            );
        }

        return json({ php: source?.php ?? world.projectPhp, readFrom: null, warnings });
    }

    function update(name, payload) {
        const worktree = mustFind(name);
        assertFree(name);

        if (payload.php !== undefined) {
            const php = String(payload.php);
            if (!world.phpVersions.includes(php)) {
                return error(`PHP ${php} is not available.`);
            }
            if (worktree.minPhp !== null && olderThan(php, worktree.minPhp)) {
                return error(`This worktree needs at least PHP ${worktree.minPhp}.`);
            }
            replace({ ...worktree, php });

            return json({ ok: true });
        }

        return error('Nothing to change.');
    }

    function sync(name, payload) {
        mustFind(name);
        assertFree(name);
        const from = String(payload.from ?? '');
        if (from !== '') {
            mustFind(from);
        }
        if (from === name) {
            return error('A worktree cannot take its data from itself.');
        }

        // Nothing of the world changes: the data is not part of it.
        return accepted(start(plans.sync(name, from), () => {}, name, name, 'database:sync'));
    }

    function provision(name, payload = {}) {
        mustFind(name);
        assertFree(name);

        // The two answers the interface asks for, as the container carries them
        // out: the data is kept and fitted, or it goes and is installed.
        const plan = payload.fresh === true ? plans.reinstall(name) : plans.provision(name);

        // What a build that reaches its end leaves behind: the dependencies, and
        // the record that it got there. Without the second half the way out of a
        // worktree whose build stopped could be pressed and nothing would change.
        return accepted(
            start(
                plan,
                () => {
                    world.worktrees = world.worktrees.map((entry) =>
                        entry.name === name
                            ? {
                                  ...entry,
                                  ready: true,
                                  incomplete: false,
                                  stale: false,
                                  builtAt: Math.round(Date.now() / 1000),
                              }
                            : entry,
                    );
                },
                name,
                name,
                'worktree:provision',
            ),
        );
    }

    /**
     * It moves, or it is refused for one of the reasons it can be refused --
     * refused by the operation and not by the answer: the container accepts every
     * one of these with 202 and only the job knows the reason.
     */
    function pull(name) {
        const worktree = mustFind(name);
        assertFree(name);

        const upstream = `origin/${worktree.branch}`;
        const behind = worktree.behind ?? 0;

        if (worktree.behind === null) {
            return accepted(
                refused(
                    plans.pull(worktree.branch, upstream, 0),
                    name,
                    'worktree:pull',
                    `"${worktree.branch}" follows no remote branch, so there is nothing to bring in. Push it once and it will.`,
                ),
            );
        }

        return accepted(
            start(
                plans.pull(worktree.branch, upstream, behind),
                () => {
                    world.worktrees = world.worktrees.map((entry) =>
                        entry.name === name ? { ...entry, behind: 0, stale: behind > 0 ? true : entry.stale } : entry,
                    );
                },
                name,
                name,
                'worktree:pull',
            ),
        );
    }

    /** Back onto the branch the worktree was made for, and up to date on it. */
    function restore(name) {
        const worktree = mustFind(name);
        assertFree(name);

        const wanted = worktree.madeFor ?? '';
        const behind = 6;
        if (wanted === '' || wanted === worktree.branch) {
            return accepted(
                refused(
                    plans.restore(worktree.branch, worktree.branch, `origin/${worktree.branch}`, 0),
                    name,
                    'worktree:restore',
                    `"${name}" is on ${worktree.branch} already.`,
                ),
            );
        }

        return accepted(
            start(
                plans.restore(worktree.branch, wanted, `origin/${wanted}`, behind),
                () => {
                    world.worktrees = world.worktrees.map((entry) =>
                        entry.name === name ? { ...entry, branch: wanted, ahead: 0, behind: 0, stale: true } : entry,
                    );
                },
                name,
                name,
                'worktree:restore',
            ),
        );
    }

    /** What is uncommitted, file by file -- as many as the row counts. */
    function changes(name) {
        const worktree = mustCheckout(name);

        return json({ changes: changesOf(worktree) });
    }

    /** The change in one of them; a path outside the checkout is refused. */
    function changeDiff(name, query) {
        const worktree = mustCheckout(name);
        const path = insideCheckout(query);
        if (path === null) {
            return error('The path has to name a file inside the checkout.');
        }
        const change = changesOf(worktree).find((entry) => entry.path === path);

        return json({ path, ...changeIn(name, path, change?.status ?? 'modified', false) });
    }

    /**
     * One image, as itself. Always a PNG whatever the file is called: what the
     * mock has to be right about is the door and the bytes behind it.
     */
    function file(name, query) {
        mustCheckout(name);
        const path = insideCheckout(query);
        if (path === null) {
            return error('The path has to name a file inside the checkout.');
        }
        if (!isImage(path)) {
            return error('That is not a file this hands out.');
        }
        const blob = String(query.blob ?? '').trim();
        if (blob !== '' && !/^[0-9a-f]{4,40}$/.test(blob)) {
            return error('That is not an object of the repository.');
        }

        return {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': blob === '' ? 'no-store' : 'private, max-age=31536000, immutable',
                'X-Content-Type-Options': 'nosniff',
            },
            body: drawingOf(path, blob === blobOf(path, 'before') ? 'before' : 'after'),
        };
    }

    /**
     * The change in one file: the two images where the file is one, and a diff
     * otherwise. Which sides there are follows the status -- what the change
     * added has nothing before it, what it deleted nothing after.
     */
    function changeIn(name, path, status, committed) {
        if (!isImage(path)) {
            return { image: null, ...diffOf(path) };
        }

        return {
            lines: [],
            truncated: false,
            image: {
                before: ['added', 'untracked'].includes(status) ? null : sideOf(name, path, 'before', true),
                after: status === 'deleted' ? null : sideOf(name, path, 'after', committed),
            },
        };
    }

    /**
     * Where the browser fetches one side from. What is committed is an object of
     * the repository and named by it; the working copy's own file is not, and is
     * asked for by its path alone.
     */
    function sideOf(name, path, side, held) {
        const asked = `path=${encodeURIComponent(path)}` + (held ? `&blob=${blobOf(path, side)}` : '');

        return {
            source: `/api/worktrees/${encodeURIComponent(name)}/file?${asked}`,
            bytes: drawingOf(path, side).length,
        };
    }

    /** How many commits a page of the log is, as the container pages it. */
    const COMMIT_PAGE = 10;

    /** What git takes as a branch name, as ApiController holds it to the same. */
    const BRANCH_NAME = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/;

    /** What is on the branch, newest first, a page at a time. */
    function commits(name, query = {}) {
        const worktree = mustCheckout(name);
        const skip = Math.max(0, parseInt(query.skip ?? '0', 10) || 0);
        // The branch's own commits are the ones above the cut; everything is its
        // own on the trunk.
        const all = commitsOf(name).map((commit, at) => ({
            ...commit,
            own: worktree.base === null || at < worktree.base.own,
        }));

        return json({
            upstream: worktree.ahead === null ? null : `origin/${worktree.branch}`,
            base: worktree.base?.branch ?? null,
            more: all.length > skip + COMMIT_PAGE,
            commits: all.slice(skip, skip + COMMIT_PAGE),
        });
    }

    /** One of them in full: its message, what it leads back to, what it touched. */
    function commit(name, sha) {
        mustCheckout(name);
        const found = commitOf(name, sha);

        // A sha in an address outlives the branch it was read on, and the
        // container answers that with a 404 rather than an error about git.
        if (!found) {
            throw new MissingError('This branch has no such commit.');
        }

        return json(found);
    }

    function commitDiff(name, sha, query) {
        mustCheckout(name);
        if (!commitOf(name, sha)) {
            throw new MissingError('This branch has no such commit.');
        }
        const path = insideCheckout(query);
        if (path === null) {
            return error('The path has to name a file inside the checkout.');
        }
        const touched = commitOf(name, sha)?.files.find((entry) => entry.path === path);

        return json({ path, ...changeIn(name, path, touched?.status ?? 'modified', true) });
    }

    /**
     * A worktree whose configuration says nothing about accounts answers null
     * there, and the page offers no press -- so a request for one is a request
     * this project has no answer to.
     */
    function account(name) {
        const worktree = mustFind(name);
        assertFree(name);

        if (worktree.account === null) {
            return error('This project says nothing about how an account is made.');
        }

        return accepted(
            start(
                plans.account(worktree.account.user),
                () => {
                    world.worktrees = world.worktrees.map((entry) =>
                        entry.name === name ? { ...entry, account: { ...entry.account, made: true } } : entry,
                    );
                },
                name,
                name,
                'worktree:account',
            ),
        );
    }

    /** The one answer here that ends with something gone. */
    function discard(name) {
        const worktree = mustFind(name);
        assertFree(name);

        const plan = plans.discard(worktree.branch, `origin/${worktree.branch}`, unpushedOf(name));
        if (worktree.ahead === null) {
            return accepted(
                refused(
                    plan,
                    name,
                    'worktree:discard',
                    `"${worktree.branch}" follows no remote branch. Everything on it is here and nowhere else, so there is nothing to put it back onto.`,
                ),
            );
        }
        if (worktree.changes > 0) {
            return accepted(
                refused(
                    plan,
                    name,
                    'worktree:discard',
                    `${worktree.changes} changes in this worktree were never committed, and putting the branch back would write over them. Commit or stash them first.`,
                ),
            );
        }

        return accepted(
            start(
                plan,
                () => {
                    world.worktrees = world.worktrees.map((entry) =>
                        entry.name === name ? { ...entry, ahead: 0, behind: 0, stale: true } : entry,
                    );
                },
                name,
                name,
                'worktree:discard',
            ),
        );
    }

    function remove(name) {
        mustFind(name);
        assertFree(name);

        return accepted(
            start(
                plans.remove(name),
                () => {
                    world.worktrees = world.worktrees.filter((entry) => entry.name !== name);
                },
                name,
                name,
                'worktree:remove',
            ),
        );
    }

    /** The two places a worktree owns space; shared project resources stay out. */
    function usage(name) {
        mustFind(name);

        const marker = [...name].reduce((sum, character) => sum + character.codePointAt(0), 0);
        const files = (540 + (marker % 420)) * 1024 * 1024;
        const database = (760 + (marker % 960)) * 1024 * 1024;

        return json({ files, database, total: files + database });
    }

    function fetch(payload) {
        if (world.remotes.length === 0) {
            return error('The repository has no remote to fetch from.');
        }

        const remote = String(payload.remote ?? '').trim();
        if (remote !== '' && !world.remotes.includes(remote)) {
            throw new MissingError('Unknown remote.');
        }

        const found = 'renovate/lock-file-maintenance';

        return accepted(
            start(
                plans.fetch(remote || world.remotes[0]),
                () => {
                    if (!world.branches.some((entry) => entry.name === found)) {
                        world.branches = [
                            ...world.branches,
                            newBranch(found, { sha: '6ab019c', subject: '[TASK] Refresh the lock file' }, true),
                        ];
                    }
                },
                remote,
                '',
                'git:fetch',
            ),
        );
    }

    /* -------------------------------------------------------------- jobs -- */

    /**
     * @param {Array<{label: string, seconds: number, lines: string[]}>} steps
     * @param {() => void} effect what the operation leaves behind
     * @param {string} subject the branch or name it was asked for; carries the markers
     */
    function start(steps, effect, subject = '', worktree = '', command = '', reason = null) {
        const id = jobId();
        // Said where the work is done rather than at the end: the operation goes
        // on, and nothing else about it changes.
        const marked = subject.toLowerCase().includes(WARNING_MARKER)
            ? steps.map((entry, index) =>
                  index === Math.min(4, steps.length - 1)
                      ? { ...entry, lines: [...entry.lines, WENT_ON_WITHOUT_IT] }
                      : entry,
              )
            : steps;
        // A failing operation stops in the middle rather than at the end -- that
        // is where a real one breaks, and it leaves a half-written log. One that
        // was refused stops before it began.
        const failsAt = reason !== null ? 0 : subject.toLowerCase().includes(FAILURE_MARKER) ? stopsAt(steps) : null;

        // Which worktree it was about, as the real JobRunner records it.
        world.jobs.set(id, {
            id,
            steps: marked,
            effect,
            failsAt,
            reason,
            startedAt: Date.now(),
            settled: false,
            worktree,
            command,
        });

        return id;
    }

    /**
     * An operation the container accepts and the job then refuses: its first step
     * is reached and stops there, with the reason on the line the interface reads
     * it from. Nothing of the world changes.
     */
    function refused(plan, name, command, reason) {
        const [first] = plan;

        return start([{ ...first, seconds: 0, lines: [] }], () => {}, name, name, command, reason);
    }

    /** Everything that was done to one worktree, newest first. */
    function history(name) {
        return [...world.jobs.values()]
            .filter((job) => job.worktree === name)
            .reverse()
            .map((job) => {
                const state = jobState(job.id);

                return {
                    id: job.id,
                    command: job.command,
                    status: state.status,
                    elapsed: state.elapsed,
                    started: Math.floor(job.startedAt / 1000),
                };
            });
    }

    /** How much of a log the caller says it has already, as JobRunner reads it. */
    function since(query) {
        return Math.max(0, Number.parseInt(query.since ?? '0', 10) || 0);
    }

    /**
     * Up to the last complete line, the way JobRunner reports a log that is still
     * being written -- so the interface meets the same half-written state here
     * that it meets against a container.
     */
    function wholeLines(log) {
        const last = log.lastIndexOf('\n');

        return last === -1 ? 0 : last + 1;
    }

    /**
     * @param {number} since how much of the log the caller has already, which is
     *                       what the last answer reported as its size
     */
    function jobState(id, since = 0) {
        const job = world.jobs.get(id);
        if (!job) {
            // Same as JobRunner for an id it has no files for.
            return {
                id,
                status: 'unknown',
                subject: '',
                command: '',
                step: null,
                steps: [],
                elapsed: 0,
                log: '',
                size: 0,
                partial: false,
                interrupted: false,
            };
        }

        const elapsed = Math.floor((Date.now() - job.startedAt) / 1000);
        const last = job.failsAt ?? job.steps.length - 1;
        const log = [];
        const steps = [];
        let step = null;
        let passed = 0;
        let written = 0;

        /** One line into the log, answering where in it that line begins. */
        const write = (line) => {
            const from = log.length === 0 ? 0 : written + 1;
            log.push(line);
            written = from + line.length;

            return from;
        };

        for (const [index, entry] of job.steps.entries()) {
            if (index > last || elapsed < passed) {
                break;
            }
            step = { no: index + 1, total: job.steps.length, label: entry.label };
            // The shape JobRunner hands out: the steps as data for the list, and in
            // the log as well -- that one is read as a whole.
            const from = write(`[${step.no}/${step.total}] ${entry.label}`);
            for (const line of entry.lines) {
                write(line);
            }
            steps.push({
                no: step.no,
                label: entry.label,
                output: entry.lines.join('\n'),
                state: 'done',
                seconds: entry.seconds,
                // Where this step begins. The next one's start is where it ends,
                // which is what says whether it has moved -- as in JobRunner.
                from,
            });
            passed += entry.seconds;
        }

        const running = elapsed < passed;
        if (steps.length > 0 && running) {
            steps[steps.length - 1].state = 'running';
        }
        if (job.failsAt !== null && !running) {
            // The shape AbstractJobCommand writes: the reason on a line of its own,
            // marked, so the interface can lift it out of the log.
            const said =
                job.reason !== null
                    ? [`✗ ${job.reason}`]
                    : [
                          'Your requirements could not be resolved to an installable set of packages.',
                          // The wording WorktreeContext::failed() writes, which is what
                          // the page lifts the reason out of the log by.
                          '✗ composer install --no-interaction --no-progress failed with exit status 1.',
                      ];
            for (const line of said) {
                write(line);
            }
            if (steps.length > 0) {
                const stopped = steps[steps.length - 1];
                stopped.state = 'failed';
                stopped.output = [stopped.output, ...said].filter(Boolean).join('\n');
            }
        }
        if (job.failsAt === null && !running && step) {
            step = { ...step, no: step.total };
        }

        const whole = log.join('\n');
        // While it is being written a log is only reported up to its last complete
        // line, exactly as JobRunner does it.
        const size = running ? wholeLines(whole) : whole.length;
        const carried = since > 0 && since <= size ? since : 0;

        return {
            id,
            steps: steps.map((entry, index) => ({
                no: entry.no,
                label: entry.label,
                // Left out where the step was over before the caller's last look:
                // it cannot have written another line since.
                output: carried > 0 && (steps[index + 1]?.from ?? size) <= carried ? null : entry.output,
                state: entry.state,
                seconds: entry.seconds,
            })),
            status: running ? 'running' : job.failsAt === null ? 'done' : 'failed',
            // What it is about and what it runs, as JobRunner reports them: a page
            // opened while it was already running has nothing else to learn it from.
            subject: job.worktree,
            command: job.command,
            step,
            elapsed: Math.min(elapsed, passed),
            log: whole.slice(carried, size),
            size,
            partial: carried > 0,
            // The container reports an operation whose process is gone as one that
            // stopped. Nothing here can stop, so it is always false -- and it is here
            // so the shape matches.
            interrupted: false,
        };
    }

    /** What has run out takes effect, once. */
    function settle() {
        for (const job of world.jobs.values()) {
            if (job.settled || jobState(job.id).status === 'running') {
                continue;
            }
            job.settled = true;
            if (job.failsAt === null) {
                job.effect();
            }
        }
    }

    // Everything running, in the short form the list marks its rows with.
    function running() {
        const jobs = [];
        for (const job of world.jobs.values()) {
            const state = jobState(job.id);
            if (state.status === 'running') {
                jobs.push({ id: state.id, subject: state.subject, command: state.command, step: state.step });
            }
        }

        return jobs;
    }

    function assertFree(name) {
        if (running().some((job) => job.subject === name)) {
            throw new BusyError(`Another operation on "${name}" is still running.`);
        }
    }

    /* ----------------------------------------------------------- helpers -- */

    function find(name) {
        return world.worktrees.find((entry) => entry.name === name) ?? null;
    }

    /** The refusal the container gives for a name it does not know. */
    function mustFind(name) {
        const worktree = find(name);
        if (!worktree) {
            throw new MissingError('Unknown worktree.');
        }

        return worktree;
    }

    /**
     * The checkout a name means, which the project's own is one of -- it is not
     * among the worktrees and the container answers for it all the same. Without
     * it, the commits and changes of the project would be a 404.
     */
    function mustCheckout(name) {
        return name === world.project?.name ? world.project : mustFind(name);
    }

    function replace(worktree) {
        world.worktrees = world.worktrees.map((entry) => (entry.name === worktree.name ? worktree : entry));
    }

    function optionalName(value) {
        const name = String(value ?? '').trim();
        if (name === '') {
            return null;
        }
        if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
            throw new RangeError('The worktree name may only contain lowercase letters, digits and hyphens.');
        }

        return name;
    }

    return { dispatch, world };
}

function payload(body) {
    try {
        const data = JSON.parse(body || '{}');

        return data !== null && typeof data === 'object' ? data : {};
    } catch {
        return {};
    }
}

/** The worktree is already being worked on -- the container's BusyException. */
class BusyError extends Error {}

/** What was asked about is not here -- App\Http\MissingException. */
class MissingError extends Error {}

/** Whether a version is older than another: "8.10" is newer than "8.9". */
function olderThan(version, than) {
    const left = version.split('.').map(Number);
    const right = than.split('.').map(Number);
    for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
        const diff = (left[index] ?? 0) - (right[index] ?? 0);
        if (diff !== 0) {
            return diff < 0;
        }
    }

    return false;
}

/**
 * The path a door was asked about, or null where it leads out of the checkout
 * -- the rule GitOutput::insideCheckout() holds the container to.
 */
function insideCheckout(query) {
    const path = String(query.path ?? '').trim();
    const outside =
        path === '' ||
        path.startsWith('/') ||
        path.split('/').some((segment) => segment === '' || segment === '.' || segment === '..');

    return outside ? null : path;
}

/**
 * What git would call one side of a change in an image. Invented from the path,
 * so the door that hands the image out can tell from it which side it is being
 * asked for -- a repository is what knows that, and the mock has none.
 */
function blobOf(path, side) {
    const seed = [...`${path}:${side}`].reduce((sum, letter) => (sum * 33 + letter.codePointAt(0)) % 0xfffffff, 17);

    return seed.toString(16).padStart(8, '0').repeat(5).slice(0, 40);
}

function json(data, status = 200, headers = {}) {
    return {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(data),
    };
}

function error(message, status = 400) {
    return json({ error: message }, status);
}

function accepted(job) {
    return json({ job }, 202, { Location: `/api/jobs/${job}` });
}

/**
 * The operations the world was made with, as records this can answer for. A
 * world made fresh has none, and the whole lower half of a worktree page could
 * only be seen by running something first.
 *
 * They are settled and their effects are not run: the world already stands as
 * these left it. Oldest first, the history being answered by reversing
 * insertion order.
 *
 * @param {ReturnType<typeof createWorld>} world
 */
function rememberWhatWasDone(world) {
    for (const done of world.past) {
        const startedAt = Date.now() - done.ago * 1000;
        const id = jobId(new Date(startedAt));
        world.jobs.set(id, {
            id,
            steps: done.steps,
            effect: () => {},
            // Where a real one breaks, decided as for the ones asked for in this
            // session -- see stopsAt().
            failsAt: done.failed === true ? stopsAt(done.steps) : null,
            reason: null,
            startedAt,
            settled: true,
            worktree: done.worktree,
            command: done.command,
        });
    }
}

/**
 * The step that installs dependencies where the plan has one, because that is
 * what the reason written below says went wrong. Otherwise somewhere in the
 * middle, which is where a real operation breaks.
 */
function stopsAt(steps) {
    const installing = steps.findIndex((entry) => entry.label.startsWith('Installing dependencies'));

    return installing === -1 ? Math.min(3, steps.length - 1) : installing;
}

/** What Project::assertNotItself() says about a worktree named after the project. */
function itself(name) {
    return `"${name}" is the name of the project itself, and a worktree of that name would be taken for the project checkout at every door. Pick another name (--name).`;
}

/** Same shape as JobRunner::start(): a timestamp and a little randomness. */
function jobId(now = new Date()) {
    const pad = (value) => String(value).padStart(2, '0');
    const stamp =
        `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
        `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    return `${stamp}-${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')}`;
}
