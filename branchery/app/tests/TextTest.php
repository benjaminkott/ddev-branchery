<?php

declare(strict_types=1);

namespace App\Tests;

use App\Text;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(Text::class)]
final class TextTest extends TestCase
{
    public function testOneOfSomethingIsSingular(): void
    {
        self::assertSame('1 commit', Text::count(1, 'commit'));
        self::assertSame('2 commits', Text::count(2, 'commit'));
    }

    /** Zero is a plural in English, and reads wrong as a singular. */
    public function testNoneOfSomethingIsPlural(): void
    {
        self::assertSame('0 tables', Text::count(0, 'table'));
    }

    public function testTakesThePluralWhereAnSWouldNotDo(): void
    {
        self::assertSame('1 entry', Text::count(1, 'entry', 'entries'));
        self::assertSame('3 entries', Text::count(3, 'entry', 'entries'));
    }
}
