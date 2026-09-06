/**
 * What a linter can say about this interface that the compiler cannot.
 *
 * The types are checked by `tsc` and the layout is written by Prettier, so what
 * is left is the class of mistake that is well typed, correctly spelled and
 * still wrong: a promise nobody waits for, a method taken off its object, an
 * assertion that asserts nothing. Every one of those was found by hand here.
 *
 * Typed rules, and therefore the whole programme rather than one file at a
 * time: whether this is a promise cannot be answered from the text of a file.
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        // What is installed, what is built, and what the build writes.
        ignores: ['node_modules/**', 'vendor/**', 'public/**', '.dev/**', '.tests/**'],
    },
    js.configs.recommended,
    {
        // The interface: read with the whole programme in hand.
        files: ['frontend/**/*.ts'],
        extends: [...tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
        },
    },
    {
        /*
         * Two spellings of one thing, held to one. Neither is about a mistake:
         * they are the part of a house style a formatter cannot write, because
         * both spellings are already formatted correctly.
         */
        files: ['frontend/**/*.ts'],
        rules: {
            '@typescript-eslint/array-type': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
        },
    },
    {
        /*
         * A test's `describe` and `it` hand back a promise the runner itself
         * waits for, which is the one place where letting one go is correct --
         * said as the two names it is true of, rather than over a directory.
         */
        files: ['frontend/tests/**/*.ts'],
        rules: {
            '@typescript-eslint/no-floating-promises': [
                'error',
                { allowForKnownSafeCalls: [{ from: 'package', package: 'node:test', name: ['describe', 'it'] }] },
            ],
        },
    },
    {
        // The mocked API, the build scripts and what drives a browser: node,
        // and no types to read them with -- so what is checked here is what a
        // linter can see in the text of a file.
        files: ['dev/**/*.mjs', 'scripts/**/*.mjs', 'playwright.config.mjs'],
        languageOptions: {
            globals: {
                Buffer: 'readonly',
                URL: 'readonly',
                console: 'readonly',
                fetch: 'readonly',
                process: 'readonly',
                setTimeout: 'readonly',
            },
        },
    },
    {
        /*
         * The page tests are node, but what they hand to page.evaluate() is
         * not: that callback is sent to the browser and runs there. Said as the
         * few names it actually reaches for, rather than by declaring the whole
         * file a browser.
         */
        files: ['dev/**/*.spec.mjs'],
        languageOptions: {
            globals: { document: 'readonly', localStorage: 'readonly', window: 'readonly' },
        },
    },
);
