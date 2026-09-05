<?php

declare(strict_types=1);

namespace App\Addon;

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
        $slugs = [];
        foreach (glob($this->directory . '/*.rst') ?: [] as $file) {
            $slug = basename($file, '.rst');
            // The landing page is the site's, not the manual's: a product page that
            // says nothing a reader here came for.
            if ($slug !== 'index') {
                $slugs[] = $slug;
            }
        }

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

    /** One page as it was written, for a terminal. */
    public function source(string $slug): ?string
    {
        $slug = (string) preg_replace('/[^a-z0-9-]/', '', $slug);
        $file = $this->directory . '/' . $slug . '.rst';

        return is_file($file) ? (string) file_get_contents($file) : null;
    }

    /**
     * Only the entries: the directive's own options are indented the same way and
     * are told apart by the colon they start with. A tree may name a page that has
     * a tree of its own, so this follows them down; `$seen` stops a pair of pages
     * that name each other from reading forever.
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
                $entries[] = $entry;
                $entries = [...$entries, ...$this->contents($entry, $seen)];
            }
        }

        return $entries;
    }

    /** Its title, which reStructuredText writes between two rules of the same character. */
    private function title(string $rst, string $fallback): string
    {
        return preg_match('/^([=\-~^"\'`#*+]{3,})\n(.+)\n\1$/m', $rst, $hit) === 1 ? trim($hit[2]) : $fallback;
    }
}
