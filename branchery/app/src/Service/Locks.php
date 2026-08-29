<?php

declare(strict_types=1);

namespace App\Service;

/**
 * What may happen at the same time, and what may not. Parallel work on one
 * repository is how a half-finished checkout meets a half-copied database --
 * but that is true of the repository and only of it, so the exclusion is cut
 * where the sharing actually is:
 *
 * - one operation per worktree, held for the whole of it;
 * - the repository itself, held only around the moments that write its
 *   bookkeeping, each of which takes a moment.
 *
 * Built on flock, so a process that dies takes its locks with it: a lock file
 * outliving its holder is worse than no lock, because nothing clears it.
 */
final class Locks
{
    /** The repository's own bookkeeping, which every worktree shares. */
    public const REPOSITORY = 'repository';

    /**
     * One file per tool says which worktree runs on which version, and the script
     * that puts the PHP pools up reads it back. Every operation that decides a
     * version writes the whole file, so two choosing at once read the same file and
     * the second wrote it without the first's line -- that worktree was then served
     * by the project's PHP with nothing saying so.
     *
     * Held around the write and the applying together, because the script writes
     * its server blocks from the map as it finds it.
     */
    public const VERSIONS = 'versions';

    /**
     * Keys this process is already holding. flock is per open file, so a second
     * fopen of the same file blocks against the first -- from inside the very
     * process that holds it -- and holding is counted rather than repeated.
     *
     * @var array<string, int>
     */
    private array $held = [];

    public function __construct(
        private readonly Project $project,
        private readonly ManagedFiles $files,
    ) {
    }

    public static function forWorktree(string $name): string
    {
        return 'worktree-' . $name;
    }

    /**
     * Waiting rather than refusing: the repository is taken for a moment at a time,
     * and giving up because another operation was adding a worktree would be a
     * failure in front of a developer for no reason.
     */
    public function hold(string $key, ?callable $whenWaiting = null): Lock
    {
        if (($this->held[$key] ?? 0) > 0) {
            ++$this->held[$key];

            // Counted down like the outer hold, or the key would stay "held" by this
            // process after every lock on it was let go.
            return new Lock(null, $this->letGo($key));
        }

        $handle = fopen($this->fileFor($key), 'c');
        if ($handle === false) {
            throw new \RuntimeException(sprintf('The lock %s cannot be opened.', $key));
        }
        // Tried without waiting first, so the one case worth saying something
        // about can be told from the ordinary one: a worktree being built by
        // somebody else holds this for minutes, and an operation that sits silent
        // for minutes cannot be told from one that has hung.
        if (!flock($handle, LOCK_EX | LOCK_NB)) {
            if ($whenWaiting !== null) {
                $whenWaiting();
            }
            if (!flock($handle, LOCK_EX)) {
                fclose($handle);

                throw new \RuntimeException(sprintf('The lock %s cannot be taken.', $key));
            }
        }

        $this->held[$key] = 1;

        return new Lock($handle, $this->letGo($key));
    }

    private function letGo(string $key): \Closure
    {
        return function () use ($key): void {
            $this->held[$key] = max(0, ($this->held[$key] ?? 1) - 1);
        };
    }

    /**
     * What the interface refuses on, and the truth rather than a status file's
     * memory of it: a lock nobody holds any more is free, even where the operation
     * that held it never got to say it had finished.
     */
    public function heldElsewhere(string $key): bool
    {
        if (($this->held[$key] ?? 0) > 0) {
            return false;
        }

        $handle = @fopen($this->fileFor($key), 'c');
        if ($handle === false) {
            return false;
        }
        $free = flock($handle, LOCK_EX | LOCK_NB);
        if ($free) {
            flock($handle, LOCK_UN);
        }
        fclose($handle);

        return !$free;
    }

    private function fileFor(string $key): string
    {
        $directory = $this->project->locksDirectory();
        $this->files->ensureIgnoredDirectory($this->project->stateDirectory());
        $this->files->ensureDirectory($directory);

        return $directory . '/' . preg_replace('/[^A-Za-z0-9._-]/', '_', $key) . '.lock';
    }
}
