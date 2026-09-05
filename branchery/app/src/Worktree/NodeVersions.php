<?php

declare(strict_types=1);

namespace App\Worktree;

use App\Web\Runtimes;
use App\Web\WebContainer;

/**
 * Node versions of the worktrees. Far less than PhpVersions is, because nothing
 * is served with Node: it builds a worktree's assets and is gone, so there is
 * no pool and nothing to reload.
 *
 * The versions come from `n`, which DDEV points at a cache on a volume of its
 * own -- so a version fetched for one worktree is there for the next, and still
 * there after a restart.
 */
final class NodeVersions
{
    /** What `n` answers with: the binary of one downloaded version. */
    private const BINARY = '#/versions/node/([^/]+)/bin/node$#';

    /** Where a checkout says which version it wants, in n's own order. */
    private const WRITTEN = ['.nvmrc', '.node-version'];

    /**
     * What `n` answered about a version, for as long as this process runs: every
     * answer is a container call and a possible download, and the same question is
     * asked for the environment of every command an operation runs.
     *
     * @var array<string, ?array{version: string, directory: string}>
     */
    private array $looked = [];

    public function __construct(
        private readonly WebContainer $web,
        /** Which worktree builds with which version -- see VersionMap. */
        private readonly VersionMap $assignments,
        /** What the container itself runs on, asked once -- see Runtimes. */
        private readonly Runtimes $runtimes,
    ) {
    }

    /**
     * Null where it has no Node at all, which is a container this add-on can still
     * work in: every worktree is then built by whatever its recipe brings.
     */
    public function projectVersion(): ?string
    {
        return $this->runtimes->node();
    }

    /** The version a worktree was built with, where one was fetched for it. */
    public function assignedTo(string $name): ?string
    {
        return $this->assignments->of($name);
    }

    public function forWorktree(string $name): ?string
    {
        return $this->assignedTo($name) ?? $this->projectVersion();
    }

    /**
     * Null where it asks for none: the container's own Node applies, it is on the
     * path already, and putting it there again would be a container call for nothing.
     */
    public function directoryFor(string $name): ?string
    {
        $version = $this->assignedTo($name);

        return $version === null ? null : ($this->lookUp($version)['directory'] ?? null);
    }

    /**
     * The exact version and where its binaries are, fetching it where the cache has
     * not got it. "auto" is n's own word for reading the version out of the
     * checkout, and is only ever asked with a directory that says something -- see
     * writtenIn() -- because n searches upwards.
     *
     * @return ?array{version: string, directory: string}
     */
    public function lookUp(string $specification, ?string $directory = null): ?array
    {
        $key = $specification . "\0" . ($directory ?? '');
        if (array_key_exists($key, $this->looked)) {
            return $this->looked[$key];
        }

        $result = $this->web->run(['n', '--download', 'which', $specification], $directory);
        // From the back: what n says while it fetches a version stands above the
        // answer, and the answer is the last line.
        foreach (array_reverse($result->lines()) as $line) {
            if (preg_match(self::BINARY, $line, $hit) === 1) {
                return $this->looked[$key] = ['version' => $hit[1], 'directory' => \dirname($line)];
            }
        }

        return $this->looked[$key] = null;
    }

    /**
     * Asked off the disk rather than left to n: it is what decides whether n is
     * asked at all, and a project that has nothing to do with Node should not pay a
     * container call per operation to be told so.
     */
    public function writtenIn(string $directory): bool
    {
        foreach (self::WRITTEN as $file) {
            if (is_file($directory . '/' . $file)) {
                return true;
            }
        }

        $package = $directory . '/package.json';
        if (!is_file($package)) {
            return false;
        }
        $said = json_decode((string) file_get_contents($package), true);

        return is_array($said)
            && is_array($said['engines'] ?? null)
            && ($said['engines']['node'] ?? null) !== null;
    }

    public function assign(string $name, string $version): void
    {
        $this->assignments->assign($name, $version);
    }

    public function forget(string $name): void
    {
        $this->assignments->forget($name);
    }
}
