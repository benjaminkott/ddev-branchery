<?php

declare(strict_types=1);

namespace App\Http;

use App\Jobs\JobRunner;
use App\Jobs\Locks;

/**
 * Beginning an operation, as an answer to a request.
 *
 * Every door that starts one answers the same way -- 202 and where to watch it
 * -- and every door that starts one on a worktree first has to refuse a second.
 * Both of those were written out at each door, which is where the moment
 * between the refusal and the start went missing.
 */
final readonly class Operations
{
    public function __construct(
        private Locks $locks,
        private JobRunner $jobs,
    ) {
    }

    /**
     * The refusal and the start under one lock: between the two the worktree is
     * free and nothing yet says an operation is coming, so two presses inside the
     * same moment both got past -- see Locks::STARTING. Held only for the writes
     * that make the job findable, which is what the next question reads.
     *
     * Let go of by name rather than by the variable's life, although the
     * destructor would do it: what the exclusion rests on is then a line somebody
     * would have to decide to delete, and not an assignment nothing reads. Two
     * requests inside one moment is the only thing this guards against, and there
     * is no test that can stand between them.
     *
     * @param list<string> $arguments
     */
    public function on(string $name, array $arguments): Response
    {
        $starting = $this->locks->hold(Locks::STARTING);
        $this->assertFree($name);
        $job = $this->jobs->start($arguments, $name);
        $starting->release();

        return self::accepted($job);
    }

    /**
     * One about no worktree in particular -- a fetch. Nothing to refuse it
     * against: what it touches is the repository, which is held for the moments
     * that write it, deeper down.
     *
     * @param list<string> $arguments
     */
    public function alone(array $arguments): Response
    {
        return self::accepted($this->jobs->start($arguments));
    }

    /**
     * Refused before the request that would wait for one: setting a version
     * claims the worktree, and claiming waits, so a door that did not ask would
     * hang for the length of a build instead of saying to come back.
     *
     * Refuse a second operation on the same worktree, and only that: two worktrees
     * share nothing but the repository's own bookkeeping, which is held for the
     * moments that write it, deeper down.
     *
     * Asked of the lock rather than of a status file: an operation that died hard
     * leaves a status saying "running" that nothing clears, while a lock is let go
     * of by the kernel when its process ends.
     */
    public function assertFree(string $name): void
    {
        if ($this->locks->heldElsewhere(Locks::forWorktree($name))) {
            throw new BusyException(sprintf('Another operation on "%s" is still running.', $name));
        }
        // And the moment before the lock: an operation just started is a process
        // still booting, and takes the lock only once it has. Two presses inside
        // that moment would both be accepted.
        foreach ($this->jobs->running() as $job) {
            if ($job['subject'] === $name) {
                throw new BusyException(sprintf('Another operation on "%s" is still running.', $name));
            }
        }
    }

    private static function accepted(string $job): Response
    {
        return Response::json(['job' => $job], 202, ['Location' => '/api/jobs/' . $job]);
    }
}
