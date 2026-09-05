/**
 * That the mocked API answers with the shapes api-answers.json writes down.
 *
 * The routes were only the doors. What is behind them is what the interface
 * reads by name, and it is the half that drifted in silence: a field added to
 * the container and not here reads exactly as a field added to both, and the
 * interface is then developed against a lie in the one place no browser can
 * show it.
 *
 * The container is held to the same file, in the same words -- see
 * tests/Contract/ApiAnswersTest.php. Whichever side is wrong, the file is what
 * says so.
 */

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createApi } from './api.mjs';
import { call } from './ask.mjs';
import { mismatches } from './shape.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const contract = JSON.parse(readFileSync(resolve(here, '../api-answers.json'), 'utf8'));

/**
 * One address for every answer the contract names, with the moving parts taken
 * out of what was already asked: a commit is named by a hash the log gave, and
 * a diff by a path that commit says it touched. Written any other way this
 * would be a second set of fixtures to keep in step.
 */
function addresses(api) {
    const worktree = 'feature-checkout';
    const commits = call(api, 'GET', `/api/worktrees/${worktree}/commits`).body;
    const sha = commits.commits[0].sha;
    const detail = call(api, 'GET', `/api/worktrees/${worktree}/commits/${sha}`).body;
    const touched = detail.files[0].path;
    const changed = call(api, 'GET', `/api/worktrees/${worktree}/changes`).body.changes[0].path;
    const branch = call(api, 'GET', '/api/branches').body[0].name;
    // An operation of its own, because a job is only there once one was started.
    const job = call(api, 'POST', `/api/worktrees/${worktree}/pull`).body.job;

    return {
        'GET /api/state': '/api/state',
        'GET /api/worktrees': '/api/worktrees',
        'GET /api/worktrees/preview': `/api/worktrees/preview?branch=${encodeURIComponent(branch)}`,
        'GET /api/worktrees/{name}/commits': `/api/worktrees/${worktree}/commits`,
        'GET /api/worktrees/{name}/commits/{sha}': `/api/worktrees/${worktree}/commits/${sha}`,
        'GET /api/worktrees/{name}/commits/{sha}/diff': `/api/worktrees/${worktree}/commits/${sha}/diff?path=${encodeURIComponent(touched)}`,
        'GET /api/worktrees/{name}/changes': `/api/worktrees/${worktree}/changes`,
        'GET /api/worktrees/{name}/changes/diff': `/api/worktrees/${worktree}/changes/diff?path=${encodeURIComponent(changed)}`,
        'GET /api/worktrees/{name}/usage': `/api/worktrees/${worktree}/usage`,
        'GET /api/worktrees/{name}/jobs': `/api/worktrees/${worktree}/jobs`,
        'GET /api/branches': '/api/branches',
        'GET /api/branch': `/api/branch?branch=${encodeURIComponent(branch)}`,
        'GET /api/branch/commits': `/api/branch/commits?branch=${encodeURIComponent(branch)}`,
        'GET /api/php-versions': '/api/php-versions',
        'GET /api/jobs/{id}': `/api/jobs/${job}`,
    };
}

describe('the answers the mock hands out', () => {
    const api = createApi();
    const walked = addresses(api);
    const seen = new Set();

    for (const [answer, type] of Object.entries(contract.answers)) {
        it(`${answer} is ${type}`, () => {
            const path = walked[answer];
            assert.ok(path, `${answer} is in the contract and this test walks no address for it`);

            const got = call(api, 'GET', path);
            assert.equal(got.status, 200, `${path} answered ${got.status}: ${JSON.stringify(got.body)}`);

            const wrong = mismatches(got.body, type, contract.shapes, answer, seen);
            assert.deepEqual(wrong, [], `\n  ${wrong.join('\n  ')}\n`);
        });
    }

    /**
     * A shape nothing walked is a shape nothing checks. That happens on its own:
     * a list that came back empty carries no element to look at, and the answer
     * above passes saying nothing.
     */
    it('walks every shape it writes down', () => {
        const written = Object.keys(contract.shapes);
        const missed = written.filter((shape) => !seen.has(shape));

        assert.deepEqual(missed, [], `no answer here carried one: ${missed.join(', ')}`);
    });

    /** And the other way: a shape written down that no answer names. */
    it('writes down no shape it never reaches', () => {
        const reachable = new Set();
        const reach = (type) => {
            const name = type
                .replace(/^\?/, '')
                .replace(/^\[(.*)\]$/, '$1')
                .replace(/^\?/, '');
            if (!name.startsWith('@') || reachable.has(name.slice(1))) {
                return;
            }
            reachable.add(name.slice(1));
            for (const field of Object.values(contract.shapes[name.slice(1)] ?? {})) {
                reach(field);
            }
        };
        for (const type of Object.values(contract.answers)) {
            reach(type);
        }

        assert.deepEqual(
            Object.keys(contract.shapes).filter((shape) => !reachable.has(shape)),
            [],
        );
    });
});

/**
 * The other half of the file: what a door answers when it will not answer.
 *
 * The status is what the interface reads and acts on -- a 409 puts "come back
 * in a moment" on the page, a 404 says the thing is gone, a 400 says what was
 * asked for cannot be done. Both sides decided it apart from one another, and
 * on the container's side it was decided in public/index.php, which nothing
 * could reach to check.
 */
describe('what the mock refuses, and with which answer', () => {
    const api = createApi();

    for (const refusal of contract.refusals) {
        it(`${refusal.ask} is ${refusal.status}`, () => {
            const [method, address] = refusal.ask.split(' ');
            const got = call(api, method, address, refusal.body);

            assert.equal(got.status, refusal.status, `${refusal.ask}: ${JSON.stringify(got.body)}`);
            if (refusal.says !== null) {
                assert.ok(
                    String(got.body.error ?? '').includes(refusal.says),
                    `${refusal.ask} said ${JSON.stringify(got.body.error)}, not ${JSON.stringify(refusal.says)}`,
                );
            }
        });
    }
});

/**
 * The third reader of the same file: the interface declares these shapes as
 * TypeScript, by hand, and nothing held the two together -- which is how a
 * field the container never sends came to be typed as one it always does.
 *
 * The names only. What a field is called is what the interface reads it by; the
 * types beside them are checked by tsc against the code that uses them, and
 * saying the same thing twice in two languages is what this file exists to stop.
 */
describe('the shapes the interface is written against', () => {
    /** Which shape of the contract is which interface in frontend/types.ts. */
    const DECLARED = {
        state: 'ServerState',
        worktree: 'Worktree',
        cut: 'Cut',
        tip: 'Tip',
        branch: 'Branch',
        branchDetail: 'BranchDetail',
        commits: 'Commits',
        commit: 'Commit',
        commitDetail: 'CommitDetail',
        change: 'Change',
        changes: 'Changes',
        diff: 'ChangeDiff',
        usage: 'DiskUsage',
        preview: 'Preview',
        job: 'Job',
        step: 'JobStep',
        jobSummary: 'JobSummary',
        running: 'RunningJob',
        stepDetail: 'JobStepAnswer',
        diffLine: 'DiffLine',
    };

    const types = readFileSync(resolve(here, '../frontend/types.ts'), 'utf8');

    /**
     * The fields one interface declares, and those of what it is built on. Two
     * ways of being built on are read: another interface whole, and one with
     * named fields left out -- which is how an answer says everything a shorter
     * one says except the field it does not carry.
     */
    function fieldsOf(name) {
        const declaration = new RegExp(`export interface ${name}(?: extends ([^{]+?))?\\s*\\{([\\s\\S]*?)\\n\\}`).exec(
            types,
        );
        assert.ok(declaration, `frontend/types.ts declares no ${name}`);

        // A field is what stands at one indentation with a colon after it;
        // everything else in there is a comment or the inside of an inline type.
        const own = [...declaration[2].matchAll(/^ {4}(\w+)\??:/gm)].map((hit) => hit[1]);

        return [...new Set([...inherited(declaration[1]), ...own])];
    }

    function inherited(clause) {
        if (clause === undefined) {
            return [];
        }
        const without = /^Omit<(\w+),\s*(.+)>$/.exec(clause.trim());
        if (without === null) {
            return fieldsOf(clause.trim());
        }
        const left = [...without[2].matchAll(/'(\w+)'/g)].map((hit) => hit[1]);

        return fieldsOf(without[1]).filter((field) => !left.includes(field));
    }

    for (const [shape, name] of Object.entries(DECLARED)) {
        it(`${name} is the fields of "${shape}"`, () => {
            assert.deepEqual(fieldsOf(name).sort(), Object.keys(contract.shapes[shape]).sort());
        });
    }

    it('leaves no shape of the contract undeclared', () => {
        const covered = new Set(Object.keys(DECLARED));

        assert.deepEqual(
            Object.keys(contract.shapes).filter((shape) => !covered.has(shape)),
            [],
        );
    });
});
