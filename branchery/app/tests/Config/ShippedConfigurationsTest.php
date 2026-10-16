<?php

declare(strict_types=1);

namespace App\Tests\Config;

use App\Config\Recipes;
use App\ManagedFiles;
use App\Tests\Fake\RecordingContainer;
use App\Web\DatabaseServer;
use App\Worktree\Place;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Process\Process;

/**
 * The configurations this image ships. They are files rather than classes so a
 * project can read and copy them: a broken one refuses every operation of every
 * project that named it, and a line reaching for a name the environment does not
 * carry writes an installation pointed at nothing.
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
        self::assertFalse($this->recipes()->shipped($name)->isEmpty(), $name . ' says nothing at all');
    }

    /**
     * These are the bottom of the stack, and a chain of them is one nobody can
     * follow. Asked of the reader rather than of the shipped files as they stand: the
     * key is in the grammar they are written in, so a file naming one would be read
     * and would quietly do nothing.
     */
    public function testAShippedConfigurationBuiltOnAnotherIsRefused(): void
    {
        $directory = sys_get_temp_dir() . '/branchery-shipped-' . bin2hex(random_bytes(4));
        mkdir($directory);
        file_put_contents($directory . '/chained.yaml', "profile: typo3-app\ndocroot: web\n");

        try {
            $this->expectException(\RuntimeException::class);
            $this->expectExceptionMessageMatches('/"chained".*"typo3-app".*built on nothing/s');
            (new Recipes(sys_get_temp_dir(), $directory))->shipped('chained');
        } finally {
            unlink($directory . '/chained.yaml');
            rmdir($directory);
        }
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
                'rm -rf typo3temp/var/cache' => false,
                '$BRANCHERY_PHP /usr/local/bin/composer install --no-interaction --no-progress' => false,
                'cd Build && npm ci --no-audit --no-fund' => true,
            ],
            $optional,
        );
    }

    /**
     * TYPO3 keys its compiled container by the installed packages and not by the
     * code, so a worktree rebuilt on other code started "setup" on the container
     * of the old one and died in a constructor. "cache:flush" needs that same
     * container, which is why it is a removal and why it comes first.
     */
    #[DataProvider('typo3')]
    public function testATypo3WorktreeIsBuiltWithoutTheCodeItWasCompiledFrom(string $name, string $cache): void
    {
        $line = $this->recipes()->shipped($name)->plan('install')[0]->line ?? '';
        $filesystem = new Filesystem();
        $directory = $filesystem->tempnam(sys_get_temp_dir(), 'branchery-');
        $filesystem->remove($directory);
        $filesystem->dumpFile($directory . '/' . $cache . '/code/di/DependencyInjectionContainer_stale.php', '<?php');

        try {
            (new Process(['bash', '-c', $line], $directory))->mustRun();
            self::assertDirectoryDoesNotExist($directory . '/' . $cache);

            (new Process(['bash', '-c', $line], $directory))->mustRun();
        } finally {
            $filesystem->remove($directory);
        }
    }

    /** @return iterable<array{string, string}> */
    public static function typo3(): iterable
    {
        yield 'typo3-app' => ['typo3-app', 'var/cache'];
        yield 'typo3-core' => ['typo3-core', 'typo3temp/var/cache'];
    }

    /**
     * The core ignores its root .htaccess and only "setup" writes one, so a
     * worktree that took the project's data served nothing but its root page.
     */
    public function testACoreWorktreeIsServedWithTheHtaccessOfItsBranch(): void
    {
        $line = $this->recipes()->shipped('typo3-core')->plan('configure')[0]->line ?? '';
        $template = 'typo3/sysext/install/Resources/Private/FolderStructureTemplateFiles/root-htaccess';
        $filesystem = new Filesystem();
        $directory = $filesystem->tempnam(sys_get_temp_dir(), 'branchery-');
        $filesystem->remove($directory);
        $filesystem->dumpFile($directory . '/' . $template, 'RewriteEngine On');

        try {
            (new Process(['bash', '-c', $line], $directory))->mustRun();
            self::assertStringEqualsFile($directory . '/.htaccess', 'RewriteEngine On');

            $filesystem->dumpFile($directory . '/.htaccess', 'edited');
            (new Process(['bash', '-c', $line], $directory))->mustRun();
            self::assertStringEqualsFile($directory . '/.htaccess', 'edited');
        } finally {
            $filesystem->remove($directory);
        }
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

    private function context(): Place
    {
        $web = new RecordingContainer();

        return new Place(
            name: 'my-fix',
            branch: 'bugfix/my-fix',
            url: 'https://my-fix.blog.ddev.site/',
            directory: '/var/www/html/.worktrees/my-fix',
            hostDirectory: '/var/www/html/.worktrees/my-fix',
            phpBinary: 'php',
            binDirectory: 'vendor/bin',
            docroot: 'public',
            database: new DatabaseServer($web),
            databaseName: 'branchery_my_fix',
            web: $web,
            files: new ManagedFiles(0, 0),
            tld: 'blog.ddev.site',
        );
    }
}
