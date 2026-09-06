<?php

declare(strict_types=1);

namespace App\Tests\Operation;

use App\Operation\LockFile;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * The question composer asks of a lock file, asked before the build: the one
 * case that stopped five forks in an afternoon -- a package required and not
 * locked -- and the cases that must not be mistaken for it.
 */
#[CoversClass(LockFile::class)]
final class LockFileTest extends TestCase
{
    private const string MANIFEST = <<<'JSON'
        {
            "require": { "php": "^8.2", "ext-json": "*", "typo3/cms-core": "^13.4", "vendor/provided": "*", "vendor/replaced": "*" },
            "require-dev": { "a9f/typo3-fractor": "^0.5", "composer-plugin-api": "^2" }
        }
        JSON;

    private const string LOCK = <<<'JSON'
        {
            "content-hash": "irrelevant here",
            "packages": [
                { "name": "typo3/cms-core", "version": "v13.4.0" },
                { "name": "vendor/stand-in", "version": "1.0.0", "provide": { "vendor/provided": "1.0.0" }, "replace": { "vendor/replaced": "self.version" } }
            ],
            "packages-dev": []
        }
        JSON;

    public function testNamesWhatIsRequiredAndNotLocked(): void
    {
        self::assertSame(['a9f/typo3-fractor'], LockFile::missing(self::MANIFEST, self::LOCK));
    }

    /** "--no-dev" installs without the development requirements. */
    public function testLeavesTheDevelopmentRequirementsOutWhereTheInstallDoes(): void
    {
        self::assertSame([], LockFile::missing(self::MANIFEST, self::LOCK, false));
    }

    public function testCountsAPackageLockedUnderAnotherCase(): void
    {
        $lock = str_replace('typo3/cms-core', 'TYPO3/CMS-Core', self::LOCK);

        self::assertSame(['a9f/typo3-fractor'], LockFile::missing(self::MANIFEST, $lock));
    }

    /** What cannot be read is composer's to complain about, and it does. */
    public function testSaysNothingAboutFilesItCannotRead(): void
    {
        self::assertSame([], LockFile::missing('{ not json', self::LOCK));
        self::assertSame([], LockFile::missing(self::MANIFEST, ''));
    }
}
