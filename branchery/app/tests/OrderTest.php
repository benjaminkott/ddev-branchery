<?php

declare(strict_types=1);

namespace App\Tests;

use App\Text;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * The order two lists are read in. Ordered as text, "10.4" stands above "9.5" --
 * and in a repository whose branches are versions and ticket numbers that is
 * wrong in the one way a reader notices at a glance.
 */
#[CoversClass(Text::class)]
final class OrderTest extends TestCase
{
    /**
     * @param list<string> $names
     *
     * @return list<string>
     */
    private function ordered(array $names): array
    {
        return Text::inReadingOrder($names);
    }

    public function testVersionsStandInTheOrderTheyWereReleased(): void
    {
        self::assertSame(
            ['9.5', '10.4', '11.5', '12.4', '13.4', 'main'],
            $this->ordered(['13.4', '9.5', 'main', '10.4', '12.4', '11.5']),
        );
    }

    public function testTicketNumbersCountUp(): void
    {
        self::assertSame(
            ['bugfix/81291-one', 'bugfix/81300-two', 'bugfix/102003-three'],
            $this->ordered(['bugfix/102003-three', 'bugfix/81291-one', 'bugfix/81300-two']),
        );
    }

    public function testEverythingElseIsStillAlphabetical(): void
    {
        self::assertSame(
            ['bugfix/cache', 'feature/search', 'task/cleanup'],
            $this->ordered(['task/cleanup', 'bugfix/cache', 'feature/search']),
        );
    }
}
