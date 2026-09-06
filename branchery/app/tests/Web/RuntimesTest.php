<?php

declare(strict_types=1);

namespace App\Tests\Web;

use App\Web\Runtimes;
use PHPUnit\Framework\TestCase;

/**
 * What the web container runs on, read out of one answer: three facts as a
 * block of lines, every line saying which of the three it is. Reading that
 * wrongly is a list that shows the wrong runtime for every worktree.
 */
final class RuntimesTest extends TestCase
{
    public function testReadsTheThreeAnswersOutOfOne(): void
    {
        $read = Runtimes::readingOf("php 8.3\npool 8.2\npool 8.3\npool 8.4\nnode 22.11.0");

        self::assertSame('8.3', $read['php']);
        self::assertSame(['8.2', '8.3', '8.4'], $read['pools']);
        self::assertSame('22.11.0', $read['node']);
    }

    /**
     * A container without Node says nothing about one, which is a container this
     * add-on still works in.
     */
    public function testSaysNothingAboutANodeThatIsNotThere(): void
    {
        $read = Runtimes::readingOf("php 8.4\npool 8.4");

        self::assertSame('8.4', $read['php']);
        self::assertSame(['8.4'], $read['pools']);
        self::assertNull($read['node']);
    }

    /** Nothing came back at all -- the container is away, or the shell failed. */
    public function testSurvivesAnEmptyAnswer(): void
    {
        self::assertSame(['php' => '', 'pools' => [], 'node' => null], Runtimes::readingOf(''));
    }

    /**
     * The shell keeps its complaints off this stream, and a line that arrives here
     * all the same must not be read as a version.
     */
    public function testIgnoresWhatItDoesNotUnderstand(): void
    {
        $read = Runtimes::readingOf("bash: node: command not found\npool\nphp 8.4\nwhat 1.2");

        self::assertSame('8.4', $read['php']);
        self::assertSame([], $read['pools']);
        self::assertNull($read['node']);
    }
}
