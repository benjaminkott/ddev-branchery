<?php

declare(strict_types=1);

namespace App\Git;

use App\Project;

/**
 * A change in an image, which a diff cannot show. git says "Binary files ...
 * differ" and stops there, which is true and of no use to whoever changed a
 * logo: what the reader wants is the two images.
 *
 * So both sides of the change are named here -- the object git holds, or the
 * file on disk where the change is not committed -- and the bytes behind each
 * of them are handed out through a door of their own, an image being a thing a
 * browser fetches rather than something an answer carries.
 */
final readonly class Images
{
    /**
     * What a browser is told the bytes are, by the name the file carries: an
     * image git holds is an object until somebody asks for it, and nothing here
     * opens one to find out. SVG is not among them -- it is text, and its diff
     * is the change.
     */
    private const array TYPES = [
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'avif' => 'image/avif',
        'bmp' => 'image/bmp',
        'ico' => 'image/vnd.microsoft.icon',
    ];

    /**
     * Read whole into an answer, so there is a size past which this refuses
     * rather than spending the container's memory on a file nobody put in a page.
     */
    public const int LIMIT = 20_000_000;

    public function __construct(
        private Runner $runner,
        private Project $project,
    ) {
    }

    /** Null for a file this shows no image of, which is what decides between the two. */
    public static function mediaType(string $path): ?string
    {
        return self::TYPES[strtolower(pathinfo($path, PATHINFO_EXTENSION))] ?? null;
    }

    /**
     * The two sides of a committed change: what its parent had there, and what
     * the commit put there. Either is missing where the commit added the file or
     * deleted it -- and so is the first one of a root commit, which has no parent.
     *
     * @return array{before: ?array{blob: ?string, bytes: int}, after: ?array{blob: ?string, bytes: int}}
     */
    public function inCommit(?string $name, string $sha, string $path): array
    {
        [$before, $after] = $this->stored($name, [$sha . '^:' . $path, $sha . ':' . $path]);

        return ['before' => $before, 'after' => $after];
    }

    /**
     * The same for a change nobody committed: what HEAD has, and the file as it
     * stands in the checkout this second.
     *
     * @return array{before: ?array{blob: ?string, bytes: int}, after: ?array{blob: ?string, bytes: int}}
     */
    public function uncommitted(?string $name, string $path): array
    {
        [$before] = $this->stored($name, ['HEAD:' . $path]);

        return ['before' => $before, 'after' => $this->onDisk($name, $path)];
    }

    /**
     * One side of it, as itself. A blob names what git holds; without one this is
     * the file in the checkout, which is the only side of an uncommitted change
     * git knows nothing about.
     */
    public function bytes(?string $name, ?string $blob, string $path): ?string
    {
        return $blob === null ? $this->fileBytes($name, $path) : $this->objectBytes($name, $blob);
    }

    /**
     * What git holds at each spec, in one process start: the object and its
     * length, or nothing where the file is not there at that point.
     *
     * @param list<string> $specs
     *
     * @return list<?array{blob: string, bytes: int}>
     */
    private function stored(?string $name, array $specs): array
    {
        $script = <<<'SH'
            directory=$1
            shift
            for spec in "$@"; do
                blob=$(git -C "$directory" rev-parse --verify --quiet "$spec") \
                    && echo "$blob $(git -C "$directory" cat-file -s "$blob")" \
                    || echo -
            done
            SH;
        // A line apiece and in order, so a spec git said nothing about keeps its
        // place: the sides are told apart by which one they are.
        $said = $this->runner->shell($script, [$this->directoryOf($name), ...$specs])->lines();

        $sides = [];
        foreach (array_keys($specs) as $index) {
            $columns = explode(' ', $said[$index] ?? '-');
            $sides[] = \count($columns) === 2 && preg_match('/^[0-9a-f]{40}$/', $columns[0]) === 1
                ? ['blob' => $columns[0], 'bytes' => (int) $columns[1]]
                : null;
        }

        return $sides;
    }

    /** @return ?array{blob: ?string, bytes: int} */
    private function onDisk(?string $name, string $path): ?array
    {
        $file = $this->fileOf($name, $path);
        if (!is_file($file)) {
            return null;
        }
        $bytes = filesize($file);

        return $bytes === false ? null : ['blob' => null, 'bytes' => $bytes];
    }

    private function fileBytes(?string $name, string $path): ?string
    {
        $file = $this->fileOf($name, $path);
        if (!is_file($file) || (filesize($file) ?: 0) > self::LIMIT) {
            return null;
        }

        return file_get_contents($file) ?: null;
    }

    private function objectBytes(?string $name, string $blob): ?string
    {
        // Through base64, because what comes back from a container has its trailing
        // whitespace trimmed off it and the last byte of a PNG is whatever it is.
        // "pipefail" is what makes an object git does not have an error rather than
        // an empty image.
        $script = <<<'SH'
            set -o pipefail
            [ "$(git -C "$1" cat-file -s "$2")" -le "$3" ] || exit 1
            git -C "$1" cat-file blob "$2" | base64
            SH;
        $result = $this->runner->shell($script, [$this->directoryOf($name), $blob, (string) self::LIMIT]);
        if (!$result->isSuccessful()) {
            return null;
        }
        $bytes = base64_decode(preg_replace('/\s+/', '', $result->output) ?? '', true);

        return $bytes === false || $bytes === '' ? null : $bytes;
    }

    /** As git is given it: absolute on the host, the way it writes its own bookkeeping. */
    private function directoryOf(?string $name): string
    {
        return $name === null ? $this->project->hostRoot() : $this->project->hostWorktreeDirectory($name);
    }

    /** And as this container sees it, which is the one place a file is read as a file. */
    private function fileOf(?string $name, string $path): string
    {
        return ($name === null ? $this->project->root() : $this->project->worktreeDirectory($name)) . '/' . $path;
    }
}
