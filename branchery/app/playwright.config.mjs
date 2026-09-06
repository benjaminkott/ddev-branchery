/**
 * Where the smoke tests of the interface run: a real browser, against the dev
 * server and its mocked API.
 *
 * Separate from "npm run check" on purpose. What is checked there needs nothing
 * but node, and this needs a browser engine that is downloaded once and is
 * larger than everything else in this repository put together -- so it is asked
 * for by name, here and in the workflow, and the everyday loop stays what it was.
 */

import { defineConfig, devices } from '@playwright/test';

// The dev server's own port. A server already answering here is used as it
// stands -- it belongs to a terminal held open beside this one, and the rule
// that a running server is left running holds for a test run as much as for
// anything else.
const PORT = Number(process.env['PORT'] || 8042);

export default defineConfig({
    testDir: 'dev',
    testMatch: '*.spec.mjs',
    // Nothing here is allowed to be flaky: every one of these asks whether a
    // page draws at all, and a page either draws or it does not.
    retries: 0,
    fullyParallel: true,
    reporter: process.env['CI'] ? 'github' : 'list',
    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'npm run dev',
        url: `http://127.0.0.1:${PORT}/dev/hello`,
        reuseExistingServer: true,
        // No latency: it is there so a developer can see the loading states,
        // and here it would only be waiting.
        env: { PORT: String(PORT), LATENCY: '0' },
        stdout: 'ignore',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
