<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\WebContainer;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * What of a tool's output reaches the log.
 *
 * git draws its progress on one line and redraws it with a carriage return
 * at every step. On a terminal that is one line; written into a log as it
 * came, it was ninety -- and the interface reads the log.
 */
#[CoversClass(WebContainer::class)]
final class WebContainerTest extends TestCase
{
    public function testARedrawnLineIsWhatItSaidLast(): void
    {
        $redrawn = "Updating files:  12% (2507/19539)\rUpdating files:  13% (2600/19539)\rUpdating files: 100% (19539/19539), done.";

        self::assertSame('Updating files: 100% (19539/19539), done.', WebContainer::settled($redrawn));
    }

    public function testALineDrawnOnceIsLeftAsItIs(): void
    {
        self::assertSame('HEAD is now at 3769aab [RELEASE] v12.0.4', WebContainer::settled('HEAD is now at 3769aab [RELEASE] v12.0.4  '));
        self::assertSame('', WebContainer::settled("Updating files:  12% (2507/19539)\r"));
    }
}
