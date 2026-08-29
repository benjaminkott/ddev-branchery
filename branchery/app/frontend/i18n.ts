/**
 * Translations live as JSON under translations/<code>.json, published beside the
 * page by the build. Which languages exist is decided solely by which files are
 * there -- another language needs no code change.
 */

export type Strings = Record<string, string>;

/** Which languages there are, written beside the files themselves at build time. */
export async function loadLanguages(): Promise<string[]> {
    const response = await fetch('/translations/index.json');
    if (!response.ok) {
        return ['en'];
    }
    return (await response.json()) as string[];
}

export async function loadStrings(language: string): Promise<Strings> {
    const response = await fetch(`/translations/${language}.json`);
    if (!response.ok) {
        throw new Error(`Missing translations for "${language}"`);
    }
    return (await response.json()) as Strings;
}

export function translate(strings: Strings, key: string, params: Record<string, string | number> = {}): string {
    let text = strings[singular(strings, key, params)] ?? strings[key] ?? key;
    for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
}

/**
 * The key for one of something, where there is one and a key for it. English and
 * German both need a whole sentence for the singular rather than a letter taken
 * off the end -- "Sie gehen mit" against "Sie geht mit" -- so it is its own
 * entry, "<key>.one", and a key without one never counts to one.
 *
 * Zero is a plural in both languages and takes the ordinary key.
 */
function singular(strings: Strings, key: string, params: Record<string, string | number>): string {
    return Number(params['count']) === 1 && strings[`${key}.one`] !== undefined ? `${key}.one` : key;
}
