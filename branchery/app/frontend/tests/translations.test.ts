/**
 * That every language says the same things, and that nothing is said twice --
 * or to nobody.
 *
 * A file written from the English one and left behind as keys are added is a
 * page that falls back to its key in front of a reader: invisible in the
 * sources, and visible only in the one language nobody developing this has open.
 * The other way round is quieter and still worth keeping out.
 *
 * And the sharpest of the three, which the two above both miss: a key the
 * interface asks for that no language has. Every language then falls back to
 * the same thing, so nothing is out of step with anything.
 */

import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

/**
 * From where the test is run: the package's own directory. The bundle a test is
 * compiled into does not stand where the test was written, so its own path says
 * nothing about where the translations are.
 */
const app = process.cwd();

function strings(language: string): Record<string, string> {
    return JSON.parse(readFileSync(resolve(app, `translations/${language}.json`), 'utf8')) as Record<string, string>;
}

const languages = readdirSync(resolve(app, 'translations'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''));

/**
 * A key is asked for by its name wherever that name is written -- `t('x.y')` in
 * a view, the same string in a table of commands, `data-i18n` in the shell. So
 * the question is whether the name occurs at all, which says yes to a key only
 * mentioned in a comment, and that is the right way for this to be wrong.
 */
function sources(): string {
    const read = (dir: string): string =>
        readdirSync(resolve(app, dir), { withFileTypes: true })
            .map((entry) => {
                const path = `${dir}/${entry.name}`;
                if (entry.isDirectory()) {
                    return entry.name === 'tests' ? '' : read(path);
                }

                return entry.name.endsWith('.ts') ? readFileSync(resolve(app, path), 'utf8') : '';
            })
            .join('\n');

    return `${read('frontend')}\n${readFileSync(resolve(app, 'public/index.html'), 'utf8')}`;
}

/**
 * Told from the key it is the beginning of: "table.stale" standing inside
 * "table.staleMark" is not the first one being asked for.
 *
 * Or assembled from what it is about -- t(`change.${status}`) covers five words
 * and none of them is written anywhere. The prefix is what is looked for then,
 * so a set reached that way stands or goes together.
 */
function asked(text: string, key: string): boolean {
    // The singular of a key is reached through the key itself -- see
    // translate() -- so it is asked for wherever that one is.
    const name = key.endsWith('.one') ? key.slice(0, -'.one'.length) : key;
    if (new RegExp(`(?<![\\w.])${name.replaceAll('.', '\\.')}(?![\\w.])`).test(text)) {
        return true;
    }

    const prefix = name.slice(0, name.lastIndexOf('.') + 1);

    return prefix !== '' && text.includes(prefix + '${');
}

/**
 * Read as what a name looks like rather than as where it is written: a key can
 * stand in a table that t() is later handed a line of, which is a string
 * literal like any other and not next to a call at all.
 *
 * So what counts is the shape and the family: dotted, and beginning with a
 * namespace some line already declares. A name in a family nobody has started
 * is the one thing this cannot see.
 */
function named(text: string, declared: Record<string, string>): Set<string> {
    const families = new Set(Object.keys(declared).map((key) => key.slice(0, key.indexOf('.') + 1)));
    const found = new Set<string>();
    for (const [, name] of text.matchAll(/['"`]([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+)['"`]/g)) {
        if (name !== undefined && families.has(name.slice(0, name.indexOf('.') + 1))) {
            found.add(name);
        }
    }

    return found;
}

/**
 * Only where the name is written at the call, which is where a count is given:
 * a line handed a number through a table is handed the number somewhere else.
 */
function counted(text: string): Set<string> {
    const found = new Set<string>();
    for (const [, name, given] of text.matchAll(/\bt\(\s*['"]([\w.]+)['"]\s*,\s*\{([^}]*)\}/g)) {
        if (name !== undefined && given?.includes('count') === true) {
            found.add(name);
        }
    }

    return found;
}

/**
 * What follows the number in each is an adjective or a preposition, and English
 * and German both leave those alone: "1 unpushed", "1 hinterher".
 *
 * Every other counted line needs a singular, and this is the list that makes
 * somebody say which kind a new one is -- at the moment they write it, which is
 * the only moment it is cheap.
 */
const RIGHT_AT_ONE = new Set(['table.behind', 'table.changes', 'table.unpushed']);

describe('the translations', () => {
    it('has more than one language to compare', () => {
        assert.ok(languages.length > 1, 'only one language, so nothing is kept in step with anything');
    });

    it('says the same things in every language', () => {
        const [first = 'en', ...rest] = languages;
        const expected = Object.keys(strings(first)).sort();

        for (const language of rest) {
            assert.deepEqual(Object.keys(strings(language)).sort(), expected, `${language} against ${first}`);
        }
    });

    it('leaves nothing standing that nothing asks for', () => {
        const text = sources();
        const unused = Object.keys(strings(languages[0] ?? 'en')).filter((key) => !asked(text, key));

        assert.deepEqual(unused, []);
    });

    it('has a singular for every line said with a count', () => {
        const declared = strings(languages[0] ?? 'en');
        const missing = [...counted(sources())]
            .filter((key) => !RIGHT_AT_ONE.has(key) && declared[`${key}.one`] === undefined)
            .sort();

        assert.deepEqual(missing, []);
    });

    it('says everything the interface asks for', () => {
        const declared = strings(languages[0] ?? 'en');
        const missing = [...named(sources(), declared)].filter((key) => declared[key] === undefined).sort();

        assert.deepEqual(missing, []);
    });
});
