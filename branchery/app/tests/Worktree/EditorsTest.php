<?php

declare(strict_types=1);

namespace App\Tests\Worktree;

use App\Config\Build;
use App\Config\Recipe;
use App\Project;
use App\Worktree\Editors;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;

/**
 * Which editors a worktree is offered in, and at what address.
 *
 * Both halves are ones nobody reads before pressing: an address that opens the
 * wrong thing, or nothing, is a window onto nothing -- and an editor offered
 * that this machine has not got is a door into the same. So both the marks and
 * the filling of a template are held to here.
 */
#[CoversClass(Editors::class)]
final class EditorsTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-editors-' . bin2hex(random_bytes(4));
        (new Filesystem())->mkdir($this->root);
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->root);
    }

    public function testACheckoutNobodyHasOpenedIsOfferedInNothing(): void
    {
        self::assertSame([], $this->editors('Ubuntu')->of('/home/dev/blog', self::says(null)));
    }

    /**
     * In the project and nowhere else: every worktree carries a .vscode of
     * Branchery's own making -- see Surroundings -- so a mark read there would
     * say the same thing about every machine there is.
     */
    public function testTheMarkAnEditorLeavesIsWhatOffersIt(): void
    {
        (new Filesystem())->mkdir($this->root . '/.vscode');

        self::assertSame(
            [['name' => 'VS Code', 'url' => 'vscode://vscode-remote/wsl+Ubuntu/home/dev/blog']],
            $this->editors('Ubuntu')->of('/home/dev/blog', self::says(null)),
        );
    }

    public function testTheAddressWithoutADistributionIsTheOneThatNeedsNone(): void
    {
        (new Filesystem())->mkdir($this->root . '/.vscode');

        self::assertSame(
            [['name' => 'VS Code', 'url' => 'vscode://file/home/dev/blog']],
            $this->editors('')->of('/home/dev/blog', self::says(null)),
        );
    }

    public function testWhatWindowsCallsTheDirectoryIsWhatAnEditorOutsideTheDistributionIsGiven(): void
    {
        (new Filesystem())->mkdir($this->root . '/.idea');

        self::assertSame(
            [['name' => 'PhpStorm', 'url' => 'phpstorm://open?file=\\\\wsl$\Ubuntu\home\dev\blog']],
            $this->editors('Ubuntu')->of('/home/dev/blog', self::says(null)),
        );
    }

    public function testAProjectThatNamesItsEditorsIsNotLookedUpAfter(): void
    {
        // A mark that would offer VS Code, and a file that says otherwise.
        (new Filesystem())->mkdir($this->root . '/.vscode');

        self::assertSame(
            [['name' => 'Zed', 'url' => 'zed://file/home/dev/blog']],
            $this->editors('Ubuntu')->of('/home/dev/blog', self::says("editors:\n  - Zed: 'zed://file{path}'\n")),
        );
    }

    public function testAnEmptyListIsAProjectThatOffersNone(): void
    {
        (new Filesystem())->mkdir($this->root . '/.vscode');

        self::assertSame([], $this->editors('Ubuntu')->of('/home/dev/blog', self::says("editors: []\n")));
    }

    public function testAnAddressThisMachineCannotFillIsNotOffered(): void
    {
        self::assertSame(
            [],
            $this->editors('')->of('/home/dev/blog', self::says("editors:\n  - VS Code: 'vscode://wsl+{distribution}{path}'\n")),
        );
    }

    private function editors(string $distribution): Editors
    {
        return new Editors(new Project($this->root, $this->root, 'blog', '.worktrees'), $distribution);
    }

    private static function says(?string $yaml): Build
    {
        return new Build($yaml === null ? Recipe::none() : Recipe::fromString($yaml), null);
    }
}
