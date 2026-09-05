<?php

declare(strict_types=1);

namespace App\Tests;

use App\Project;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Where things are, asked of the one place that knows. The link from the
 * docroots to a worktree is relative, because the directory it sits in has a
 * different absolute path in each of the two containers that read it -- and one
 * "../" too few is a worktree whose address answers 403 with nothing saying why.
 */
#[CoversClass(Project::class)]
final class ProjectTest extends TestCase
{
    private function project(string $worktrees = '.worktrees'): Project
    {
        return new Project('/var/www/html', '/home/dev/blog', 'blog', $worktrees);
    }

    public function testTheLinkFromTheDocrootsReachesTheWorktree(): void
    {
        $project = $this->project();
        $from = $project->docrootsDirectory();

        self::assertSame(
            $project->worktreeDirectory('demo'),
            self::resolved($from . '/demo', $project->docrootLinkTarget('demo')),
        );
    }

    /** The name is a setting, so the link has to follow it wherever it goes. */
    public function testTheLinkFollowsTheNameTheDirectoryWasGiven(): void
    {
        $project = $this->project('elsewhere');
        $from = $project->docrootsDirectory();

        self::assertSame(
            $project->worktreeDirectory('demo'),
            self::resolved($from . '/demo', $project->docrootLinkTarget('demo')),
        );
    }

    /**
     * The name is a hostname, a directory and a database name at once -- and ".."
     * is a directory. What is refused here is refused on both doors.
     */
    public function testANameIsWhatAllThreeTake(): void
    {
        self::assertSame('my-fix', Project::assertName('my-fix'));
        self::assertSame('13-4', Project::assertName('13-4'));

        foreach (['..', '.', '', 'My Feature', '-fix', 'a/b', 'my_fix'] as $name) {
            try {
                Project::assertName($name);
                self::fail(sprintf('"%s" was taken for a name.', $name));
            } catch (\InvalidArgumentException $refusal) {
                self::assertStringContainsString('is not a name a worktree can have', $refusal->getMessage());
            }
        }
    }

    /**
     * The domain is DDEV's to say: a project set up under another one answers
     * there, and an address built from the usual one is served by nothing.
     */
    public function testTheAddressesFollowTheDomainDdevWasGiven(): void
    {
        $project = new Project('/var/www/html', '/home/dev/blog', 'blog', '.worktrees', 'ddev.local');

        self::assertSame('blog.ddev.local', $project->tld());
        self::assertSame('ddev.local', $project->domain());
        self::assertSame('https://my-fix.blog.ddev.local/', $project->urlFor('my-fix'));
        self::assertSame('blog.ddev.site', $this->project()->tld());
    }

    public function testBothViewsOfAWorktreeNameTheSamePlaceUnderTheirOwnRoot(): void
    {
        $project = $this->project();

        self::assertSame('/var/www/html/.worktrees/demo', $project->worktreeDirectory('demo'));
        self::assertSame('/home/dev/blog/.worktrees/demo', $project->hostWorktreeDirectory('demo'));
    }

    /**
     * The project checkout is found first at every door that takes a name, so a
     * worktree of the same name would never be reached.
     */
    public function testRefusesAWorktreeNamedAfterItself(): void
    {
        $project = new Project('/var/www/html', '/home/dev/blog', 'blog', '.worktrees');

        self::assertSame('blog-2', $project->assertNotItself('blog-2'));

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('"blog" is the name of the project itself');
        $project->assertNotItself('blog');
    }

    /** Where a relative link placed at $link actually points. */
    private static function resolved(string $link, string $target): string
    {
        $parts = [];
        foreach (explode('/', \dirname($link) . '/' . $target) as $part) {
            if ($part === '' || $part === '.') {
                continue;
            }
            if ($part === '..') {
                array_pop($parts);

                continue;
            }
            $parts[] = $part;
        }

        return '/' . implode('/', $parts);
    }
}
