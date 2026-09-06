<?php

declare(strict_types=1);

namespace App\Jobs;

use App\ManagedFiles;
use App\Project;

/**
 * What operations leave behind, and how much of it is kept.
 *
 * A history is worth having and a history nobody will read to the end is worth
 * less than the disk it grows on: a composer install writes hundreds of
 * kilobytes into its log, and until there was a number here nothing ever took
 * one away from a worktree that goes on existing.
 *
 * That number is a policy and not a mechanism, which is why it stands apart
 * from what starts an operation and watches it: nothing here knows what a
 * process is. Whether one is still going is asked of the caller, because that
 * is the one thing about a record these files do not say -- an operation that
 * died hard leaves a status reading "running" for good.
 */
final readonly class Records
{
    /** How many operations are kept a full record of, per worktree. */
    private const int KEPT = 25;

    public function __construct(
        private Project $project,
        private ManagedFiles $files,
    ) {
    }

    /**
     * Every operation on record, oldest first. The ids carry the time they were
     * started, so they sort themselves.
     *
     * @return list<string>
     */
    public function all(): array
    {
        $ids = [];
        foreach (glob($this->project->jobsDirectory() . '/*.status') ?: [] as $file) {
            $ids[] = basename($file, '.status');
        }
        sort($ids);

        return $ids;
    }

    /**
     * The ones about one worktree, oldest first. An operation about none -- a
     * fetch -- writes no subject and is reached by neither this nor anything
     * built on it.
     *
     * @return list<string>
     */
    public function about(string $subject): array
    {
        $files = glob($this->project->jobsDirectory() . '/*.subject') ?: [];
        sort($files);

        $ids = [];
        foreach ($files as $file) {
            if (trim((string) @file_get_contents($file)) === $subject) {
                $ids[] = basename($file, '.subject');
            }
        }

        return $ids;
    }

    /**
     * The oldest records past what is kept, by what they were about.
     *
     * Grouped rather than counted as one heap, so a worktree built twice a day
     * cannot push another's history out; and the operations about no worktree are
     * a group of their own, which is what they had instead of anything at all.
     *
     * Nothing running is touched, whatever its age.
     *
     * @param callable(string): bool $running whether that operation is still going
     */
    public function tidy(callable $running): void
    {
        $directory = $this->project->jobsDirectory();

        $seen = [];
        foreach (array_reverse($this->all()) as $id) {
            $subject = trim((string) @file_get_contents($directory . '/' . $id . '.subject'));
            $seen[$subject] = ($seen[$subject] ?? 0) + 1;
            if ($seen[$subject] <= self::KEPT || $running($id)) {
                continue;
            }
            $this->remove($id);
        }
    }

    /**
     * Everything written under one id, whatever it is called. A file left behind
     * here is an operation that is half gone -- read as one with no log and no time.
     */
    public function remove(string $id): void
    {
        $this->files->remove(...(glob($this->project->jobsDirectory() . '/' . $id . '.*') ?: []));
    }
}
