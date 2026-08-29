<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\Locks;
use App\Service\ManagedFiles;
use App\Service\Project;
use App\Service\VersionMap;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;

/**
 * Which worktree runs on which version. What is worth holding still is the
 * answer when nothing has been written yet, and whether it changed -- that is
 * what decides whether the web container is asked to put the pools up.
 */
final class VersionMapTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-versions-' . bin2hex(random_bytes(4));
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->root);
    }

    public function testAMapNobodyHasWrittenSaysNothingAboutAnybody(): void
    {
        $map = $this->map();

        self::assertSame([], $map->all());
        self::assertNull($map->of('demo'));
    }

    public function testWhatWasAssignedIsWhatIsReadBack(): void
    {
        $map = $this->map();
        $map->assign('demo', '8.3');
        $map->assign('fix', '8.4');

        self::assertSame('8.3', $map->of('demo'));
        self::assertSame(['demo' => '8.3', 'fix' => '8.4'], $map->all());
        // On disk and not only in this process: the next operation is another
        // one, and the pools are put up from the file.
        self::assertSame(['demo' => '8.3', 'fix' => '8.4'], $this->map()->all());
    }

    /**
     * The version it already had is not a change, and a change is what the
     * containers are asked to follow.
     */
    public function testOnlyAnActualChangeIsOne(): void
    {
        $map = $this->map();

        self::assertTrue($map->assign('demo', '8.3'));
        self::assertFalse($map->assign('demo', '8.3'));
        self::assertTrue($map->assign('demo', '8.4'));
    }

    /** And forgetting a worktree that never asked for a version is no change. */
    public function testForgettingWhatWasNeverAssignedChangesNothing(): void
    {
        $map = $this->map();

        self::assertFalse($map->forget('demo'));
        $map->assign('demo', '8.3');
        self::assertTrue($map->forget('demo'));
        self::assertSame([], $map->all());
    }

    /** A line without a version in it is not one, and does not take the rest with it. */
    public function testALineThatSaysNothingIsPassedOver(): void
    {
        (new Filesystem())->dumpFile($this->root . '/php.map', "demo=8.3\nrubbish\n\nfix = 8.4 \n");

        self::assertSame(['demo' => '8.3', 'fix' => '8.4'], $this->map()->all());
    }

    /**
     * Two operations, each with its own reading of the file, writing to it
     * one after the other -- which is what two builds on two worktrees are.
     * The second used to write what it remembered plus its own line, and the
     * first's line was gone: that worktree was then served by the project's
     * PHP, and the map and the pools agreed that it should be.
     */
    public function testAnotherOperationsLineSurvivesThisOnesWrite(): void
    {
        $first = $this->map();
        $second = $this->map();
        self::assertSame([], $first->all());

        $second->assign('fix', '8.4');
        $first->assign('demo', '8.3');

        self::assertSame(['fix' => '8.4', 'demo' => '8.3'], $this->map()->all());
        // And what it remembers is what it wrote, not what it read first.
        self::assertSame('8.4', $first->of('fix'));
    }

    private function map(): VersionMap
    {
        $files = new ManagedFiles(0, 0);

        return new VersionMap(
            $this->root . '/php.map',
            $files,
            new Locks(new Project($this->root, '/home/dev/blog', 'blog', '.worktrees'), $files),
        );
    }
}
