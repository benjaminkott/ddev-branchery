<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\StepReporter;
use App\Service\WorktreeManager;
use App\Tests\Fake\Wiring;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * What an operation does, as the order of the commands it runs.
 *
 * Every one of them ends in the web container, so the paths walked here are the
 * ones no other test reaches: the checkout that must not move a branch the
 * developer already has, the question asked before a database is dropped, the
 * step that stops the rest. A wrong order is a worktree half built in front of
 * a developer, and neither the types nor the analyser have anything to say
 * about it.
 */
#[CoversClass(WorktreeManager::class)]
final class WorktreeOperationsTest extends TestCase
{
    private Wiring $wiring;

    protected function setUp(): void
    {
        $this->wiring = new Wiring(sys_get_temp_dir() . '/branchery-ops-' . bin2hex(random_bytes(4)));
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
     * The promise of the whole thing: a branch the developer already has is
     * checked out as it stands. "worktree add -B" resets it onto its remote and
     * throws away unpushed commits, silently, in the one operation whose promise
     * is that it takes nothing away.
     */
    public function testABranchThatIsHereIsCheckedOutAsItStands(): void
    {
        $web = $this->wiring->web;
        // git says the branch is here, so the start point is the branch itself.
        $web->answer('rev-parse --verify --quiet refs/heads/my-fix', 'refs/heads/my-fix');

        $this->wiring->manager->add('my-fix', null, $this->reporter());

        self::assertTrue($web->ran('worktree add'), 'no worktree was made: ' . implode("\n", $web->lines()));
        self::assertFalse(
            $web->ran('worktree add -B'),
            'the checkout reset the branch onto its remote: ' . implode("\n", $web->lines()),
        );
    }

    /**
     * A branch this repository has never had is cut from the remote, which is the
     * other half of the same rule.
     */
    public function testABranchThatIsOnlyOnTheRemoteIsCutFromIt(): void
    {
        $web = $this->wiring->web;
        $web->answer('refs/remotes/origin/feature/x', 'refs/remotes/origin/feature/x');

        $this->wiring->manager->add('feature/x', null, $this->reporter());

        self::assertTrue($web->ran('worktree add'), 'no worktree was made: ' . implode("\n", $web->lines()));
    }

    /**
     * The checkout comes before anything is built in it, and the versions are
     * chosen before the dependencies that are installed against them. Read as an
     * order rather than as a set: a build that installs before it has checked out
     * installs the project's own code under the worktree's name.
     */
    public function testTheCheckoutComesBeforeWhatIsBuiltInIt(): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-parse --verify --quiet refs/heads/my-fix', 'refs/heads/my-fix');

        $this->wiring->manager->add('my-fix', null, $this->reporter());

        $checkout = $web->at('worktree add');
        self::assertNotNull($checkout, 'no worktree was made: ' . implode("\n", $web->lines()));
        foreach ($web->lines() as $index => $line) {
            if (str_contains($line, 'composer install')) {
                self::assertGreaterThan($checkout, $index, 'dependencies were installed before the checkout');
            }
        }
    }

    /**
     * A removal takes three things away and has to get through all of them: the
     * database, the checkout, and git's own entry for it. A step that stops the
     * rest leaves a worktree that is half gone and cannot be removed again.
     */
    public function testARemovalTakesTheDatabaseTheCheckoutAndTheEntry(): void
    {
        $this->wiring->worktree('my-fix');
        $web = $this->wiring->web;

        $this->wiring->manager->remove('my-fix', $this->reporter());

        self::assertTrue($web->ran('DROP DATABASE'), 'the database was left behind: ' . implode("\n", $web->lines()));
        self::assertTrue($web->ran('worktree remove'), 'the checkout was left behind');
        self::assertTrue($web->ran('worktree prune'), "git's entry was left behind");
    }

    /**
     * The branch goes after the checkout it was in. Deleted first, git refuses it
     * as checked out and the branch stays behind -- which is the one thing here
     * the developer has to be told about.
     */
    public function testTheBranchGoesAfterTheCheckoutItWasIn(): void
    {
        $this->wiring->worktree('my-fix');
        $web = $this->wiring->web;
        $web->answer('symbolic-ref', 'bugfix/my-fix');

        $this->wiring->manager->remove('my-fix', $this->reporter());

        $checkout = $web->at('worktree remove');
        $branch = $web->at('branch -D');
        self::assertNotNull($checkout);
        if ($branch !== null) {
            self::assertGreaterThan($checkout, $branch, 'the branch was deleted while it was still checked out');
        }
    }

    /**
     * Copying data out of a worktree into itself is dropping it and copying it
     * back out of nothing. Refused before a lock is taken, not by the copy.
     */
    public function testAWorktreeCannotTakeItsDataFromItself(): void
    {
        $this->wiring->worktree('my-fix');

        $this->expectException(\InvalidArgumentException::class);

        try {
            $this->wiring->manager->syncDatabase('my-fix', 'my-fix', $this->reporter());
        } finally {
            self::assertFalse($this->wiring->web->ran('DROP DATABASE'), 'the database was dropped anyway');
        }
    }

    /**
     * A worktree is refused a name that is taken, and refused before anything has
     * been run for it -- the container is asked nothing at all.
     */
    public function testANameThatIsTakenIsRefusedBeforeAnythingIsDone(): void
    {
        $this->wiring->worktree('my-fix');

        $this->expectException(\InvalidArgumentException::class);

        try {
            $this->wiring->manager->add('my-fix', null, $this->reporter());
        } finally {
            self::assertFalse(
                $this->wiring->web->ran('worktree add'),
                'a worktree was made for a name that was taken',
            );
        }
    }
}
