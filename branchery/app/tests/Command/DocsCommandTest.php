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
        (new Filesystem())->mkdir([$this->pages, $this->pages . '/use-branchery', $this->pages . '/reference']);
        // Shaped like the manual is: the sections stand at the root and their
        // pages inside them, so a toctree entry is read from the directory of
        // the page that named it.
        file_put_contents($this->pages . '/index.rst', <<<'RST'
            =========
            Branchery
            =========

            ..  toctree::
                :hidden:

                getting-started
                use-branchery
                reference
            RST);
        file_put_contents($this->pages . '/getting-started.rst', "===============\nGetting started\n===============\n\nThe first worktree.\n");
        file_put_contents($this->pages . '/use-branchery.rst', <<<'RST'
            =============
            Use Branchery
            =============

            ..  toctree::
                :hidden:

                use-branchery/operations
            RST);
        file_put_contents($this->pages . '/use-branchery/operations.rst', "===================\nWorktree operations\n===================\n\nWhat ``add <branch>`` does.\n");
        file_put_contents($this->pages . '/reference.rst', <<<'RST'
            =========
            Reference
            =========

            ..  toctree::
                :hidden:

                reference/configuration
            RST);
        file_put_contents($this->pages . '/reference/configuration.rst', <<<'RST'
            =============
            Configuration
            =============

            ..  toctree::
                :hidden:

                moments

            Written in ``.ddev/branchery.yaml``, key by key: ``docroot: <directory>``.
            RST);
        file_put_contents($this->pages . '/reference/moments.rst', "=======\nMoments\n=======\n\nWhen a recipe line runs.\n");
        // Named by no tree, and sorting before "moments" by name: it is what
        // tells a reading order from an alphabetical list.
        file_put_contents($this->pages . '/reference/appendix.rst', "========\nAppendix\n========\n\nThe rest.\n");
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
        // With the section it stands in, which is what the slug is now.
        self::assertStringContainsString('use-branchery/operations', $tester->getDisplay());
        self::assertStringContainsString('reference/configuration', $tester->getDisplay());
        self::assertMatchesRegularExpression(
            '#getting-started.*use-branchery.*use-branchery/operations.*reference.*reference/configuration.*reference/moments#s',
            $tester->getDisplay(),
        );
    }

    /**
     * The reading order is the trees' and not the alphabet's, and an entry is
     * read from the directory of the page that named it -- "moments" inside
     * reference/configuration.rst is the page beside it, not one at the root.
     * A page no tree names still follows, which is where "appendix" stands
     * although its name would put it first.
     */
    public function testTheOrderIsTheOneTheTreesGive(): void
    {
        $tester = $this->tester();
        $tester->execute([]);

        self::assertMatchesRegularExpression(
            '#reference/configuration.*reference/moments.*reference/appendix#s',
            $tester->getDisplay(),
        );
    }

    public function testAPageComesOutAsItWasWritten(): void
    {
        $tester = $this->tester();

        self::assertSame(0, $tester->execute(['page' => 'reference/configuration']));
        self::assertStringContainsString('.ddev/branchery.yaml', $tester->getDisplay());
        // Angle brackets as they stand in the file: the console formatter would
        // otherwise take "<name>" for markup and drop it.
        self::assertStringContainsString('<directory>', $tester->getDisplay());
    }

    /**
     * A page has a name, and the path to it is something to copy rather than to
     * remember -- so the name alone reaches it wherever it can mean one page.
     */
    public function testTheNameAloneReachesAPage(): void
    {
        $tester = $this->tester();

        self::assertSame(0, $tester->execute(['page' => 'configuration']));
        self::assertStringContainsString('.ddev/branchery.yaml', $tester->getDisplay());
    }

    /**
     * What may be built into a path is what a page name is made of, so nothing
     * outside the manual can be asked for.
     */
    public function testNothingOutsideTheManualCanBeAskedFor(): void
    {
        file_put_contents(\dirname($this->pages) . '/branchery-elsewhere.rst', 'not the manual');

        try {
            $tester = $this->tester();

            self::assertSame(1, $tester->execute(['page' => '../branchery-elsewhere']));
            self::assertStringNotContainsString('not the manual', $tester->getDisplay());
        } finally {
            @unlink(\dirname($this->pages) . '/branchery-elsewhere.rst');
        }
    }

    public function testANameThatIsNoPageSaysSo(): void
    {
        $tester = $this->tester();

        self::assertSame(1, $tester->execute(['page' => 'nothing-here']));
        self::assertStringContainsString('no page called "nothing-here"', $tester->getDisplay());
    }
}
