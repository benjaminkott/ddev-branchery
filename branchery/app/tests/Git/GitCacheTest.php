<?php

declare(strict_types=1);

namespace App\Tests\Git;

use App\Git\Facts;
use App\Git\Git;
use App\Git\Runner;
use App\Locking\Locks;
use App\ManagedFiles;
use App\Project;
use App\Tests\Fake\Assembled;
use App\Tests\Fake\RecordingContainer;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * That what git said stops being believed the moment this application moves it.
 *
 * Every answer kept for a request is true only until git moves, and it is this
 * application that moves it. That used to be nine fields cleared by hand in a
 * method every writing call had to remember to make, and two of them had
 * stopped remembering -- which is no type error, no analyser finding and no
 * failing test elsewhere. It is a page showing a branch that has since moved.
 *
 * The Runner tells whoever kept an answer, so the remembering is gone. What is
 * left to hold is that it tells, that a question does not, and that being told
 * drops everything.
 */
#[CoversClass(Runner::class)]
#[CoversClass(Facts::class)]
#[CoversClass(Git::class)]
final class GitCacheTest extends TestCase
{
    /**
     * The whole of the reaction, read as a property of the class rather than as a
     * list to keep in step: a field added to Facts is found by the same rule that
     * finds the ones already there.
     */
    public function testInvalidateDropsEverythingFactsRemembers(): void
    {
        $facts = new Facts(self::project(), new Runner(self::project(), new RecordingContainer()));

        $kept = self::caches();
        self::assertNotSame([], $kept, 'no cached fields were found; this test has stopped testing anything');

        $defaults = (new \ReflectionClass(Facts::class))->getDefaultProperties();
        foreach ($kept as $property) {
            $property->setValue($facts, self::stale($property));
        }

        $facts->invalidate();

        foreach ($kept as $property) {
            self::assertSame(
                $defaults[$property->getName()] ?? null,
                $property->getValue($facts),
                sprintf('invalidate() left "%s" as it was; a moved branch goes on being reported as it stood.', $property->getName()),
            );
        }
    }

    /**
     * The half no reflection can see: that a write says so at all. Asked of the
     * Runner rather than of the methods that call it, because that is the point of
     * having one -- a method added anywhere cannot leave this out.
     *
     * @param list<string> $arguments
     */
    #[DataProvider('writes')]
    public function testAWriteTellsWhoeverKeptAnAnswer(string $method, array $arguments): void
    {
        $runner = new Runner(self::project(), new RecordingContainer());
        $told = 0;
        $runner->onWrite(static function () use (&$told): void { ++$told; });

        $runner->{$method}(...$arguments);

        self::assertSame(1, $told, sprintf('%s() wrote and said nothing about it.', $method));
    }

    /** @return iterable<string, array{string, list<string>}> */
    public static function writes(): iterable
    {
        yield 'at the project' => ['work', ['fetch', 'origin']];
        yield 'in a worktree' => ['workInWorktree', ['demo', 'merge', '--ff-only']];
    }

    /**
     * And the other way: asking costs nothing. A question that dropped what was
     * read would make the keeping pointless -- the page asks a dozen of them for
     * every look.
     *
     * @param list<string> $arguments
     */
    #[DataProvider('questions')]
    public function testAQuestionTellsNobody(string $method, array $arguments): void
    {
        $runner = new Runner(self::project(), new RecordingContainer());
        $told = 0;
        $runner->onWrite(static function () use (&$told): void { ++$told; });

        $runner->{$method}(...$arguments);

        self::assertSame(0, $told, sprintf('%s() only asked, and said something had been written.', $method));
    }

    /** @return iterable<string, array{string, list<string>}> */
    public static function questions(): iterable
    {
        yield 'at the project' => ['run', ['rev-parse', 'HEAD']];
        yield 'in a worktree' => ['inWorktree', ['demo', 'rev-parse', 'HEAD']];
        yield 'in a checkout' => ['inCheckout', ['demo', 'status']];
    }

    /**
     * The two ends together, through the door every caller uses: what git said is
     * answered again from what was kept, and a write puts an end to that.
     */
    public function testWhatWasReadIsAskedAgainOnceSomethingWroteOverIt(): void
    {
        $web = new RecordingContainer();
        $web->answer('worktree list --porcelain', "\x1ehead\nmain\n");
        $git = Assembled::git(self::project(), $web, self::locks());

        self::assertSame('main', $git->currentBranch());
        // Asked twice and read once: that is what the keeping is for.
        self::assertSame('main', $git->currentBranch());
        self::assertSame(1, self::asked($web), 'the kept answer was not used');

        $git->deleteBranch('gone');

        self::assertSame('main', $git->currentBranch());
        self::assertSame(2, self::asked($web), 'the answer from before the write was handed out again');
    }

    private static function asked(RecordingContainer $web): int
    {
        return \count(array_filter(
            $web->lines(),
            static fn (string $line): bool => str_contains($line, 'worktree list --porcelain'),
        ));
    }

    /**
     * @return list<\ReflectionProperty>
     */
    private static function caches(): array
    {
        $caches = [];
        foreach ((new \ReflectionClass(Facts::class))->getProperties() as $property) {
            if (!$property->isReadOnly() && !$property->isStatic()) {
                $caches[] = $property;
            }
        }

        return $caches;
    }

    /**
     * Something the field can hold that is not what it starts as. A type this does
     * not know about fails rather than passing quietly, because a field skipped
     * here is a field the test above stops covering.
     */
    private static function stale(\ReflectionProperty $property): mixed
    {
        $type = $property->getType();
        if (!$type instanceof \ReflectionNamedType) {
            self::fail(sprintf('"%s" has a type this test cannot make a value for.', $property->getName()));
        }

        $named = $type->getName();
        if (!class_exists($named)) {
            return match ($named) {
                'string' => 'stale',
                'array' => ['stale'],
                'int' => 1,
                'bool' => true,
                default => self::fail(sprintf('"%s" is a %s, which this test cannot make a value for.', $property->getName(), $named)),
            };
        }

        return (new \ReflectionClass($named))->newInstanceWithoutConstructor();
    }

    private static function project(): Project
    {
        return new Project(
            projectRoot: sys_get_temp_dir() . '/branchery-git-cache',
            hostProjectRoot: sys_get_temp_dir() . '/branchery-git-cache',
            projectName: 'blog',
            worktrees: '.worktrees',
            domain: 'ddev.site',
        );
    }

    private static function locks(): Locks
    {
        return new Locks(self::project(), new ManagedFiles((int) getmyuid(), (int) getmygid()));
    }
}
