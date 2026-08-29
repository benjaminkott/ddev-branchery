<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\DescribeInfo;
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
use App\Service\WebContainer;
use App\Service\WorktreeRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;

/**
 * The file being written here is DDEV's and the project runs from it: a missing
 * quote would take the whole project down. So what is checked is not only that
 * the worktrees arrive, but that everything around them comes out unchanged.
 */
final class DescribeInfoTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-describe-' . bin2hex(random_bytes(4));
        $filesystem = new Filesystem();
        $filesystem->mkdir($this->root . '/.ddev/branchery/var/metadata');
        $filesystem->mkdir($this->root . '/.worktrees');
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->root);
    }

    public function testTheWorktreesLandInTheServiceBlock(): void
    {
        $this->givenWorktree('my-fix', ['branch' => 'feature/my-fix', 'php' => '8.3', 'database' => 'branchery_my_fix']);
        $this->givenRendered($this->rendered('    x-ddev:' . "\n" . '      describe-url-port: Interface: ddev branchery launch'));

        $this->describeInfo()->refresh();

        $contents = $this->renderedContents();
        self::assertStringContainsString('describe-url-port: |-', $contents);
        self::assertStringContainsString('        Interface: ddev branchery launch', $contents);
        // At the address it is served under, which is its own name -- the branch
        // it was made for is a different word and answers nowhere.
        self::assertStringContainsString('         - https://my-fix.demo.ddev.site (PHP 8.3, branchery_my_fix)', $contents);
        self::assertStringNotContainsString('feature-my-fix', $contents);
        self::assertStringContainsString('        1 worktree', $contents);

        // The neighbours are none of our business.
        self::assertStringContainsString('    image: ddev/ddev-webserver:v1.25.1', $contents);
        self::assertStringContainsString('      TYPO3_CONTEXT: Development/$$brancherytest', $contents);
        self::assertStringContainsString('  web:', $contents);
    }

    public function testAnEmptyProjectSaysSoRatherThanShowingAnEmptyList(): void
    {
        $this->givenRendered($this->rendered(''));

        $this->describeInfo()->refresh();

        $contents = $this->renderedContents();
        self::assertStringContainsString('        No worktrees', $contents);
        self::assertStringNotContainsString('Worktrees:', $contents);
    }

    public function testRefreshingTwiceChangesNothingTheSecondTime(): void
    {
        $this->givenWorktree('my-fix', ['branch' => 'my-fix', 'php' => '8.4']);
        $this->givenRendered($this->rendered(''));

        $this->describeInfo()->refresh();
        $once = $this->renderedContents();
        $this->describeInfo()->refresh();

        self::assertSame($once, $this->renderedContents());
    }

    public function testAFileWithoutTheServiceIsLeftAlone(): void
    {
        $foreign = "services:\n  web:\n    image: whatever\n";
        $this->givenRendered($foreign);

        $this->describeInfo()->refresh();

        self::assertSame($foreign, $this->renderedContents());
    }

    /** @param array<string, string> $metadata */
    private function givenWorktree(string $name, array $metadata): void
    {
        $filesystem = new Filesystem();
        $filesystem->mkdir($this->root . '/.worktrees/' . $name);
        $filesystem->dumpFile(
            $this->root . '/.ddev/branchery/var/metadata/' . $name . '.json',
            (string) json_encode([...$metadata, 'name' => $name]),
        );
    }

    private function givenRendered(string $contents): void
    {
        (new Filesystem())->dumpFile($this->root . '/.ddev/.ddev-docker-compose-full.yaml', $contents);
    }

    private function renderedContents(): string
    {
        return (string) file_get_contents($this->root . '/.ddev/.ddev-docker-compose-full.yaml');
    }

    /** The shape DDEV renders: services at two spaces, their keys at four. */
    private function rendered(string $extension): string
    {
        return implode("\n", [
            'name: brancherytest',
            'services:',
            '  branchery:',
            '    container_name: ddev-brancherytest-branchery',
            '    working_dir: /opt/branchery',
            ...($extension !== '' ? explode("\n", $extension) : []),
            '  web:',
            '    image: ddev/ddev-webserver:v1.25.1',
            '    environment:',
            '      TYPO3_CONTEXT: Development/$$brancherytest',
            'networks:',
            '  default:',
            '    name: ddev-brancherytest_default',
            '',
        ]);
    }

    private function describeInfo(): DescribeInfo
    {
        $project = new Project($this->root, $this->root, 'demo', '.worktrees');
        $files = new ManagedFiles(0, 0);
        $locks = new Locks($project, $files);
        $web = new WebContainer('', $this->root);
        $database = new ProjectDatabase($web);

        return new DescribeInfo(
            $project,
            new WorktreeRepository(
                $project,
                $files,
                new PhpVersions($project, $web, new VersionMap($project->stateDirectory() . '/php.map', $files, $locks), new Runtimes($web), $locks),
                new NodeVersions($web, new VersionMap($project->stateDirectory() . '/node.map', $files, $locks), new Runtimes($web)),
                new Git($project, $web, $locks),
                $database,
                new Recipes($this->root, $this->root . '/defaults'),
            ),
            $database,
            $files,
        );
    }
}
