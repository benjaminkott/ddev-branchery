<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\Git;
use App\Service\GitOutput;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Reading back the one answer the whole list is built on. Every worktree's state
 * comes out of a single loop, as lines, so the shape is a protocol -- and a
 * protocol nobody checks is a list quietly saying the wrong thing about
 * somebody's uncommitted work.
 */
#[CoversClass(Git::class)]
final class WorktreeStatesTest extends TestCase
{
    public function testAWorktreeThatSaidNothingIsStillThere(): void
    {
        $states = GitOutput::statesOf("# /var/www/html/.worktrees/demo\n");

        self::assertArrayHasKey('demo', $states);
        self::assertSame(0, $states['demo']->changes);
        self::assertSame('', $states['demo']->head);
    }

    public function testEverythingOneWorktreeSaysIsKept(): void
    {
        $output = <<<'OUT'
            # /var/www/html/.worktrees/demo
            changes 3
            head 0b5a1f2c9d
            change I4e71cccf7b662070d934680cf283e896a110dc99
            issue 81291
            tracking 2	5
            OUT;

        $state = GitOutput::statesOf($output)['demo'];

        self::assertSame(3, $state->changes);
        self::assertSame('0b5a1f2c9d', $state->head);
        self::assertSame('I4e71cccf7b662070d934680cf283e896a110dc99', $state->change);
        self::assertSame('81291', $state->issue);
        // --left-right counts this side first, then the other.
        self::assertSame(2, $state->ahead);
        self::assertSame(5, $state->behind);
    }

    /** A commit with no trailers is the ordinary case outside a core checkout. */
    public function testACommitThatSaysNothingLeavesNothingBehind(): void
    {
        $output = "# /var/www/html/.worktrees/demo\nchanges 0\nchange \nissue \n";
        $state = GitOutput::statesOf($output)['demo'];

        self::assertSame('', $state->change);
        self::assertSame('', $state->issue);
    }

    /** A branch that tracks nothing is "nowhere else", not "in step". */
    /**
     * Only ever "yes, changed" or nothing: a worktree whose built commit was never
     * written down says nothing and is not marked.
     */
    public function testWhatTheBuildReadsHavingChangedIsSaidOnce(): void
    {
        $states = GitOutput::statesOf("# /home/dev/blog/.worktrees/moved\nchanges 0\nrebuild 2\n# /home/dev/blog/.worktrees/same\nchanges 0\nrebuild 0\n# /home/dev/blog/.worktrees/old\nchanges 0\n");

        self::assertTrue($states['moved']->rebuild);
        self::assertFalse($states['same']->rebuild);
        self::assertFalse($states['old']->rebuild);
    }

    /** As "log -1" names it -- and nothing where the checkout could not be read. */
    public function testTheTipIsTheHashAndTheSubject(): void
    {
        $state = GitOutput::statesOf("# /var/www/html/.worktrees/demo\nchanges 0\ntip 1a8ebfc\t[BUGFIX] Check for correct settings uid (#306)\n")['demo'];

        self::assertSame(['sha' => '1a8ebfc', 'subject' => '[BUGFIX] Check for correct settings uid (#306)'], $state->tip);
        self::assertNull(GitOutput::statesOf("# /var/www/html/.worktrees/demo\ntip \n")['demo']->tip);
    }

    public function testWithoutAnUpstreamThereIsNoDistance(): void
    {
        $state = GitOutput::statesOf("# /var/www/html/.worktrees/demo\nchanges 0\n")['demo'];

        self::assertNull($state->ahead);
        self::assertNull($state->behind);
    }

    public function testSeveralWorktreesAreKeptApart(): void
    {
        $output = <<<'OUT'
            # /var/www/html/.worktrees/one
            changes 1
            issue 11111
            # /var/www/html/.worktrees/two
            changes 2
            issue 22222
            OUT;

        $states = GitOutput::statesOf($output);

        self::assertSame(['one', 'two'], array_keys($states));
        self::assertSame('11111', $states['one']->issue);
        self::assertSame(2, $states['two']->changes);
    }

    /**
     * The checkouts are read several at a time, so a block arrives whenever its
     * worker was through and not in the order the directories were listed. Every
     * block carries the name it is about, and that is what has to decide.
     */
    public function testTheOrderTheBlocksArriveInDecidesNothing(): void
    {
        $output = <<<'OUT'
            # /var/www/html/.worktrees/two
            changes 2
            issue 22222
            # /var/www/html/.worktrees/one
            changes 1
            issue 11111
            OUT;

        $states = GitOutput::statesOf($output);

        self::assertSame('11111', $states['one']->issue);
        self::assertSame(1, $states['one']->changes);
        self::assertSame('22222', $states['two']->issue);
        self::assertSame(2, $states['two']->changes);
    }
}
