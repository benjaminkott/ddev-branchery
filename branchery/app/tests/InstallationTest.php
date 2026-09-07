<?php

declare(strict_types=1);

namespace App\Tests;

use App\Installation;
use App\Project;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;

/**
 * Whether what is running is what the project asks for. The failure this guards
 * against is an update that appears to have worked -- and saying so is worth
 * nothing unless it is also silent when there is nothing to say.
 */
#[CoversClass(Installation::class)]
final class InstallationTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-installed-' . bin2hex(random_bytes(4));
        $this->compose('ghcr.io/benjaminkott/ddev-branchery:v1.2.0');
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->root);
    }

    /** The compose file as the install writes it: a default, overridable. */
    private function compose(string $image): void
    {
        (new Filesystem())->dumpFile(
            $this->root . '/.ddev/docker-compose.branchery.yaml',
            "services:\n  branchery:\n    image: \${BRANCHERY_DOCKER_IMAGE:-" . $image . "}\n",
        );
    }

    private function installation(string $version): Installation
    {
        return new Installation(new Project($this->root, '/var/www/html', 'test', '.worktrees'), $version);
    }

    public function testTheVersionTheProjectAsksForSaysNothing(): void
    {
        self::assertFalse($this->installation('v1.2.0')->updateWaiting());
    }

    public function testAnotherVersionIsAnUpdateWaiting(): void
    {
        self::assertTrue($this->installation('v1.1.0')->updateWaiting());
    }

    /**
     * An image built from a working copy is not a version: comparing it with the
     * compose file would call every day of work on this add-on an update waiting.
     */
    public function testAnImageBuiltFromAWorkingCopySaysNothing(): void
    {
        self::assertFalse($this->installation('dev')->updateWaiting());
    }

    /**
     * An override from elsewhere carries no version to read. Falling through to the
     * compose file's default would compare against an image the project does not
     * run, for as long as the override stays.
     */
    public function testAnOverrideWithoutAVersionOfOursSaysNothing(): void
    {
        (new Filesystem())->dumpFile(
            $this->root . '/.ddev/.env.branchery',
            "BRANCHERY_DOCKER_IMAGE=\"registry.example.org/team/branchery:2024-05\"\n",
        );

        self::assertFalse($this->installation('v1.1.0')->updateWaiting());
    }

    /** Nothing to compare against is nothing to say. */
    public function testWithoutAComposeFileItSaysNothing(): void
    {
        (new Filesystem())->remove($this->root . '/.ddev/docker-compose.branchery.yaml');

        self::assertFalse($this->installation('v1.1.0')->updateWaiting());
    }

    /**
     * An image pinned through the environment is the one that starts, so it is the
     * one the project asks for -- and no restart would ever clear an update
     * reported against the compose file's default, since a restart starts the
     * pinned one again.
     */
    public function testAPinnedImageIsWhatTheProjectAsksFor(): void
    {
        (new Filesystem())->dumpFile(
            $this->root . '/.ddev/.env.branchery',
            "BRANCHERY_DOCKER_IMAGE=ghcr.io/benjaminkott/ddev-branchery:v2.0.0\n",
        );

        self::assertFalse($this->installation('v2.0.0')->updateWaiting());
        self::assertTrue($this->installation('v1.2.0')->updateWaiting());
    }

    public function testAComposeFileNamingNoTagSaysNothing(): void
    {
        (new Filesystem())->dumpFile(
            $this->root . '/.ddev/docker-compose.branchery.yaml',
            "services:\n  branchery:\n    image: \${BRANCHERY_DOCKER_IMAGE}\n",
        );

        self::assertFalse($this->installation('v1.1.0')->updateWaiting());
    }

    /** What the startup check leaves behind, which is all this reads. */
    private function noted(string $tag): void
    {
        (new Filesystem())->dumpFile($this->root . '/.ddev/branchery/var/' . Installation::NOTED, $tag . "\n");
    }

    public function testANewerReleaseIsAnUpdateAvailable(): void
    {
        $this->noted('v1.3.0');

        self::assertSame('v1.3.0', $this->installation('v1.2.0')->updateAvailable());
    }

    /** The version the project already asks for is not news about a newer one. */
    public function testTheReleaseTheProjectAlreadyAsksForSaysNothing(): void
    {
        $this->noted('v1.2.0');

        self::assertNull($this->installation('v1.2.0')->updateAvailable());
    }

    /**
     * Compared against what the project wants, not against what runs: a project
     * updated and waiting for its restart is told that by updateWaiting(), and
     * being told the same thing twice in two wordings reads as two problems.
     */
    public function testAProjectAlreadyUpdatedAndAwaitingItsRestartIsNotToldTwice(): void
    {
        $this->noted('v1.2.0');
        $waiting = $this->installation('v1.1.0');

        self::assertTrue($waiting->updateWaiting());
        self::assertNull($waiting->updateAvailable());
    }

    /** An older note than the project's own version is not an update. */
    public function testAnOlderReleaseSaysNothing(): void
    {
        $this->noted('v1.1.0');

        self::assertNull($this->installation('v1.2.0')->updateAvailable());
    }

    /** Versions and not strings: v1.10.0 follows v1.9.0, which sorts the other way. */
    public function testVersionsAreComparedAsVersionsAndNotAsText(): void
    {
        $this->compose('ghcr.io/benjaminkott/ddev-branchery:v1.9.0');
        $this->noted('v1.10.0');

        self::assertSame('v1.10.0', $this->installation('v1.9.0')->updateAvailable());
    }

    /** A check that has never run, or never got an answer, is not a note. */
    public function testWithoutANoteItSaysNothing(): void
    {
        self::assertNull($this->installation('v1.2.0')->updateAvailable());
    }

    /**
     * A tag that is not a version cannot be newer than one. The rolling build is
     * tagged "main", and reading it as a release would tell every project tracking
     * it, for good, that an update is waiting.
     */
    public function testATagThatIsNotAVersionSaysNothing(): void
    {
        $this->noted('main');

        self::assertNull($this->installation('v1.2.0')->updateAvailable());
    }

    /** An image built from a working copy has no version to be behind. */
    public function testAWorkingCopySaysNothingAboutReleases(): void
    {
        $this->noted('v9.9.9');

        self::assertNull($this->installation('dev')->updateAvailable());
    }
}
