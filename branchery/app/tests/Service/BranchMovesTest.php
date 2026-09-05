<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Operation\BranchMoves;
use App\Service\StepReporter;
use App\Tests\Fake\Wiring;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * The three operations that move a checkout rather than build one.
 *
 * They are the ones with the least to build and the most to lose: "discard"
 * resets a branch onto its remote and the commits above it are then in no
 * branch, findable through the reflog and only for a while. What keeps that
 * safe is not any single call but the order they come in -- fetch before the
 * reset, so the remote is not a stale one; the uncommitted work refused before
 * anything is touched, because that has no reflog; what is dropped read out
 * while it is still there to read.
 *
 * None of it is visible in a type, and the suite that walked the order of an
 * operation walked the four that create and remove. These three it did not.
 */
#[CoversClass(BranchMoves::class)]
final class BranchMovesTest extends TestCase
{
    private const string NAME = 'demo';

    private Wiring $wiring;

    protected function setUp(): void
    {
        $this->wiring = new Wiring(sys_get_temp_dir() . '/branchery-moves-' . bin2hex(random_bytes(4)));
        $this->wiring->worktree(self::NAME);
    }

    protected function tearDown(): void
    {
        $this->wiring->remove();
    }

    private function reporter(): StepReporter
    {
        return new StepReporter(static function (): void {});
    }

    /**
     * What git is told to say. Written out per test rather than in setUp,
     * because what these operations do is decided by exactly these answers.
     *
     * @param string $tracking "ahead<tab>behind", as rev-list --left-right counts
     */
    private function says(string $branch, ?string $upstream, string $tracking, string $status = ''): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-parse --abbrev-ref HEAD', $branch);
        $web->answer(
            'rev-parse --abbrev-ref --symbolic-full-name',
            $upstream ?? '',
            $upstream === null ? 1 : 0,
        );
        $web->answer('rev-list --left-right --count', $tracking);
        $web->answer('status --porcelain', $status);
    }

    // -- discard ------------------------------------------------------------

    /**
     * The one thing here with no second chance. A reset writes over what was
     * never committed, and unlike the commits above the upstream there is no
     * reflog to find it in -- so it is refused, before anything has been fetched
     * or moved.
     */
    public function testUncommittedWorkIsRefusedBeforeAnythingIsTouched(): void
    {
        $this->says('feature/x', 'origin/feature/x', "2\t0", " M src/Thing.php\n?? untracked.txt");
        $web = $this->wiring->web;

        try {
            $this->wiring->manager->discardUnpushed(self::NAME, $this->reporter());
            self::fail('a worktree with uncommitted changes was reset anyway');
        } catch (\RuntimeException $refusal) {
            self::assertStringContainsString('never committed', $refusal->getMessage());
        }

        self::assertFalse($web->ran('reset --hard'), 'the branch was put back over uncommitted work');
        self::assertFalse($web->ran('fetch'), 'the remote was fetched for an operation that could not run');
    }

    /**
     * An untracked file is not written over by a reset, so it is not a reason to
     * refuse one. The line before this is what a stricter reading would break.
     */
    public function testAnUntrackedFileIsNoReasonToRefuse(): void
    {
        $this->says('feature/x', 'origin/feature/x', "2\t0", '?? notes.md');

        $this->wiring->manager->discardUnpushed(self::NAME, $this->reporter());

        self::assertTrue($this->wiring->web->ran('reset --hard'), 'an untracked file stopped the reset');
    }

    /**
     * Against a stale remote, a reset drops commits that were pushed long ago:
     * they are above the upstream this checkout last heard of and nowhere else.
     */
    public function testTheRemoteIsFetchedBeforeTheBranchIsPutBack(): void
    {
        $this->says('feature/x', 'origin/feature/x', "2\t0");
        $web = $this->wiring->web;

        $this->wiring->manager->discardUnpushed(self::NAME, $this->reporter());

        $fetched = $web->at('fetch origin');
        $reset = $web->at('reset --hard');
        self::assertNotNull($fetched, 'the remote was never fetched: ' . implode("\n", $web->lines()));
        self::assertNotNull($reset, 'the branch was never put back');
        self::assertLessThan($reset, $fetched, 'the branch was put back onto a remote nobody had asked about');
    }

    /**
     * The reader is told which commits went. Read after the reset there is
     * nothing left to read, so the order is the whole of it.
     */
    public function testWhatIsDroppedIsReadWhileItIsStillThere(): void
    {
        $this->says('feature/x', 'origin/feature/x', "2\t0");
        $web = $this->wiring->web;

        $this->wiring->manager->discardUnpushed(self::NAME, $this->reporter());

        $read = $web->at('@{upstream}..HEAD');
        $reset = $web->at('reset --hard');
        self::assertNotNull($read, 'nothing was read about what would be dropped');
        self::assertLessThan($reset, $read, 'what was dropped was read after it was gone');
    }

    /** Nothing to put back onto, so nothing is done and the reason is said. */
    public function testABranchWithNoRemoteIsRefused(): void
    {
        $this->says('feature/x', null, "0\t0");

        try {
            $this->wiring->manager->discardUnpushed(self::NAME, $this->reporter());
            self::fail('a branch following nothing was reset anyway');
        } catch (\RuntimeException $refusal) {
            self::assertStringContainsString('follows no remote branch', $refusal->getMessage());
        }

        self::assertFalse($this->wiring->web->ran('reset --hard'));
    }

    /** Already what the remote has: saying so beats a reset that changes nothing. */
    public function testABranchAlreadyInStepIsLeftAlone(): void
    {
        $this->says('feature/x', 'origin/feature/x', "0\t0");

        $this->wiring->manager->discardUnpushed(self::NAME, $this->reporter());

        self::assertFalse($this->wiring->web->ran('reset --hard'), 'a branch in step was reset for nothing');
    }

    // -- pull ---------------------------------------------------------------

    /**
     * Fast-forward and nothing else. A branch that has gone its own way is the
     * developer's to merge or rebase, in the worktree, knowing what is in it.
     */
    public function testABranchThatHasGoneItsOwnWayIsRefusedRatherThanMerged(): void
    {
        $this->says('feature/x', 'origin/feature/x', "2\t3");
        $web = $this->wiring->web;

        try {
            $this->wiring->manager->pull(self::NAME, $this->reporter());
            self::fail('a diverged branch was moved anyway');
        } catch (\RuntimeException $refusal) {
            self::assertStringContainsString('gone their own ways', $refusal->getMessage());
        }

        self::assertFalse($web->ran('merge'), 'a diverged branch was merged');
        self::assertFalse($web->ran('rebase'), 'a diverged branch was rebased');
    }

    public function testThePullFetchesBeforeItMoves(): void
    {
        $this->says('feature/x', 'origin/feature/x', "0\t2");
        $web = $this->wiring->web;

        $this->wiring->manager->pull(self::NAME, $this->reporter());

        $fetched = $web->at('fetch origin');
        $moved = $web->at('merge --ff-only');
        self::assertNotNull($fetched, 'the remote was never fetched');
        self::assertNotNull($moved, 'the branch was never moved: ' . implode("\n", $web->lines()));
        self::assertLessThan($moved, $fetched, 'the branch was moved onto what was known before the fetch');
    }

    /** Nothing behind: the fetch is worth making, the merge is not. */
    public function testABranchWithNothingToBringInIsNotMoved(): void
    {
        $this->says('feature/x', 'origin/feature/x', "0\t0");

        $this->wiring->manager->pull(self::NAME, $this->reporter());

        self::assertFalse($this->wiring->web->ran('merge --ff-only'), 'a branch in step was merged for nothing');
    }

    // -- restore ------------------------------------------------------------

    /**
     * A branch can be in one worktree at a time. git refuses this itself, with a
     * path rather than a name, so it is refused here where the name is known --
     * and before the switch, which is what makes the message worth anything.
     */
    public function testABranchCheckedOutElsewhereIsRefusedByName(): void
    {
        $this->wiring->worktrees->store(self::NAME, ['branch' => '13.4']);
        $this->wiring->worktree('other');
        // Before says(): the first answer whose text is in the command wins, and
        // the shell that asks all this at once carries "rev-parse --abbrev-ref
        // HEAD" inside it -- so the narrower answer has to be registered first or
        // the whole script is answered with a branch name.
        $this->wiring->web->answer('worktree list --porcelain', implode("\n", [
            "\x1ehead",
            'main',
            "\x1eworktrees",
            'worktree ' . $this->wiring->root . '/.worktrees/other',
            'HEAD 1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d',
            'branch refs/heads/13.4',
            '',
        ]));
        $this->says('feature/patch', 'origin/feature/patch', "0\t0");

        try {
            $this->wiring->manager->restoreBranch(self::NAME, $this->reporter());
            self::fail('a branch already checked out elsewhere was taken');
        } catch (\RuntimeException $refusal) {
            self::assertStringContainsString('checked out in "other"', $refusal->getMessage());
        }

        self::assertFalse($this->wiring->web->ran('switch'), 'the checkout was switched anyway');
    }

    /** Nothing was written down about it, so there is nowhere to go back to. */
    public function testAWorktreeWithNoRecordedBranchIsRefused(): void
    {
        $this->says('feature/patch', null, "0\t0");

        try {
            $this->wiring->manager->restoreBranch(self::NAME, $this->reporter());
            self::fail('a worktree with nothing written down was switched anyway');
        } catch (\RuntimeException $refusal) {
            self::assertStringContainsString('Nothing was written down', $refusal->getMessage());
        }

        self::assertFalse($this->wiring->web->ran('switch'));
    }

    /**
     * Back on its own branch, and only then brought up to date: fetching for a
     * checkout that is still on somebody else's patch measures the wrong branch.
     */
    public function testTheSwitchComesBeforeTheCatchUp(): void
    {
        $this->wiring->worktrees->store(self::NAME, ['branch' => '13.4']);
        $this->says('feature/patch', 'origin/13.4', "0\t2");
        $web = $this->wiring->web;

        $this->wiring->manager->restoreBranch(self::NAME, $this->reporter());

        $switched = $web->at('switch 13.4');
        $fetched = $web->at('fetch origin');
        self::assertNotNull($switched, 'the checkout was never switched: ' . implode("\n", $web->lines()));
        self::assertNotNull($fetched, 'the branch was never brought up to date');
        self::assertLessThan($fetched, $switched, 'the catch-up ran while the checkout was on another branch');
    }

    /** It is there already; a switch that changes nothing is worth a sentence. */
    public function testAWorktreeAlreadyOnItsBranchIsRefused(): void
    {
        $this->wiring->worktrees->store(self::NAME, ['branch' => '13.4']);
        $this->says('13.4', 'origin/13.4', "0\t0");

        try {
            $this->wiring->manager->restoreBranch(self::NAME, $this->reporter());
            self::fail('a worktree already on its branch was switched anyway');
        } catch (\RuntimeException $refusal) {
            self::assertStringContainsString('is on 13.4 already', $refusal->getMessage());
        }

        self::assertFalse($this->wiring->web->ran('switch'));
    }
}
