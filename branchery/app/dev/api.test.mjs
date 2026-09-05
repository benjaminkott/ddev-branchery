/**
 * That the mocked API answers the same doors as the container. The house rule
 * is that dev/api.mjs mirrors src/Controller/ApiController.php; this is the
 * part of it a machine can keep -- both sides declare their routes as a list,
 * so a route added to one and not the other is a difference two regular
 * expressions can find.
 *
 * What the doors answer with is written down in api-answers.json and checked
 * against both sides -- see dev/answers.test.mjs. What is left here is the way
 * the mock behaves: what it refuses, what it accepts and lets the job refuse,
 * and the handful of decisions the container makes that the interface has to
 * make the same way. Those go wrong by one side being changed while the other
 * reads exactly as it did.
 */

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createApi } from './api.mjs';
import { call } from './ask.mjs';
import { createWorld, slug } from './fixtures.mjs';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * A route as both sides mean it: the verb and the path, with the holes named.
 * Read out of the sources and not out of a running router, which is why the
 * space after the bracket is any space at all -- an entry too long for one line
 * is broken after it.
 */
function named(pattern) {
    return pattern
        .replace(/\(\?<(\w+)>[^)]*\)/g, '{$1}')
        .replace(/\{\$(\w+)\}/g, '{$1}')
        .replace(/\\\//g, '/');
}

function containerRoutes() {
    const php = readFileSync(resolve(here, '../src/Http/Router.php'), 'utf8');

    return [...php.matchAll(/\[\s*'([A-Z]+)',\s*["']#\^(.+?)\$#["']/g)].map((hit) => `${hit[1]} ${named(hit[2])}`);
}

function mockRoutes() {
    const js = readFileSync(resolve(here, 'api.mjs'), 'utf8');

    return [...js.matchAll(/\[\s*'([A-Z]+)',\s*\/\^(.+?)\$\//g)].map((hit) => `${hit[1]} ${named(hit[2])}`);
}

describe('the mocked API', () => {
    it('answers the doors the container answers, and no others', () => {
        const container = containerRoutes();
        const mock = mockRoutes();

        assert.ok(container.length > 0, 'no routes were read out of the container');
        assert.deepEqual([...mock].sort(), [...container].sort());
    });
});

describe('how an operation reports itself', () => {
    /**
     * The page asks once a second and glues the answers together, so a mock that
     * sends the whole log every time would hide the one thing that can go wrong
     * with that -- see journal.ts and JobLogTailTest.
     */
    it('sends only what was written since, and the halves are the whole', () => {
        const api = createApi();
        const started = call(api, 'POST', '/api/worktrees/feature-checkout/pull');
        const whole = call(api, 'GET', `/api/jobs/${started.body.job}`).body;
        assert.equal(whole.partial, false);
        assert.ok(whole.size > 0);

        const rest = call(api, 'GET', `/api/jobs/${started.body.job}`, undefined, {
            since: String(whole.size),
        }).body;

        assert.equal(rest.partial, true);
        assert.equal(whole.log + rest.log, whole.log);
        // Every step was over before that look, so none of them says anything again.
        assert.deepEqual(
            rest.steps.map((step) => step.output),
            rest.steps.map(() => null),
        );
    });
});

describe('what the mock refuses the way the container does', () => {
    /**
     * The container accepts a pull, a restore and a discard with 202 and lets the
     * job refuse: the interface never sees a 400 for these.
     */
    for (const [route, name, reason] of [
        ['pull', 'task-old-endpoint', 'follows no remote branch'],
        ['restore', 'feature-checkout', 'is on feature/checkout already'],
        ['discard', 'feature-checkout', 'were never committed'],
    ]) {
        it(`accepts a ${route} it cannot do and lets the job say why`, () => {
            const api = createApi();
            const started = call(api, 'POST', `/api/worktrees/${name}/${route}`);
            assert.equal(started.status, 202);

            const job = call(api, 'GET', `/api/jobs/${started.body.job}`).body;
            assert.equal(job.status, 'failed');
            assert.equal(job.steps.length, 1);
            assert.equal(job.steps[0].state, 'failed');
            assert.match(job.log, new RegExp(`✗ .*${reason}`));
        });
    }

    it('answers 404 for a fork off a worktree it does not know', () => {
        const api = createApi();
        const answer = call(api, 'POST', '/api/worktrees', { mode: 'fork', branch: 'feature/x', from: 'nowhere' });
        assert.equal(answer.status, 404);
        assert.equal(answer.body.error, 'Unknown worktree.');
    });

    /** The container names the project's own checkout after the DDEV project. */
    it('names the project entry as DDEV names the project', () => {
        const world = createWorld();
        assert.equal(world.project.name, world.projectName);
    });

    it('measures only a worktree it knows', () => {
        const api = createApi();
        const measured = call(api, 'GET', '/api/worktrees/feature-checkout/usage');
        assert.equal(measured.status, 200);
        assert.equal(measured.body.total, measured.body.files + measured.body.database);
        assert.ok(measured.body.files > 0);
        assert.ok(measured.body.database > 0);

        assert.equal(call(api, 'GET', '/api/worktrees/nowhere/usage').status, 404);
    });
});

/** What a source says a constant is, read out of the source rather than run. */
function declared(file, pattern) {
    const hit = pattern.exec(readFileSync(resolve(here, file), 'utf8'));
    assert.ok(hit, `nothing matched ${String(pattern)} in ${file}`);

    return hit[1];
}

describe('what both sides have to say the same way', () => {
    /**
     * The table stands at the height of a page while it is being read, so a
     * container that sends another number is a list that waits at one height and
     * arrives at another.
     */
    it('reads a page of commits as long as the container sends', () => {
        assert.equal(
            declared('../frontend/views/commits.ts', /^const PAGE = (\d+);$/m),
            declared('../src/Controller/ApiController.php', /COMMIT_PAGE = (\d+);/),
        );
    });

    /**
     * The field a name is typed into and the address a branch is read at both hold
     * it to this: a stricter interface refuses what would have worked, a looser one
     * offers what the container will not take.
     */
    it('holds a branch name to what the container holds it to', () => {
        assert.equal(
            declared('../frontend/dom.ts', /^const BRANCH_PATTERN = \/(.+)\/;$/m),
            declared('../src/Controller/ApiController.php', /BRANCH_PATTERN = '#(.+)#';/),
        );
    });

    /**
     * The addresses of a checkout are read in three places -- the container's
     * router, the interface's own, and the mock -- and the project's own checkout
     * is opened at them under a name DDEV chose. Held apart from a worktree name,
     * which is narrower: a router that took only those left the project's row
     * leading back to the list.
     */
    it('names a checkout in an address the same way on both sides', () => {
        assert.equal(
            declared('../frontend/routes.ts', /^const CHECKOUT = '(.+)';$/m),
            declared('../src/Http/Router.php', /\$name = '\(\?<name>(.+)\)';/),
        );
    });

    /**
     * The interface writes it out before the worktree exists, so what it makes has
     * to be a name the container would take. Made the same way in three languages,
     * and the two written in this one are held to being the same text.
     */
    it('makes of a branch a name the container would accept', () => {
        const pattern = new RegExp(declared('../src/Service/Project.php', /NAME_PATTERN = '\/(.+)\/';/));
        for (const branch of ['feature/checkout', 'release/13.4', 'RENOVATE/Symfony_7', '13.4', 'a...b']) {
            assert.match(slug(branch), pattern, branch);
        }
    });

    it('makes it the same way in the mock as in the interface', () => {
        const body = /export function slug\(value\)? \{([\s\S]+?)\n\}/;
        assert.equal(
            declared('../dev/fixtures.mjs', body).replace(/\s+/g, ' '),
            declared('../frontend/dom.ts', /export function slug\(value: string\): string \{([\s\S]+?)\n\}/).replace(
                /\s+/g,
                ' ',
            ),
        );
    });
});

/**
 * A worktree named after the project itself is refused, as the container
 * refuses it: the project checkout is found first at every door that takes a
 * name, so such a worktree would never be reached.
 */
describe('a worktree named after the project', () => {
    it('is refused at the door, in the sentence the container uses', () => {
        const api = createApi();
        const { name } = call(api, 'GET', '/api/state').body.project;
        const answer = call(api, 'POST', '/api/worktrees', { mode: 'fork', branch: 'anything', name });

        assert.equal(answer.status, 400);
        assert.match(answer.body.error, /is the name of the project itself/);
    });

    it('is said in the summary before anything is pressed', () => {
        const api = createApi();
        const state = call(api, 'GET', '/api/state').body;
        const answer = api.dispatch('GET', '/api/worktrees/preview', '', {
            branch: state.branches[0].name,
            name: state.project.name,
        });
        const preview = JSON.parse(answer.body);

        assert.equal(answer.status, 200);
        assert.ok(preview.warnings.some((line) => line.includes('is the name of the project itself')));
    });
});
