<?php

declare(strict_types=1);

namespace App\Tests\Operation;

use App\Jobs\Locks;
use App\Jobs\StepReporter;
use App\Operation\BranchMoves;
use App\Operation\CarriedFiles;
use App\Operation\Checks;
use App\Operation\DataTransfer;
use App\Operation\Provisioning;
use App\Operation\Removal;
use App\Operation\WorktreeManager;
use App\Tests\Fake\Wiring;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
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
 *
 * The order is WorktreeManager's and the steps are App\Operation's, so both are
 * walked from here: neither half is worth anything without the other.
 */
#[CoversClass(WorktreeManager::class)]
#[CoversClass(Checks::class)]
#[CoversClass(CarriedFiles::class)]
#[CoversClass(Provisioning::class)]
#[CoversClass(Removal::class)]
#[CoversClass(BranchMoves::class)]
#[CoversClass(DataTransfer::class)]
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
     * The worktree is claimed for the whole of an operation, and the claim is
     * held by nothing but a local variable's life -- `$claim = $this->claim(...)`,
     * never read again. Nothing about that is a type or a call the analyser can
     * follow, so a cleanup that drops the assignment as unused drops the
     * exclusion with it, and every other test here goes on passing.
     *
     * Asked of a second Locks over the same files, which is what another process
     * is: flock is per open file, so this one blocks against the operation's.
     */
    public function testAWorktreeIsClaimedForTheWholeOfAnOperation(): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-parse --verify --quiet refs/heads/my-fix', 'refs/heads/my-fix');

        $beside = new Locks($this->wiring->project, $this->wiring->files);
        $key = Locks::forWorktree('my-fix');
        $seen = [];
        $web->whileRunning('worktree add', static function () use ($beside, $key, &$seen): void {
            $seen[] = $beside->heldElsewhere($key);
        });

        $this->wiring->manager->add('my-fix', null, $this->reporter());

        self::assertNotSame([], $seen, 'no checkout ran, so nothing was asked about the claim');
        self::assertNotContains(false, $seen, 'the worktree was not claimed while it was being built');
        // And let go of at the far end, or the next operation on it would wait
        // for a process that has finished.
        self::assertFalse($beside->heldElsewhere($key), 'the claim outlived the operation');
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
     * The copy goes through a shell, and what it is handed is built three classes
     * away: a name that reaches that shell unquoted is safe only for as long as
     * nothing upstream widens what a worktree may be called. Read as the property
     * it is -- outside its quotes, the name does not appear at all.
     */
    #[DataProvider('databaseServers')]
    public function testNoNameReachesTheShellUnquotedWhenDataIsReplaced(string $family): void
    {
        $this->wiring->worktree('my-fix');
        $web = $this->wiring->web;
        $web->answer('DDEV_DATABASE_FAMILY', $family);

        $this->wiring->manager->syncDatabase('my-fix', null, $this->reporter());

        $script = self::lineWith($web->lines(), 'DROP DATABASE');
        $bare = (string) preg_replace("/'[^']*'/", '', $script);
        self::assertStringNotContainsString('branchery_my_fix', $bare, 'the name reached the shell unquoted: ' . $script);
        self::assertStringNotContainsString(' db ', $bare, 'the source reached the shell unquoted: ' . $script);
    }

    /** @return iterable<string, array{string}> */
    public static function databaseServers(): iterable
    {
        yield 'mariadb' => ['mysql'];
        yield 'postgres' => ['postgres'];
    }

    /**
     * @param list<string> $lines
     */
    private static function lineWith(array $lines, string $match): string
    {
        foreach ($lines as $line) {
            if (str_contains($line, $match)) {
                return $line;
            }
        }

        self::fail('nothing ran that carried "' . $match . '": ' . implode("\n", $lines));
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
