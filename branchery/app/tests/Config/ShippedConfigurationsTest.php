<?php

declare(strict_types=1);

namespace App\Tests\Config;

use App\Config\Recipes;
use App\Config\WorktreeContext;
use App\Database\ProjectDatabase;
use App\ManagedFiles;
use App\Tests\Fake\RecordingContainer;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * The configurations this image ships. They are files rather than classes so a
 * project can read and copy them, which makes them worth exactly two checks:
 * that every one can be read at all -- a broken one refuses every operation of
 * every project that named it -- and that their lines only reach the worktree
 * through names the environment actually carries.
 */
final class ShippedConfigurationsTest extends TestCase
{
    private const DIRECTORY = __DIR__ . '/../../defaults';

    public function testThereIsOneForTheProjectsThisWasWrittenFor(): void
    {
        self::assertSame(['composer', 'symfony', 'typo3-app', 'typo3-core'], $this->recipes()->names());
    }

    #[DataProvider('shipped')]
    public function testEveryShippedConfigurationCanBeRead(string $name): void
    {
        $recipe = $this->recipes()->shipped($name);

        self::assertFalse($recipe->isEmpty(), $name . ' says nothing at all');
        // What it is built on is nothing: these are the bottom of the stack, and
        // one that named another would be a chain nobody can follow.
        self::assertNull($recipe->profile);
    }

    /**
     * The one line in a shipped configuration the build is allowed to survive. A
     * core branch whose lockfile the container's npm cannot read is one whose work
     * is PHP. Written down here because it is a decision and not a detail: a
     * refactoring that drops the flag turns every such branch back into a build
     * that stops.
     */
    public function testTheAssetToolchainOfTheCoreIsWorthHavingAndNotWorthTheBuild(): void
    {
        $install = $this->recipes()->shipped('typo3-core')->plan('install');
        $optional = [];
        foreach ($install as $command) {
            if ($command !== null) {
                $optional[$command->line] = $command->optional;
            }
        }

        self::assertSame(
            [
                '$BRANCHERY_PHP /usr/local/bin/composer install --no-interaction --no-progress' => false,
                'cd Build && npm ci --no-audit --no-fund' => true,
            ],
            $optional,
        );
    }

    /**
     * Every $BRANCHERY_… a shipped line reaches for is one the environment carries.
     * A name that is not there arrives in a shell as the empty string, which is how
     * a configuration file writes an installation pointed at no database and
     * reports success.
     */
    #[DataProvider('shipped')]
    public function testItAsksOnlyForWhatTheEnvironmentCarries(string $name): void
    {
        $known = array_keys($this->context()->environment());
        $file = (string) file_get_contents(self::DIRECTORY . '/' . $name . '.yaml');
        preg_match_all('/\$\{?(BRANCHERY_[A-Z_]+)\}?/', $file, $found);

        foreach (array_unique($found[1]) as $used) {
            self::assertContains($used, $known, sprintf('%s.yaml asks for $%s', $name, $used));
        }
    }

    /** @return iterable<array{string}> */
    public static function shipped(): iterable
    {
        foreach (['composer', 'symfony', 'typo3-app', 'typo3-core'] as $name) {
            yield $name => [$name];
        }
    }

    private function recipes(): Recipes
    {
        return new Recipes(sys_get_temp_dir(), self::DIRECTORY);
    }

    private function context(): WorktreeContext
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
        );
    }
}
