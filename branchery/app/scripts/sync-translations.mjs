/**
 * Publishes the translations as static files, with an index beside them.
 *
 * Which languages exist is decided solely by which files live under
 * translations/, and the index is how the browser learns that: the server
 * answers the API and nothing else, so it cannot be asked.
 */
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../translations');
const target = resolve(here, '../public/translations');

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

const files = (await readdir(source)).filter((file) => file.endsWith('.json'));
for (const file of files) {
    await cp(resolve(source, file), resolve(target, file));
}

const languages = files.map((file) => file.replace(/\.json$/, '')).sort();
await writeFile(resolve(target, 'index.json'), `${JSON.stringify(languages)}\n`);

console.log(`${languages.length} languages published`);
