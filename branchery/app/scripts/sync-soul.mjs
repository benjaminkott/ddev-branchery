/**
 * Copies the prebuilt files of the Soul Design System to public/soul. That way
 * the interface needs no network and the add-on stays installable without
 * having to run npm.
 */
import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../node_modules/@typo3/soul-frontend/dist');
const target = resolve(here, '../public/soul');

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

for (const file of ['soul.css', 'soul.js', 'soul-boot.js']) {
    await cp(resolve(source, file), resolve(target, file));
}
await cp(resolve(source, 'fonts'), resolve(target, 'fonts'), { recursive: true });

// sds-icon points a <use> at ./assets/icons/sprites/<category>.svg beside
// soul.js, so the sprites have to keep that place; without them every glyph
// renders blank. Only the sprites, not the single files next to them.
await cp(resolve(source, 'assets/icons/sprites'), resolve(target, 'assets/icons/sprites'), { recursive: true });
await cp(
    resolve(source, 'assets/icons/LICENSE-TYPO3.Icons.txt'),
    resolve(target, 'assets/icons/LICENSE-TYPO3.Icons.txt'),
);

await cp(resolve(here, '../node_modules/@typo3/soul-frontend/LICENSE'), resolve(target, 'LICENSE'));

console.log(`Soul synced to ${target}`);
