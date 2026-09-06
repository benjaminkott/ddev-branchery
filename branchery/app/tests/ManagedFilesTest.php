<?php

declare(strict_types=1);

namespace App\Tests;

use App\ManagedFiles;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;

/**
 * The directories Branchery creates land inside checkouts the user works in.
 * They have to carry their own .gitignore, or every worktree starts out dirty
 * with files nobody wrote.
 */
final class ManagedFilesTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-test-' . bin2hex(random_bytes(4));
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->root);
    }

    public function testAnOwnDirectoryIgnoresItselfWholesale(): void
    {
        $files = new ManagedFiles(0, 0);
        $directory = $this->root . '/.worktrees';

        $files->ensureIgnoredDirectory($directory);

        self::assertDirectoryExists($directory);
        $rules = file_get_contents($directory . '/.gitignore');
        self::assertIsString($rules);
        // The rule covers the file itself, so git never reports it either.
        self::assertContains('*', array_map('trim', explode("\n", $rules)));
    }

    public function testAnExistingGitignoreIsTheProjectsAndStays(): void
    {
        $files = new ManagedFiles(0, 0);
        $directory = $this->root . '/.vscode';
        (new Filesystem())->dumpFile($directory . '/.gitignore', "/scratch\n");

        $files->ensureIgnoredDirectory($directory);

        self::assertSame("/scratch\n", file_get_contents($directory . '/.gitignore'));
    }
}
