<?php

declare(strict_types=1);

namespace App\Tests\Operation;

use App\Jobs\Locks;
use App\Jobs\StepReporter;
use App\Operation\BranchMoves;
use App\Operation\Checks;
use App\Operation\CopiedFiles;
use App\Operation\DataTransfer;
use App\Operation\Provisioning;
use App\Operation\Removal;
use App\Operation\WorktreeManager;
use App\Tests\Fake\Wiring;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;

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
#[CoversClass(CopiedFiles::class)]
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

    /** The same project, told it answers at these hostnames too. */
    private function withHostnames(string ...$hostnames): Wiring
    {
        $this->wiring->remove();

        return new Wiring($this->wiring->root, array_values($hostnames));
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
     *
     * And asked of every operation rather than of one: they reach the claim four
     * different ways, and a build being claimed said nothing whatever about a
     * removal being claimed.
     *
     * @param \Closure(Wiring, StepReporter): void $operation
     */
    #[DataProvider('operations')]
    public function testAWorktreeIsClaimedForTheWholeOfAnOperation(\Closure $operation): void
    {
        $beside = new Locks($this->wiring->project, $this->wiring->files);
        $key = Locks::forWorktree('my-fix');
        $seen = [];
        // Whatever runs, rather than one command the operation is known to run:
        // what is asked here is that nothing it does happens outside the claim.
        $this->wiring->web->whileRunning('', static function () use ($beside, $key, &$seen): void {
            $seen[] = $beside->heldElsewhere($key);
        });

        $operation($this->wiring, $this->reporter());

        self::assertNotSame([], $seen, 'nothing ran, so nothing was asked about the claim');
        self::assertNotContains(false, $seen, 'the worktree was worked on while it was not claimed');
        // And let go of at the far end, or the next operation on it would wait
        // for a process that has finished.
        self::assertFalse($beside->heldElsewhere($key), 'the claim outlived the operation');
    }

    /**
     * Every operation that claims a worktree, with whatever it takes to get that
     * one as far as running something. All of them are about "my-fix", so the
     * claim asked about above is the same one throughout.
     *
     * @return iterable<string, array{\Closure(Wiring, StepReporter): void}>
     */
    public static function operations(): iterable
    {
        yield 'add' => [static function (Wiring $wiring, StepReporter $reporter): void {
            $wiring->web->answer('rev-parse --verify --quiet refs/heads/my-fix', 'refs/heads/my-fix');
            $wiring->manager->add('my-fix', null, $reporter);
        }];
        // A branch nothing answers for is one the repository does not have, which
        // is what a fork needs: it cuts the branch itself.
        yield 'fork' => [static function (Wiring $wiring, StepReporter $reporter): void {
            $wiring->web->answer('rev-parse --verify --quiet refs/heads/my-fix', '', 1);
            $wiring->manager->fork('my-fix', null, null, $reporter);
        }];
        yield 'provision' => [static function (Wiring $wiring, StepReporter $reporter): void {
            $wiring->worktree('my-fix');
            $wiring->manager->provision('my-fix', false, $reporter);
        }];
        yield 'remove' => [static function (Wiring $wiring, StepReporter $reporter): void {
            $wiring->worktree('my-fix');
            $wiring->manager->remove('my-fix', $reporter);
        }];
        yield 'sync' => [static function (Wiring $wiring, StepReporter $reporter): void {
            $wiring->worktree('my-fix');
            $wiring->manager->syncDatabase('my-fix', null, $reporter);
        }];
        // The three that move a checkout need somewhere to move it from.
        yield 'pull' => [static function (Wiring $wiring, StepReporter $reporter): void {
            $wiring->worktree('my-fix');
            $wiring->web->answer('@{upstream}', 'origin/my-fix');
            $wiring->manager->pull('my-fix', $reporter);
        }];
        yield 'restore' => [static function (Wiring $wiring, StepReporter $reporter): void {
            $wiring->worktree('my-fix');
            $wiring->worktrees->store('my-fix', ['branch' => 'main']);
            $wiring->manager->restoreBranch('my-fix', $reporter);
        }];
        yield 'discard' => [static function (Wiring $wiring, StepReporter $reporter): void {
            $wiring->worktree('my-fix');
            $wiring->web->answer('@{upstream}', 'origin/my-fix');
            $wiring->manager->discardUnpushed('my-fix', $reporter);
        }];
        yield 'reconfigure' => [static function (Wiring $wiring, StepReporter $reporter): void {
            $wiring->worktree('my-fix');
            $wiring->manager->reconfigure('my-fix');
        }];
        yield 'the php version' => [static function (Wiring $wiring, StepReporter $reporter): void {
            $wiring->worktree('my-fix');
            $wiring->web->answer('php-fpm', "php 8.3\npool 8.4\n");
            $wiring->manager->setPhpVersion('my-fix', '8.4');
        }];
    }

    /**
     * A review starts on the trunk while the checkout stands on a feature. Cut at
     * the commit and not at the remote's name, or the new branch would track the
     * trunk and its first pull would pull that.
     */
    public function testAForkStartsAtTheBaseItWasGiven(): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-parse --verify --quiet refs/heads/review', '', 1);
        $web->answer('origin/main^{commit}', 'c0ffee0123456789');

        $this->wiring->manager->fork('review', null, null, $this->reporter(), 'origin/main');

        self::assertTrue($web->ran('worktree add -b review'), implode("\n", $web->lines()));
        self::assertStringEndsWith(' c0ffee0123456789', $web->lines()[(int) $web->at('worktree add -b review')]);
        self::assertSame('origin/main', $this->wiring->worktrees->metadata('review')['forkedFrom'] ?? null);
        self::assertSame('c0ffee0123456789', $this->wiring->worktrees->metadata('review')['forkedAt'] ?? null);
    }

    /** The build finishes either way; what it says at the end is what differs. */
    #[DataProvider('answers')]
    public function testABuildAsksItsEntrypointsAndSaysWhatTheyAnswer(string $status, bool $concerning): void
    {
        file_put_contents($this->wiring->worktree('my-fix') . '/index.php', '<?php');
        $this->wiring->recipe("entrypoints:\n  - Backend: /typo3\n");
        $web = $this->wiring->web;
        $web->answer('curl', $status);
        $reporter = $this->reporter();

        $this->wiring->manager->provision('my-fix', false, $reporter);

        $asked = $web->lines()[(int) $web->at('curl')];
        self::assertStringContainsString('my-fix.', $asked);
        self::assertStringEndsWith('/typo3', $asked);
        self::assertStringContainsString(':443:127.0.0.1', $asked);
        self::assertSame($concerning, $reporter->concerns() !== [], implode("\n", $reporter->concerns()));
    }

    /** @return iterable<string, array{string, bool}> */
    public static function answers(): iterable
    {
        yield 'a page' => ['200', false];
        yield 'a page that is not served' => ['403', true];
        yield 'nothing at all' => ['000', true];
    }

    public function testABaseThatNamesNoCommitIsRefusedBeforeAnythingIsMade(): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-parse --verify --quiet refs/heads/review', '', 1);
        $web->answer('nowhere^{commit}', '', 1);

        try {
            $this->wiring->manager->fork('review', null, null, $this->reporter(), 'nowhere');
            self::fail('A base naming nothing was taken.');
        } catch (\InvalidArgumentException $refusal) {
            self::assertStringContainsString('"nowhere"', $refusal->getMessage());
        }
        self::assertFalse($web->ran('worktree add'));
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
        $this->wiring->worktrees->store('my-fix', ['branch' => 'bugfix/my-fix', 'ownsBranch' => true]);
        $web = $this->wiring->web;
        $web->answer('rev-parse --abbrev-ref HEAD', 'bugfix/my-fix');
        $web->answer('rev-list --count', '0');

        $this->wiring->manager->remove('my-fix', $this->reporter());

        $checkout = $web->at('worktree remove');
        $branch = $web->at('branch -D bugfix/my-fix');
        self::assertNotNull($checkout);
        self::assertNotNull($branch, 'the branch the worktree cut was left behind: ' . implode("\n", $web->lines()));
        self::assertGreaterThan($checkout, $branch, 'the branch was deleted while it was still checked out');
    }

    /**
     * Only what the worktree made is taken back with it. A branch that was here
     * before is the developer's, and one the checkout wandered onto was never
     * the worktree's at all.
     *
     * @param array<string, mixed> $meta
     */
    #[DataProvider('keptBranches')]
    public function testABranchTheWorktreeDidNotCutStays(array $meta, string $on): void
    {
        $this->wiring->worktree('my-fix');
        $this->wiring->worktrees->store('my-fix', $meta);
        $web = $this->wiring->web;
        $web->answer('rev-parse --abbrev-ref HEAD', $on);

        $this->wiring->manager->remove('my-fix', $this->reporter());

        self::assertTrue($web->ran('worktree remove'), 'the checkout was left behind');
        self::assertFalse($web->ran('branch -D'), 'a branch was deleted: ' . implode("\n", $web->lines()));
    }

    /** @return iterable<string, array{array<string, mixed>, string}> */
    public static function keptBranches(): iterable
    {
        yield 'checked out as it stood' => [['branch' => 'my-fix', 'ownsBranch' => false], 'my-fix'];
        yield 'wandered onto a patch' => [['branch' => 'my-fix', 'ownsBranch' => true], 'review/12345'];
        // Made before anything was written down about it: not knowing is keeping.
        yield 'nothing written down' => [['branch' => 'my-fix'], 'my-fix'];
    }

    /**
     * Commits only the branch holds are kept by keeping the branch: the rest of
     * the worktree can go without them, and asked for, they go too.
     */
    public function testABranchHoldingCommitsNowhereElseStaysUnlessTold(): void
    {
        foreach ([false, true] as $force) {
            $this->wiring->worktree('my-fix');
            $this->wiring->worktrees->store('my-fix', ['branch' => 'my-fix', 'ownsBranch' => true]);
            $web = $this->wiring->web;
            $web->answer('rev-parse --abbrev-ref HEAD', 'my-fix');
            $web->answer('rev-list --count HEAD --not --exclude=my-fix', '2');

            $this->wiring->manager->remove('my-fix', $this->reporter(), $force);

            self::assertTrue($web->ran('worktree remove'), 'the checkout was left behind');
            self::assertSame($force, $web->ran('branch -D my-fix'), implode("\n", $web->lines()));
        }
    }

    /**
     * What is only in the checkout cannot be kept by keeping a branch, so the
     * removal is refused before it has touched anything -- the database first.
     *
     * @param array<string, string> $answers
     */
    #[DataProvider('workOnlyInTheCheckout')]
    public function testARemovalThatWouldLoseWorkIsRefused(array $answers): void
    {
        $this->wiring->worktree('my-fix');
        $web = $this->wiring->web;
        foreach ($answers as $match => $output) {
            $web->answer($match, $output);
        }

        try {
            $this->wiring->manager->remove('my-fix', $this->reporter());
            self::fail('the removal went ahead: ' . implode("\n", $web->lines()));
        } catch (\RuntimeException $refused) {
            self::assertStringContainsString('--force', $refused->getMessage());
        }
        self::assertFalse($web->ran('DROP DATABASE'), 'the database was dropped anyway');
        self::assertFalse($web->ran('worktree remove'), 'the checkout was removed anyway');

        $this->wiring->manager->remove('my-fix', $this->reporter(), true);

        self::assertTrue($web->ran('worktree remove'), 'told to, it still would not go');
    }

    /** @return iterable<string, array{array<string, string>}> */
    public static function workOnlyInTheCheckout(): iterable
    {
        yield 'uncommitted changes' => [['status --porcelain' => " M index.php\n?? notes.md"]];
        yield 'commits on no branch' => [['rev-parse --abbrev-ref HEAD' => 'HEAD', 'rev-list --count' => '1']];
    }

    /** What a removal is allowed to take is decided when the worktree is made. */
    public function testAWorktreeOwnsOnlyTheBranchItCut(): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-parse --verify --quiet refs/heads/my-fix', 'refs/heads/my-fix');
        $this->wiring->manager->add('my-fix', null, $this->reporter());

        self::assertFalse($this->wiring->worktrees->metadata('my-fix')['ownsBranch'] ?? null, 'a branch that was here became the worktree\'s');

        $web->answer('rev-parse --verify --quiet refs/heads/review', '', 1);
        $this->wiring->manager->fork('review', null, null, $this->reporter());

        self::assertTrue($this->wiring->worktrees->metadata('review')['ownsBranch'] ?? null, 'the branch a fork cut is not the worktree\'s');
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

    /**
     * A worktree is served at one more address for each of the project's other
     * hostnames, by the same files: one link per address, all on the worktree.
     */
    public function testTheOtherAddressesAreLinkedBesideTheWorktreesOwn(): void
    {
        $this->wiring = $this->withHostnames('site-b.ddev.site');
        $web = $this->wiring->web;
        $web->answer('rev-parse --verify --quiet refs/heads/my-fix', 'refs/heads/my-fix');

        $this->wiring->manager->add('my-fix', null, $this->reporter());

        $docroots = $this->wiring->project->docrootsDirectory();
        self::assertTrue(is_link($docroots . '/my-fix'));
        self::assertTrue(is_link($docroots . '/my-fix-site-b'), 'the second address has no link: ' . implode(', ', array_map('basename', glob($docroots . '/*') ?: [])));
        self::assertSame(readlink($docroots . '/my-fix'), readlink($docroots . '/my-fix-site-b'));
    }

    /**
     * A copied site configuration names the project's hostnames, and each of them
     * goes onto the worktree's address for it -- the second site stays a second
     * site. The command is run here as recorded, because what it does is sed's
     * doing: the expressions run one after the other on the same line, and the
     * address just written is one more host under the domain.
     */
    public function testACopiedSiteConfigurationKeepsItsSecondSiteApart(): void
    {
        $this->wiring = $this->withHostnames('site-b.ddev.site', 'shop.example.test');
        $sites = $this->wiring->worktree('my-fix') . '/typo3conf/sites';
        (new Filesystem())->mkdir($sites);
        file_put_contents($sites . '/config.yaml', implode("\n", [
            "main: 'https://blog.ddev.site/'",
            "b: 'https://site-b.ddev.site/en/'",
            "shop: 'https://shop.example.test'",
            "other: 'https://other.ddev.site/'",
            '',
        ]));

        // Not under version control, or it would be left as the branch has it.
        $this->wiring->web->answer('ls-files --error-unmatch', '', 1);

        $this->wiring->surroundings->retargetSites('my-fix', 'https://my-fix.blog.ddev.site/', ['typo3conf/sites']);

        $rewrite = array_values(array_filter($this->wiring->web->commands(), static fn (array $command): bool => str_contains(implode(' ', $command), 'sed -i -E')));
        self::assertCount(1, $rewrite, 'no rewrite was run');
        exec(implode(' ', array_map('escapeshellarg', $rewrite[0])), $output, $status);
        self::assertSame(0, $status, implode("\n", $output));
        self::assertSame(implode("\n", [
            "main: 'https://my-fix.blog.ddev.site/'",
            "b: 'https://my-fix-site-b.blog.ddev.site/en/'",
            "shop: 'https://my-fix-shop-example-test.blog.ddev.site/'",
            "other: 'https://my-fix.blog.ddev.site/'",
            '',
        ]), file_get_contents($sites . '/config.yaml'));
    }

    /**
     * The other addresses are "<worktree>-<label>", so a name can be another
     * worktree's address without being its name -- from either side.
     */
    public function testANameThatIsAnotherWorktreesAddressIsRefused(): void
    {
        $this->wiring = $this->withHostnames('site-b.ddev.site');
        $this->wiring->worktree('shop');
        $this->wiring->worktree('my-fix-site-b');

        foreach (['shop-site-b', 'my-fix'] as $name) {
            try {
                $this->wiring->manager->add($name, null, $this->reporter());
                self::fail(sprintf('"%s" was taken for a name.', $name));
            } catch (\InvalidArgumentException $refusal) {
                self::assertStringContainsString('Pick another name', $refusal->getMessage());
            }
        }
        self::assertFalse($this->wiring->web->ran('worktree add'), 'a worktree was made for a name that is an address');
    }
}
