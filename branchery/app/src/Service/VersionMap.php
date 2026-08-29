<?php

declare(strict_types=1);

namespace App\Service;

/**
 * Which worktree runs on which version, as a file of "name=version" lines.
 * There are two -- the PHP pool and the Node -- and a file this small is not
 * worth two implementations: the second copy is the one that stops matching.
 *
 * Read once and written whole: it is asked for once per worktree while a list
 * is built, and again for every command line assembled for one.
 */
final class VersionMap
{
    /** @var ?array<string, string> */
    private ?array $map = null;

    public function __construct(
        private readonly string $file,
        private readonly ManagedFiles $files,
        private readonly Locks $locks,
    ) {
    }

    /** @return array<string, string> */
    public function all(): array
    {
        return $this->map ??= $this->read();
    }

    /**
     * The file as it stands now, whatever was remembered.
     *
     * @return array<string, string>
     */
    private function read(): array
    {
        $map = [];
        foreach (is_file($this->file) ? file($this->file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] : [] as $line) {
            if (str_contains($line, '=')) {
                [$name, $version] = explode('=', $line, 2);
                $map[trim($name)] = trim($version);
            }
        }

        return $map;
    }

    /** What is assigned to a worktree, or null where nothing is. */
    public function of(string $name): ?string
    {
        return $this->all()[$name] ?? null;
    }

    /**
     * @return bool whether the map now says something else than it did, which is
     *              what decides whether anything has to be applied to the containers
     */
    public function assign(string $name, string $version): bool
    {
        return $this->change(static function (array $map) use ($name, $version): ?array {
            if (($map[$name] ?? null) === $version) {
                return null;
            }
            $map[$name] = $version;

            return $map;
        });
    }

    /** @return bool the same: false where the name was not in it at all */
    public function forget(string $name): bool
    {
        return $this->change(static function (array $map) use ($name): ?array {
            if (!isset($map[$name])) {
                return null;
            }
            unset($map[$name]);

            return $map;
        });
    }

    /**
     * Read again under the lock and not out of what was remembered: a build on the
     * worktree beside this one may have written the file since, and written from
     * memory the second of the two dropped the first's line. The lock is counted,
     * so a caller already holding it takes nothing twice.
     *
     * @param callable(array<string, string>): ?array<string, string> $change what the map
     *                                                                        should say,
     *                                                                        or null where
     *                                                                        it says it
     *                                                                        already
     */
    private function change(callable $change): bool
    {
        $held = $this->locks->hold(Locks::VERSIONS);
        try {
            $this->map = $this->read();
            $changed = $change($this->map);
            if ($changed === null) {
                return false;
            }

            return $this->write($changed);
        } finally {
            $held->release();
        }
    }

    /** @param array<string, string> $map */
    private function write(array $map): bool
    {
        $lines = '';
        foreach ($map as $name => $version) {
            $lines .= $name . '=' . $version . "\n";
        }
        $this->files->write($this->file, $lines);
        $this->map = $map;

        return true;
    }
}
