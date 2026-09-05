<?php

declare(strict_types=1);

namespace App;

/**
 * What is written about this add-on, as a shell can read it. The documentation
 * is reStructuredText in the repository, carried into the image beside the
 * application; this reads the same files rather than a second copy.
 *
 * Nothing here renders anything -- the interface no longer draws these pages,
 * a manual only readable by somebody who installed the add-on being one nobody
 * can be sent to. What is left is which pages there are, and one as it was
 * written; reStructuredText reads as text, which is why that is enough.
 */
final class Docs
{
    /** @param string $directory where the pages are, which is inside the image */
    public function __construct(private readonly string $directory)
    {
    }

    /**
     * In the order they should be read, which is the manual's own tree of contents:
     * a page joins the reading path through its parent's toctree, and a second list
     * beside it is a second place to keep in step. A page the tree does not name
     * still follows, by name, so it stays reachable.
     *
     * @return list<array{slug: string, title: string}>
     */
    public function pages(): array
    {
        $order = $this->contents('index');
        // The landing page is the site's, not the manual's: a product page that
        // says nothing a reader here came for.
        $slugs = array_values(array_filter($this->slugs(), static fn (string $slug): bool => $slug !== 'index'));

        usort($slugs, static function (string $a, string $b) use ($order): int {
            $left = array_search($a, $order, true);
            $right = array_search($b, $order, true);

            return [$left === false ? PHP_INT_MAX : $left, $a] <=> [$right === false ? PHP_INT_MAX : $right, $b];
        });

        return array_map(fn (string $slug): array => [
            'slug' => $slug,
            'title' => $this->title((string) file_get_contents($this->directory . '/' . $slug . '.rst'), $slug),
        ], $slugs);
    }

    /**
     * Every page there is, as the slug it is reached by: the path under the
     * manual's own directory, without the extension. A page stands in the section
     * it belongs to, so a slug carries one -- "reference/configuration".
     *
     * @return list<string>
     */
    private function slugs(): array
    {
        if (!is_dir($this->directory)) {
            return [];
        }

        $slugs = [];
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->directory, \FilesystemIterator::SKIP_DOTS),
        );
        foreach ($files as $file) {
            if ($file instanceof \SplFileInfo && $file->getExtension() === 'rst') {
                $slugs[] = substr($file->getPathname(), \strlen($this->directory) + 1, -\strlen('.rst'));
            }
        }
        sort($slugs);

        return $slugs;
    }

    /** One page as it was written, for a terminal. */
    public function source(string $slug): ?string
    {
        $file = $this->fileFor($slug);

        return $file === null ? null : (string) file_get_contents($file);
    }

    /**
     * The file a name points at.
     *
     * Two names reach a page: the slug the list prints, and the last part of it
     * on its own. The second is what somebody types -- a page has a name of its
     * own, and "reference/configuration" is a thing to copy rather than to
     * remember -- so it is answered wherever it can only mean one page.
     */
    private function fileFor(string $name): ?string
    {
        // Segment by segment through the rule a page name has always been held to.
        // A dot does not survive it, so ".." cannot be spelled: what may be built
        // into a path here is what the manual's own names are made of.
        $parts = array_filter(
            array_map(
                static fn (string $part): string => (string) preg_replace('/[^a-z0-9-]/', '', $part),
                explode('/', $name),
            ),
            static fn (string $part): bool => $part !== '',
        );
        if ($parts === []) {
            return null;
        }

        $slugs = $this->slugs();
        $slug = implode('/', $parts);
        if (in_array($slug, $slugs, true)) {
            return $this->directory . '/' . $slug . '.rst';
        }

        $named = array_values(array_filter($slugs, static fn (string $known): bool => basename($known) === $slug));

        // Only where it can mean one page. Two of the same name is a manual to put
        // right, not a page to guess at.
        return \count($named) === 1 ? $this->directory . '/' . $named[0] . '.rst' : null;
    }

    /**
     * Only the entries: the directive's own options are indented the same way and
     * are told apart by the colon they start with. A tree may name a page that has
     * a tree of its own, so this follows them down; `$seen` stops a pair of pages
     * that name each other from reading forever.
     *
     * An entry is read where the renderer reads it, which is from the directory of
     * the page that names it: a section's own pages stand beside it and are named
     * by the word they are called, not by the path from the manual's root.
     *
     * @param list<string> $seen
     *
     * @return list<string>
     */
    private function contents(string $slug, array &$seen = []): array
    {
        if (in_array($slug, $seen, true)) {
            return [];
        }
        $seen[] = $slug;

        $page = $this->directory . '/' . $slug . '.rst';
        if (!is_file($page)) {
            return [];
        }

        $entries = [];
        $inside = false;
        foreach (explode("\n", (string) file_get_contents($page)) as $line) {
            if (preg_match('/^\.\.\s+toctree::/', $line) === 1) {
                $inside = true;
                continue;
            }
            if (!$inside) {
                continue;
            }
            if (trim($line) === '') {
                continue;
            }
            // The block ends where the indentation does.
            if (preg_match('/^\s/', $line) !== 1) {
                break;
            }
            $entry = trim($line);
            if (!str_starts_with($entry, ':')) {
                $named = self::under(\dirname($slug), $entry);
                $entries[] = $named;
                $entries = [...$entries, ...$this->contents($named, $seen)];
            }
        }

        return $entries;
    }

    /**
     * A toctree entry as a slug: from the directory of the page that named it, or
     * from the manual's root where it was written with a leading slash.
     */
    private static function under(string $directory, string $entry): string
    {
        if (str_starts_with($entry, '/')) {
            return ltrim($entry, '/');
        }

        return $directory === '.' || $directory === '' ? $entry : $directory . '/' . $entry;
    }

    /** Its title, which reStructuredText writes between two rules of the same character. */
    private function title(string $rst, string $fallback): string
    {
        return preg_match('/^([=\-~^"\'`#*+]{3,})\n(.+)\n\1$/m', $rst, $hit) === 1 ? trim($hit[2]) : $fallback;
    }
}
