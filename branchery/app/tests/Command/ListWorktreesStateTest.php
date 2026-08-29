<?php

declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\ListWorktreesCommand;
use App\Model\Worktree;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * What the list says about a worktree besides where it is. The table on the
 * command line said nothing of it, so a reader who had only the table could not
 * tell whether a worktree wanted provisioning again.
 */
#[CoversClass(ListWorktreesCommand::class)]
final class ListWorktreesStateTest extends TestCase
{
    /** @param array<string, mixed> $with */
    private function worktree(array $with = []): Worktree
    {
        return new Worktree(...[
            'name' => 'my-fix', 'branch' => 'my-fix', 'madeFor' => 'my-fix', 'php' => '8.3', 'minPhp' => null, 'node' => null,
            'database' => 'branchery_my_fix', 'profile' => null, 'docroot' => '', 'url' => 'https://my-fix.blog.ddev.site/',
            'backend' => null, 'path' => '/home/dev/blog/.worktrees/my-fix', 'changes' => 0, 'ahead' => 0, 'behind' => 0,
            'ready' => true, 'isProject' => false,
            ...$with,
        ]);
    }

    public function testAWorktreeInStepSaysNothing(): void
    {
        self::assertSame([], ListWorktreesCommand::stateOf($this->worktree()));
    }

    public function testEverythingWorthKnowingIsSaidInTheWordsThePageUses(): void
    {
        $state = ListWorktreesCommand::stateOf($this->worktree([
            'ready' => false, 'stale' => true, 'changes' => 3, 'ahead' => 1, 'behind' => 4,
        ]));

        self::assertSame(['not built', 'dependencies changed since the build', '3 changes uncommitted', '1 commit unpushed', '4 commits behind'], $state);
    }

    /**
     * The one state nothing else in the row gives away: a build that got through
     * its dependencies and stopped after them leaves a worktree that is ready by
     * every measure the list had.
     */
    public function testABuildThatStoppedHalfwayIsSaidAlthoughTheDependenciesAreThere(): void
    {
        self::assertSame(
            ['build unfinished'],
            ListWorktreesCommand::stateOf($this->worktree(['ready' => true, 'incomplete' => true])),
        );
    }

    public function testABranchThatFollowsNothingIsSaidToBeHereAlone(): void
    {
        self::assertSame(['on no remote'], ListWorktreesCommand::stateOf($this->worktree(['ahead' => null, 'behind' => null])));
    }
}
