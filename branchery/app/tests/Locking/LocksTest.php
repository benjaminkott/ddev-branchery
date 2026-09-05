<?php

declare(strict_types=1);

namespace App\Tests\Locking;

use App\Locking\Locks;
use App\ManagedFiles;
use App\Project;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;

/**
 * The two ways an exclusion goes wrong: it can fail to exclude, and then two
 * operations meet in one worktree; or it can wait for itself, and then the tool
 * stops with nothing to show for it. The second is checked from a second
 * process, flock being per open file.
 */
#[CoversClass(Locks::class)]
final class LocksTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-locks-' . bin2hex(random_bytes(4));
        (new Filesystem())->mkdir($this->root . '/.ddev/branchery/var');
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->root);
    }

    private function locks(): Locks
    {
        $project = new Project($this->root, '/var/www/html', 'test', '.worktrees');

        return new Locks($project, new ManagedFiles((int) getmyuid(), (int) getmygid()));
    }

    public function testNothingIsHeldToBeginWith(): void
    {
        self::assertFalse($this->locks()->heldElsewhere(Locks::forWorktree('demo')));
    }

    /** What this process holds is not "elsewhere"; it is its own work. */
    public function testItsOwnHoldIsNotSomebodyElsesRunningOperation(): void
    {
        $locks = $this->locks();
        $held = $locks->hold(Locks::forWorktree('demo'));

        self::assertFalse($locks->heldElsewhere(Locks::forWorktree('demo')));
        $held->release();
    }

    /**
     * An operation reaches the same lock more than once -- a worktree claimed for
     * the whole of it, the repository taken inside that. Waiting for itself here
     * would stop the tool with nothing on the screen to say why.
     */
    public function testTakingTheSameLockTwiceDoesNotWaitForItself(): void
    {
        $locks = $this->locks();
        $outer = $locks->hold(Locks::REPOSITORY);
        $inner = $locks->hold(Locks::REPOSITORY);

        $inner->release();
        // Still held by the outer one: letting go of the inner does not open the
        // door for anybody else.
        self::assertTrue($this->takenByAnybody(Locks::REPOSITORY));
        $outer->release();
        // And once both are let go, the door is open -- for this process, which
        // used to count the inner hold and never count it back down.
        self::assertFalse($this->takenByAnybody(Locks::REPOSITORY));
        $again = $locks->hold(Locks::REPOSITORY);
        self::assertTrue($this->takenByAnybody(Locks::REPOSITORY));
        $again->release();
    }

    /** Whether the file is locked, asked from outside the process's own count. */
    private function takenByAnybody(string $key): bool
    {
        $file = $this->root . '/.ddev/branchery/var/locks/' . $key . '.lock';
        $handle = fopen($file, 'c');
        self::assertIsResource($handle);
        $free = flock($handle, LOCK_EX | LOCK_NB);
        if ($free) {
            flock($handle, LOCK_UN);
        }
        fclose($handle);

        return !$free;
    }

    /**
     * An operation that has to wait says so once, before it starts waiting: silence
     * for the length of somebody else's build cannot be told from a hang.
     */
    public function testWaitingIsSaidOnceAndOnlyWhenItHappens(): void
    {
        $locks = $this->locks();
        $said = 0;

        $free = $locks->hold(Locks::forWorktree('demo'), static function () use (&$said): void {
            ++$said;
        });
        self::assertSame(0, $said, 'nothing to wait for');
        $free->release();

        $file = $this->root . '/.ddev/branchery/var/locks/' . Locks::forWorktree('busy') . '.lock';
        (new Filesystem())->mkdir(dirname($file));
        $script = sprintf('$f = fopen(%s, "c"); flock($f, LOCK_EX); echo "held\n"; sleep(1);', var_export($file, true));
        $process = proc_open(['php', '-r', $script], [1 => ['pipe', 'w']], $pipes);
        self::assertIsResource($process);
        self::assertSame("held\n", fgets($pipes[1]));

        try {
            $waited = $locks->hold(Locks::forWorktree('busy'), static function () use (&$said): void {
                ++$said;
            });
            self::assertSame(1, $said, 'said once, and only because it had to wait');
            $waited->release();
        } finally {
            fclose($pipes[1]);
            proc_close($process);
        }
    }

    public function testALockAnotherProcessHoldsIsSeen(): void
    {
        $file = $this->root . '/.ddev/branchery/var/locks/' . Locks::forWorktree('demo') . '.lock';
        (new Filesystem())->mkdir(dirname($file));

        $script = sprintf(
            '$f = fopen(%s, "c"); flock($f, LOCK_EX); echo "held\n"; sleep(10);',
            var_export($file, true),
        );
        $process = proc_open(['php', '-r', $script], [1 => ['pipe', 'w']], $pipes);
        self::assertIsResource($process);

        try {
            // Only once the other process says so: starting it is not holding it, and
            // a test that raced here would pass for the wrong reason.
            self::assertSame("held\n", fgets($pipes[1]));
            self::assertTrue($this->locks()->heldElsewhere(Locks::forWorktree('demo')));
        } finally {
            proc_terminate($process, 9);
            fclose($pipes[1]);
            proc_close($process);
        }
    }

    /** A process that dies takes its locks with it; nothing has to clear up. */
    public function testALockDiesWithTheProcessThatHeldIt(): void
    {
        $file = $this->root . '/.ddev/branchery/var/locks/' . Locks::forWorktree('gone') . '.lock';
        (new Filesystem())->mkdir(dirname($file));

        $script = sprintf('$f = fopen(%s, "c"); flock($f, LOCK_EX); echo "held\n"; sleep(30);', var_export($file, true));
        $process = proc_open(['php', '-r', $script], [1 => ['pipe', 'w']], $pipes);
        self::assertIsResource($process);
        self::assertSame("held\n", fgets($pipes[1]));

        proc_terminate($process, 9);
        fclose($pipes[1]);
        proc_close($process);

        // The kernel has let go of it, so the worktree can be worked on again
        // without anybody removing a file.
        self::assertFalse($this->locks()->heldElsewhere(Locks::forWorktree('gone')));
    }
}
