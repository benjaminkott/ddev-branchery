<?php

declare(strict_types=1);

namespace App\Jobs;

/**
 * A lock, held for as long as this is. Released when it is let go of, and by
 * the kernel when the process holding it ends -- which is why the exclusion is
 * built on flock and not on a file somebody writes their name into.
 */
final class Lock
{
    private bool $released = false;

    /**
     * @param ?resource $handle the file the kernel holds the lock on, or null
     *                          for one this process already holds by another
     *                          handle -- letting go of that only counts down
     */
    public function __construct(
        private mixed $handle,
        private readonly ?\Closure $onRelease = null,
    ) {
    }

    public function release(): void
    {
        // Once, whichever end asks -- the release or the destructor after it.
        // The count in Locks is what tells a process whether it still holds a key.
        if ($this->released) {
            return;
        }
        $this->released = true;
        if ($this->handle !== null) {
            flock($this->handle, LOCK_UN);
            fclose($this->handle);
            $this->handle = null;
        }
        $this->onRelease?->__invoke();
    }

    public function __destruct()
    {
        $this->release();
    }
}
