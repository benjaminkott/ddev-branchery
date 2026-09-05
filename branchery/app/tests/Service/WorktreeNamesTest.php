<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\Git;
use App\Service\Locks;
use App\Service\ManagedFiles;
use App\Service\NodeVersions;
use App\Service\PhpVersions;
use App\Service\Project;
use App\Service\ProjectDatabase;
use App\Service\Recipes;
use App\Service\Runtimes;
use App\Service\VersionMap;
use App\Service\WorktreeRepository;
use App\Tests\Fake\RecordingContainer;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;

/**
 * Which directories under worktrees/ are worktrees.
 *
 * "." and ".." are directories there too, and the second is the project. An
 * existence check that only asked the filesystem said yes to both, and every
 * operation that trusted it was one step from working on the whole checkout.
 */
#[CoversClass(WorktreeRepository::class)]
final class WorktreeNamesTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-exists-' . bin2hex(random_bytes(4));
        (new Filesystem())->mkdir($this->root . '/.worktrees/my-fix');
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->root);
    }

    private function worktrees(): WorktreeRepository
    {
        $project = new Project($this->root, '/home/dev/blog', 'blog', '.worktrees');
        $web = new RecordingContainer();
        $files = new ManagedFiles((int) getmyuid(), (int) getmygid());
        $locks = new Locks($project, $files);

        return new WorktreeRepository(
            $project,
            $files,
            new PhpVersions($project, $web, new VersionMap($project->stateDirectory() . '/php.map', $files, $locks), new Runtimes($web), $locks),
            new NodeVersions($web, new VersionMap($project->stateDirectory() . '/node.map', $files, $locks), new Runtimes($web)),
            new Git($project, $web, $locks),
            new ProjectDatabase($web),
            new Recipes($this->root, \dirname(__DIR__, 2) . '/defaults'),
        );
    }

    public function testAWorktreeThatIsThereExists(): void
    {
        self::assertTrue($this->worktrees()->exists('my-fix'));
        self::assertFalse($this->worktrees()->exists('other'));
    }

    public function testTheProjectAndTheDirectoryOfWorktreesAreNotWorktrees(): void
    {
        self::assertDirectoryExists($this->root . '/.worktrees/..');

        self::assertFalse($this->worktrees()->exists('..'));
        self::assertFalse($this->worktrees()->exists('.'));
        self::assertFalse($this->worktrees()->exists(''));
        self::assertFalse($this->worktrees()->exists('../.worktrees/my-fix'));
    }
}
