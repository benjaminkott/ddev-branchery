<?php

declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\DocsCommand;
use App\Docs;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\Filesystem\Filesystem;

/**
 * The manual, reachable from a shell. Read out of the same files the site is
 * rendered from, so what this holds to is the way in: the list names every page
 * in the order the manual reads, and a page comes out as it was written.
 */
#[CoversClass(DocsCommand::class)]
final class DocsCommandTest extends TestCase
{
    private string $pages;

    protected function setUp(): void
    {
        $this->pages = sys_get_temp_dir() . '/branchery-docs-' . bin2hex(random_bytes(4));
        (new Filesystem())->mkdir($this->pages);
        // The reading order is the manual's own tree of contents, so the fixture
        // writes both levels: without them pages come out by name.
        file_put_contents($this->pages . '/index.rst', <<<'RST'
            =========
            Branchery
            =========

            ..  toctree::
                :hidden:

                getting-started
                use-branchery
                configuration
            RST);
        file_put_contents($this->pages . '/getting-started.rst', "===============\nGetting started\n===============\n\nThe first worktree.\n");
        file_put_contents($this->pages . '/use-branchery.rst', <<<'RST'
            =============
            Use Branchery
            =============

            ..  toctree::
                :hidden:

                operations
            RST);
        file_put_contents($this->pages . '/operations.rst', "===================\nWorktree operations\n===================\n\nWhat ``add <branch>`` does.\n");
        file_put_contents($this->pages . '/configuration.rst', "=============\nConfiguration\n=============\n\nWritten in ``.ddev/branchery.yaml``, key by key: ``docroot: <directory>``.\n");
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->pages);
    }

    private function tester(): CommandTester
    {
        return new CommandTester(new DocsCommand(new Docs($this->pages)));
    }

    public function testWithoutAPageTheListIsPrinted(): void
    {
        $tester = $this->tester();

        self::assertSame(0, $tester->execute([]));
        self::assertStringContainsString('operations', $tester->getDisplay());
        self::assertStringContainsString('configuration', $tester->getDisplay());
        self::assertMatchesRegularExpression('/getting-started.*use-branchery.*operations.*configuration/s', $tester->getDisplay());
    }

    public function testAPageComesOutAsItWasWritten(): void
    {
        $tester = $this->tester();

        self::assertSame(0, $tester->execute(['page' => 'configuration']));
        self::assertStringContainsString('.ddev/branchery.yaml', $tester->getDisplay());
        // Angle brackets as they stand in the file: the console formatter would
        // otherwise take "<name>" for markup and drop it.
        self::assertStringContainsString('<directory>', $tester->getDisplay());
    }

    public function testANameThatIsNoPageSaysSo(): void
    {
        $tester = $this->tester();

        self::assertSame(1, $tester->execute(['page' => 'nothing-here']));
        self::assertStringContainsString('no page called "nothing-here"', $tester->getDisplay());
    }
}
