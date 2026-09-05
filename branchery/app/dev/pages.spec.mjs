/**
 * That every page of the interface draws.
 *
 * Not what it looks like -- that is looked at, in both themes, in the state the
 * change is about, and no suite replaces it. This is the floor underneath that:
 * a view that throws, a template that renders nothing, an address that leads to
 * an empty page. Each of those is invisible to the types, to the linter and to
 * the tests that check the rules without a browser, and each of them is a page
 * that does not come up.
 *
 * The addresses are the ones routes.ts knows, walked with the names the mocked
 * API answers for. What each page has to show is what it is about -- a heading
 * would say less: a view drawn for the wrong subject has one too.
 */

import { expect, test } from '@playwright/test';

/** A worktree, its branch and a commit on it, as dev/fixtures.mjs has them. */
const WORKTREE = 'feature-checkout';
const COMMIT = '5e9a71b';
/** The project's own checkout, which is reached at the same addresses. */
const PROJECT = 'branchery';

const PAGES = [
    ['the list', '#/', 'benjaminkott/ddev-branchery'],
    ['one worktree', `#/w/${WORKTREE}`, WORKTREE],
    // The same doors reach the project's own checkout, and its name is DDEV's
    // rather than a worktree name -- a project called "shop.example" once had a
    // row leading back to the list.
    ["the project's own checkout", `#/w/${PROJECT}`, PROJECT],
    ['one commit in a worktree', `#/w/${WORKTREE}/c/${COMMIT}`, COMMIT],
    ['a branch nothing is checked out of', '#/b/13.4', '13.4'],
    // The one name here that carries a slash, which is why it travels encoded.
    [
        'a branch whose name carries a slash',
        `#/b/${encodeURIComponent('feature/redirect-import')}`,
        'feature/redirect-import',
    ],
    // A worktree that is not there any more: an address outlives what it names,
    // and the page saying so is a page like any other. It carries no heading,
    // which is the sort of thing an assertion about headings would have made
    // into a rule nobody decided on.
    ['a worktree that is gone', '#/w/nothing-here', 'no worktree named "nothing-here"'],
    // Anything the router does not know is the list, and it has to be drawn as
    // one rather than left blank.
    ['an address that means nothing', '#/nonsense/at/all', 'benjaminkott/ddev-branchery'],
];

for (const [what, address, shown] of PAGES) {
    test(`${what} draws`, async ({ page }) => {
        const broken = watch(page);

        await page.goto(address);

        await expect(page.locator('#main').getByText(shown, { exact: false }).first()).toBeVisible();
        expect(broken.found(), broken.said()).toHaveLength(0);
    });
}

/**
 * The way in to making a worktree. It is a dialog over the list rather than a
 * page, and the address opens it -- so a reload lands in it, which is the part
 * that broke: the list behind it stood as loading bars for the whole flow.
 */
test('the wizard opens from the address', async ({ page }) => {
    const broken = watch(page);

    await page.goto('#new');

    await expect(page.locator('#wizard')).toBeVisible();
    // And the list behind it was drawn, not left waiting.
    await expect(page.locator('#main').getByText('benjaminkott/ddev-branchery').first()).toBeAttached();
    expect(broken.found(), broken.said()).toHaveLength(0);
});

/**
 * The reader's language is the page's, and every view is drawn again in it. A
 * word written into a control of the design system rather than through the
 * template stays in the language it was first drawn in -- which is found by
 * reading the page in the other language and by nothing else.
 */
test('the list is drawn again in the other language', async ({ page }) => {
    const broken = watch(page);

    await page.goto('#/');
    await expect(page.locator('#main').getByText('benjaminkott/ddev-branchery').first()).toBeVisible();

    await page.evaluate(() => localStorage.setItem('branchery-language', 'de'));
    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.locator('#main').getByText('benjaminkott/ddev-branchery').first()).toBeVisible();
    expect(broken.found(), broken.said()).toHaveLength(0);
});

/**
 * What the page itself reports as wrong. Only what the application said: a
 * request the browser refused is a fact about the network, and the note over
 * the page is where that belongs.
 */
function watch(page) {
    const found = [];

    page.on('pageerror', (error) => found.push(`uncaught: ${error.message}`));
    page.on('console', (message) => {
        if (message.type() === 'error') {
            found.push(`console: ${message.text()}`);
        }
    });

    return {
        found: () => found,
        said: () => (found.length === 0 ? '' : `the page reported:\n  ${found.join('\n  ')}`),
    };
}
