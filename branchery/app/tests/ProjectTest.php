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

    /**
     * What the project has beside its own name, every worktree has under its own:
     * a site served at a second domain has a second address in the worktree too,
     * derived from the hostname the way the data names it. DDEV appends its domain
     * to what a project asks for, so the label is what stands before that -- and
     * a hostname the project put under its own name loses that as well.
     */
    public function testTheProjectsOtherHostnamesBecomeAddressesOfEveryWorktree(): void
    {
        $project = new Project('/var/www/html', '/home/dev/blog', 'blog', '.worktrees', 'ddev.site', [
            'blog.ddev.site',
            '*.blog.ddev.site',
            'site-b.ddev.site',
            'Shop.blog.ddev.site ',
            'shop.example.test',
            '',
        ]);

        self::assertSame(
            ['site-b' => 'site-b.ddev.site', 'shop' => 'shop.blog.ddev.site', 'shop-example-test' => 'shop.example.test'],
            $project->otherHostnames(),
        );
        self::assertSame(
            [
                'site-b' => 'https://my-fix-site-b.blog.ddev.site/',
                'shop' => 'https://my-fix-shop.blog.ddev.site/',
                'shop-example-test' => 'https://my-fix-shop-example-test.blog.ddev.site/',
            ],
            $project->otherUrlsFor('my-fix'),
        );
        self::assertSame([], $this->project()->otherUrlsFor('my-fix'));
    }

    /**
     * A hostname the project put directly under its own name is what the wildcard
     * serves for a worktree of that name, so the project keeps the name. One under
     * DDEV's domain meets no worktree and reserves nothing.
     */
    public function testRefusesAWorktreeNamedAfterAnAddressOfTheProject(): void
    {
        $project = new Project('/var/www/html', '/home/dev/blog', 'blog', '.worktrees', 'ddev.site', [
            'blog.ddev.site', '*.blog.ddev.site', 'site-b.ddev.site', 'shop.blog.ddev.site',
        ]);

        self::assertSame(['shop'], $project->reservedNames());
        self::assertSame('site-b', $project->assertNotItself('site-b'));

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('"shop" is an address of the project itself (shop.blog.ddev.site)');
        $project->assertNotItself('shop');
    }

    /**
     * The name a branch is made into, which is a directory, an address and a
     * database name. The interface makes the same one to offer it before the
     * press -- frontend/dom.ts, where these four names stand again, because a
     * reader shown one name and given another has no way of telling where that
     * happened.
     */
    public function testABranchBecomesTheNameTheInterfaceOffersForIt(): void
    {
        self::assertSame('feature-cache-headers', Project::slug('Feature/Cache-Headers'));
        self::assertSame('release-13-4', Project::slug('release/13.4'));
        // Lowered a byte at a time, which is what leaves a letter outside ASCII
        // standing to be replaced as a separator rather than becoming one.
        self::assertSame('task-nderung', Project::slug('TASK/ÄNDERUNG'));
        self::assertSame('', Project::slug('İ'));
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
