<?php

declare(strict_types=1);

namespace App\Tests\Config;

use App\Config\WorktreeContext;
use App\Database\ProjectDatabase;
use App\ManagedFiles;
use App\Tests\Fake\RecordingContainer;
use PHPUnit\Framework\TestCase;

/**
 * What every command of an operation is told about the worktree it runs for.
 * These names are a promise made in the documentation: a project whose sites
 * are under version control reads its address out of them, so renaming one
 * breaks a project nobody here can see.
 */
final class WorktreeEnvironmentTest extends TestCase
{
    public function testItCarriesTheNamesAProjectIsPromised(): void
    {
        $environment = $this->context()->environment();

        self::assertSame('my-fix', $environment['BRANCHERY_NAME']);
        self::assertSame('bugfix/my-fix', $environment['BRANCHERY_BRANCH']);
        self::assertSame('https://my-fix.blog.ddev.site/', $environment['BRANCHERY_URL']);
        self::assertSame('my-fix.blog.ddev.site', $environment['BRANCHERY_HOST']);
        self::assertSame('branchery_my_fix', $environment['BRANCHERY_DATABASE']);
        self::assertSame('vendor/bin', $environment['BRANCHERY_BIN']);
        self::assertSame('public', $environment['BRANCHERY_DOCROOT']);
        self::assertSame('php', $environment['BRANCHERY_PHP']);
        // The plain names where the worktree builds with the container's own Node,
        // which is what a recipe line would have written anyway.
        self::assertSame('node', $environment['BRANCHERY_NODE']);
        self::assertSame('npm', $environment['BRANCHERY_NPM']);
        // The tld as a pattern, which is what a trusted-hosts setting wants.
        self::assertSame('.*\\.blog\\.ddev\\.site', $environment['BRANCHERY_HOSTS_PATTERN']);
    }

    /**
     * A worktree that builds with a version of its own is told where it is, by the
     * path -- there is nothing else on the container that names it.
     */
    public function testAVersionOfItsOwnIsNamedByItsPath(): void
    {
        $environment = $this->context('/mnt/ddev-global-cache/n_prefix/blog-web/n/versions/node/22.11.0/bin')->environment();

        self::assertSame('/mnt/ddev-global-cache/n_prefix/blog-web/n/versions/node/22.11.0/bin/node', $environment['BRANCHERY_NODE']);
        self::assertSame('/mnt/ddev-global-cache/n_prefix/blog-web/n/versions/node/22.11.0/bin/npm', $environment['BRANCHERY_NPM']);
    }

    /** What a site is found by is the host, and the host alone. */
    public function testItReadsTheHostOutOfTheAddress(): void
    {
        self::assertSame('my-fix.blog.ddev.site', WorktreeContext::hostOf('https://my-fix.blog.ddev.site/'));
        self::assertSame('blog.ddev.site', WorktreeContext::hostOf('https://blog.ddev.site/some/path'));
        self::assertSame('', WorktreeContext::hostOf(''));
    }

    private function context(?string $nodeDirectory = null): WorktreeContext
    {
        $web = new RecordingContainer();

        return new WorktreeContext(
            name: 'my-fix',
            branch: 'bugfix/my-fix',
            url: 'https://my-fix.blog.ddev.site/',
            directory: '/var/www/html/.worktrees/my-fix',
            hostDirectory: '/var/www/html/.worktrees/my-fix',
            phpBinary: 'php',
            binDirectory: 'vendor/bin',
            docroot: 'public',
            database: new ProjectDatabase($web),
            databaseName: 'branchery_my_fix',
            web: $web,
            files: new ManagedFiles(0, 0),
            tld: 'blog.ddev.site',
            nodeDirectory: $nodeDirectory,
        );
    }
}
