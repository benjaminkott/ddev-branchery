<?php

declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\ShowJobCommand;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * The line an operation stopped on, read out of its log.
 *
 * An operation refused before its first step has no row to carry the reason,
 * and answered as "failed, 0s" the shell said nothing about why.
 */
#[CoversClass(ShowJobCommand::class)]
final class ShowJobReasonTest extends TestCase
{
    public function testTheLastMarkedLineIsTheReason(): void
    {
        $log = "##STEP 1/2 +0s Reading\n✗ an earlier one\nsome output\n✗ Branch \"feature/(foo);x\" is unknown.\n";

        self::assertSame('Branch "feature/(foo);x" is unknown.', ShowJobCommand::reason($log));
    }

    public function testALogWithoutAMarkHasNoReason(): void
    {
        self::assertSame('', ShowJobCommand::reason("##STEP 1/1 +0s Update origin\nAlready up to date.\n"));
    }
}
