<?php

declare(strict_types=1);

namespace App\Tests\Config;

use App\CommandResult;
use App\Config\WorktreeContext;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * What a recipe line that failed is reported as.
 *
 * Its output went into the log while it ran, so the reason must not carry it
 * a second time: the interface shows the first line of the reason as the one
 * thing worth reading, and the first line of a screenful of composer output is
 * never the line that says what went wrong.
 */
#[CoversClass(WorktreeContext::class)]
final class FailedLineTest extends TestCase
{
    public function testTheReasonNamesTheLineAndItsStatusAndNotWhatItWrote(): void
    {
        $result = new CommandResult(2, '', "Installing dependencies from lock file\n- Required package is not present in the lock file.");

        self::assertSame(
            'composer install --no-interaction failed with exit status 2.',
            WorktreeContext::failed('composer install --no-interaction', $result),
        );
    }
}
