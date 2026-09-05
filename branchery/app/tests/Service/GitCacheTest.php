<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\Git;
use App\Service\Locks;
use App\Service\ManagedFiles;
use App\Service\Project;
use App\Tests\Fake\RecordingContainer;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * That what Git remembers is dropped wherever it writes.
 *
 * Every answer this class keeps is true only until git moves, and it is this
 * class that moves it. A field added to the top and forgotten in forget(), or a
 * new call that writes without dropping what was read before it, produces no
 * type error, no analyser finding and no failing test elsewhere -- it produces
 * a page showing a branch that has since moved. Both halves of that rule are
 * held here, because neither is visible in anything the compiler reads.
 */
#[CoversClass(Git::class)]
final class GitCacheTest extends TestCase
{
    /**
     * Read as a property of the class rather than as a list to keep in step: what
     * this class remembers is exactly what it does not hold readonly, so a new
     * cache is found by the same rule that finds the ones already here.
     */
    public function testForgetDropsEverythingThisClassRemembers(): void
    {
        $git = self::git();
        $defaults = (new \ReflectionClass(Git::class))->getDefaultProperties();

        $remembered = self::caches();
        self::assertNotSame([], $remembered, 'no cached fields were found; this test has stopped testing anything');

        foreach ($remembered as $property) {
            $property->setValue($git, self::stale($property));
        }

        (new \ReflectionMethod(Git::class, 'forget'))->invoke($git);

        foreach ($remembered as $property) {
            self::assertSame(
                $defaults[$property->getName()] ?? null,
                $property->getValue($git),
                sprintf('forget() left "%s" as it was; add it there or a moved branch goes on being reported as it stood.', $property->getName()),
            );
        }
    }

    /**
     * The other half: a method that makes git write and does not drop what was
     * read before it leaves this class answering out of the state it just changed.
     * Read out of the source, because whether a call is made is not a thing an
     * instance can be asked.
     */
    public function testEveryMethodThatMakesGitWriteDropsWhatItRemembered(): void
    {
        $reflection = new \ReflectionClass(Git::class);
        $file = (string) $reflection->getFileName();
        $lines = explode("\n", (string) file_get_contents($file));

        $writing = [];
        foreach ($reflection->getMethods() as $method) {
            if ($method->getDeclaringClass()->getName() !== Git::class) {
                continue;
            }
            $body = implode("\n", \array_slice(
                $lines,
                (int) $method->getStartLine() - 1,
                (int) $method->getEndLine() - (int) $method->getStartLine() + 1,
            ));
            // The two helpers everything writing goes through. A method that calls
            // one of them is a method that moved something.
            if (!str_contains($body, '$this->work(') && !str_contains($body, '$this->workInWorktree(')) {
                continue;
            }
            $writing[] = $method->getName();
            self::assertStringContainsString(
                '$this->forget()',
                $body,
                sprintf('%s() makes git write and keeps what was read before it.', $method->getName()),
            );
        }

        self::assertNotSame([], $writing, 'nothing was found that writes; this test has stopped testing anything');
    }

    /**
     * @return list<\ReflectionProperty>
     */
    private static function caches(): array
    {
        $caches = [];
        foreach ((new \ReflectionClass(Git::class))->getProperties() as $property) {
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

    private static function git(): Git
    {
        $root = sys_get_temp_dir() . '/branchery-git-cache';
        $project = new Project(
            projectRoot: $root,
            hostProjectRoot: $root,
            projectName: 'blog',
            worktrees: '.worktrees',
            domain: 'ddev.site',
        );

        return new Git(
            $project,
            new RecordingContainer(),
            new Locks($project, new ManagedFiles((int) getmyuid(), (int) getmygid())),
        );
    }
}
