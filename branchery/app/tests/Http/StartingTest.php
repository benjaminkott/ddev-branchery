<?php

declare(strict_types=1);

namespace App\Tests\Http;

use App\Http\BusyException;
use App\Http\Starting;
use App\Locking\Locks;
use App\Tests\Fake\Wiring;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * That a second operation on one worktree is refused, which is the whole of
 * what the locking is for.
 *
 * It is asked in two ways, because an operation is not claimed the moment it is
 * started: the process has to boot before it takes the lock, and inside that
 * moment the lock says free while an operation is plainly on its way. Both
 * halves have to refuse or the pair of them refuses nothing -- and neither half
 * had ever been walked by a test, the doors being the only thing that asks.
 */
#[CoversClass(Starting::class)]
final class StartingTest extends TestCase
{
    private Wiring $wiring;

    protected function setUp(): void
    {
        $this->wiring = new Wiring(sys_get_temp_dir() . '/branchery-starting-' . bin2hex(random_bytes(4)));
    }

    protected function tearDown(): void
    {
        $this->wiring->remove();
    }

    private function locks(): Locks
    {
        return new Locks($this->wiring->project, $this->wiring->files);
    }

    private function starting(Locks $locks): Starting
    {
        return new Starting($locks, $this->wiring->jobs);
    }

    public function testAWorktreeNobodyIsWorkingOnIsFree(): void
    {
        $this->starting($this->locks())->assertFree('demo');

        // Reached, which is the assertion: the method above answers by not
        // throwing, and a test that only calls it asserts nothing.
        $this->expectNotToPerformAssertions();
    }

    /**
     * The claim an operation holds for the whole of its run. Taken through a
     * Locks of its own, which is what another process is: flock is per open
     * file, so this one blocks against the operation's.
     */
    public function testOneThatIsClaimedIsRefused(): void
    {
        $held = $this->locks()->hold(Locks::forWorktree('demo'));

        $this->expectException(BusyException::class);
        $this->expectExceptionMessage('Another operation on "demo" is still running.');

        try {
            $this->starting($this->locks())->assertFree('demo');
        } finally {
            $held->release();
        }
    }

    /**
     * And the moment before the lock: an operation just started is a process
     * still booting and has taken nothing yet. Without this, two presses inside
     * that moment were both accepted -- and the second then waited behind the
     * first for the length of a build instead of being told to come back.
     */
    public function testOneThatHasBeenStartedAndHasNotClaimedYetIsRefused(): void
    {
        $this->wiring->jobs->adopt(['worktree:provision'], 'demo');
        self::assertFalse(
            $this->locks()->heldElsewhere(Locks::forWorktree('demo')),
            'the lock is what this case is about: it has to be free, or the other half is what refuses',
        );

        $this->expectException(BusyException::class);
        $this->expectExceptionMessage('Another operation on "demo" is still running.');

        $this->starting($this->locks())->assertFree('demo');
    }

    /** Neither half is about the worktree beside it. */
    public function testAnotherWorktreeIsNotRefusedForIt(): void
    {
        $held = $this->locks()->hold(Locks::forWorktree('demo'));
        $this->wiring->jobs->adopt(['worktree:provision'], 'demo');

        try {
            $this->starting($this->locks())->assertFree('other');
        } finally {
            $held->release();
        }

        $this->expectNotToPerformAssertions();
    }
}
