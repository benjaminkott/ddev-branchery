/**
 * Dev server: the interface with a mocked API behind it.
 *
 *   make dev              (npm run dev, from branchery/app)
 *
 * What it does is what the container does -- answer /api and hand out public/,
 * with index.html for every other address -- except that the API is the one in
 * dev/api.mjs and needs neither DDEV nor git nor a database. The bundle is
 * built to .dev/ and served from there before public/, so watching does not
 * touch the versioned build.
 *
 * Options, as environment variables -- "make dev PORT=9000 LATENCY=0":
 *   PORT      where to listen; 8042, one beside the container's 8041
 *   LATENCY   milliseconds every API answer is held back; 250 by default, so
 *             the loading states are visible instead of being skipped over
 *
 * A branch or worktree name containing "fail" makes its operation fail, and one
 * containing "stale" is warned about on the summary. Opening /dev/restart takes
 * the container away for a few seconds, the way "ddev restart" does.
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import esbuild from 'esbuild';

import { createApi } from './api.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const publicDir = resolve(root, 'public');
const buildDir = resolve(root, '.dev');

// Empty counts as unset: the Makefile hands both through whether they were
// given or not.
const port = Number(process.env['PORT'] || 8042);
const latency = Number(process.env['LATENCY'] || 250);

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.png': 'image/png',
    '.map': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
};

/**
 * Soul and the translations are published into public/ by the build. Only what
 * is missing is written, so a checkout that has been built stays untouched.
 */
async function ensurePublished() {
    for (const [file, script] of [
        ['soul/soul.js', 'sync-soul.mjs'],
        ['translations/index.json', 'sync-translations.mjs'],
    ]) {
        if (await exists(join(publicDir, file))) {
            continue;
        }
        console.log(`· running scripts/${script}`);
        const result = spawnSync(process.execPath, [join(root, 'scripts', script)], { stdio: 'inherit' });
        if (result.status !== 0) {
            throw new Error(`scripts/${script} failed -- run "npm install" first.`);
        }
    }
}

/** The bundle, unminified and rebuilt on every save. */
async function watchBundle() {
    const shared = { bundle: true, sourcemap: true, logLevel: 'info', absWorkingDir: root };
    const contexts = await Promise.all([
        esbuild.context({
            ...shared,
            entryPoints: ['frontend/app.ts'],
            format: 'esm',
            target: 'es2022',
            outfile: '.dev/app.js',
        }),
        esbuild.context({ ...shared, entryPoints: ['frontend/app.css'], outfile: '.dev/app.css' }),
    ]);

    await Promise.all(contexts.map((context) => context.rebuild()));
    await Promise.all(contexts.map((context) => context.watch()));
}

const api = createApi();

/**
 * "ddev restart", as the page sees it: while the container is being restarted
 * DDEV's router answers in its place with "404 page not found" in plain text.
 * That is the state the note over the page is about, and the one that cannot be
 * produced by pressing anything.
 */
const AWAY_FOR = 20000;
let awayUntil = 0;

const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);

    // What a second "make dev" asks before it says the server is already up.
    if (path === '/dev/hello') {
        response.writeHead(200, { 'Content-Type': TYPES['.txt'] });
        response.end('branchery-dev\n');

        return;
    }

    if (path === '/dev/restart') {
        awayUntil = Date.now() + AWAY_FOR;
        console.log(`  container away for ${AWAY_FOR / 1000}s`);
        response.writeHead(200, { 'Content-Type': TYPES['.txt'] });
        response.end(`The container is away for ${AWAY_FOR / 1000} seconds.\n`);

        return;
    }

    if (path.startsWith('/api/')) {
        if (Date.now() < awayUntil) {
            answerAsRouter(response);

            return;
        }
        answerApi(request, response, path);

        return;
    }

    void serveFile(response, path);
});

function answerApi(request, response, path) {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
        const query = Object.fromEntries(new URL(request.url ?? '/', 'http://localhost').searchParams);
        const answer = api.dispatch(request.method ?? 'GET', path, Buffer.concat(chunks).toString(), query);
        const send = () => {
            console.log(`  ${request.method} ${path} → ${answer.status}`);
            response.writeHead(answer.status, answer.headers);
            response.end(answer.body);
        };
        if (latency > 0) {
            setTimeout(send, latency);
        } else {
            send();
        }
    });
}

/** What traefik says, byte for byte, for a container that is not there. */
function answerAsRouter(response) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('404 page not found\n');
}

/**
 * From the dev build first and from public/ otherwise; anything that is neither
 * is the application's own address and gets index.html.
 */
async function serveFile(response, path) {
    const safe = normalize(path).replace(/^(\.\.[/\\])+/, '');

    for (const directory of [buildDir, publicDir]) {
        const file = join(directory, safe);
        if (safe !== '/' && (await exists(file))) {
            response.writeHead(200, {
                'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
                'Cache-Control': 'no-store',
            });
            response.end(await readFile(file));

            return;
        }
    }

    response.writeHead(200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store' });
    response.end(await page());
}

/**
 * The page as it is, with a mark that says what is behind it. Nothing else is
 * rewritten -- the markup under test is the one that ships.
 */
async function page() {
    const html = await readFile(join(publicDir, 'index.html'), 'utf8');
    const badge =
        `<div style="position:fixed;inset:auto 1rem 1rem auto;z-index:9999;padding:.25rem .6rem;` +
        `border-radius:99px;background:var(--status-warn);color:var(--text-on-accent);font:600 12px/1.6 system-ui,sans-serif;` +
        `letter-spacing:.04em">MOCK API</div>`;

    return html.replace('</body>', `${badge}</body>`);
}

async function exists(file) {
    try {
        return (await stat(file)).isFile();
    } catch {
        return false;
    }
}

/**
 * The port, or an explanation. A second "make dev" beside a first is the
 * ordinary way here, and node's answer is an unhandled 'error' event under two
 * esbuild builds run for a server that never started. So the port is taken
 * before anything is built, and one that is already ours is not a failure.
 */
async function claimPort() {
    try {
        await new Promise((ok, fail) => {
            server.once('error', fail);
            server.listen(port, () => {
                server.off('error', fail);
                ok();
            });
        });
    } catch (error) {
        if (error.code !== 'EADDRINUSE') {
            throw error;
        }
        if (await isOurs()) {
            console.log(`\nThe dev server is already on http://localhost:${port} -- nothing to do.`);
            console.log('  Stop that one and start again to pick up a change to dev/,');
            console.log(`  or put a second beside it: make dev PORT=${port + 1}\n`);
            process.exit(0);
        }
        console.error(`\nPort ${port} is taken by something that is not the dev server.`);
        console.error(`  Stop it, or choose another port: make dev PORT=${port + 1}\n`);
        process.exit(1);
    }
}

/** Whether what holds the port is a dev server of this repository. */
async function isOurs() {
    try {
        const answer = await fetch(`http://localhost:${port}/dev/hello`);

        return (await answer.text()).trim() === 'branchery-dev';
    } catch {
        return false;
    }
}

await claimPort();
await ensurePublished();
await watchBundle();

console.log(`\nBranchery dev server on http://localhost:${port}`);
console.log(`  mocked API, ${latency} ms latency; in a branch name, "fail" breaks its job`);
console.log('  "warn" makes it finish past something it could not do,');
console.log('  and "stale" is warned about on the summary before the press\n');
