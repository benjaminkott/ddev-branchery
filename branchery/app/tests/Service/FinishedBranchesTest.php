<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\Git;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Reading back what git says about branches that are done with. The offer to
 * remove several worktrees at once is built on this, so what it gets wrong is
 * removed without being asked about.
 */
#[CoversClass(Git::class)]
final class FinishedBranchesTest extends TestCase
{
    public function testNothingIsFinishedInAnEmptyAnswer(): void
    {
        self::assertSame(['merged' => [], 'gone' => []], Git::finishedOf(''));
    }

    public function testMergedAndGoneAreKeptApart(): void
    {
        $output = <<<'OUT'
            merged main
            merged spike/alpha
            gone task/old-endpoint
            OUT;

        self::assertSame(
            ['merged' => ['main', 'spike/alpha'], 'gone' => ['task/old-endpoint']],
            Git::finishedOf($output),
        );
    }

    /**
     * git marks the checked-out branch with an asterisk, and the project's own
     * branch is checked out by definition -- so it arrives as "* main".
     */
    public function testTheCheckedOutBranchIsNotCalledSomethingElse(): void
    {
        self::assertSame(['main'], Git::finishedOf('merged * main')['merged']);
    }

    public function testABranchWithASlashSurvivesIntact(): void
    {
        self::assertSame(['bugfix/v14-typoscript-conditions'], Git::finishedOf('gone bugfix/v14-typoscript-conditions')['gone']);
    }

    /** Lines that are neither are the noise git puts around the answer. */
    public function testWhatIsNeitherIsIgnored(): void
    {
        $output = "warning: something\nmerged main\n\n  \n";

        self::assertSame(['merged' => ['main'], 'gone' => []], Git::finishedOf($output));
    }
}
