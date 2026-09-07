<?php

declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\CheckReleasesCommand;
use App\Installation;
use App\ManagedFiles;
use App\Project;
use App\Releases;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\Filesystem\Filesystem;

/**
 * The one step of this application that speaks to the network, and the whole
 * point of it is that nothing else has to: it runs as the container starts and
 * leaves what it found in the state directory.
 *
 * What is held to here is that it is quiet. A machine with no network, a rate
 * limit, a repository that has never released -- none of them may cost the page
 * the answer it had, and none of them may fail a container start.
 */
#[CoversClass(CheckReleasesCommand::class)]
final class CheckReleasesCommandTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-releases-' . bin2hex(random_bytes(4));
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->root);
    }

    private function noteFile(): string
    {
        return $this->root . '/.ddev/branchery/var/' . Installation::NOTED;
    }

    /** @param list<?string> $answers what the releases answer, call by call */
    private function check(array $answers, bool $force = false): int
    {
        $releases = new class($answers) implements Releases {
            public int $asked = 0;

            /** @param list<?string> $answers */
            public function __construct(private array $answers)
            {
            }

            public function latest(): ?string
            {
                ++$this->asked;

                return array_shift($this->answers);
            }
        };

        $tester = new CommandTester(new CheckReleasesCommand(
            $releases,
            new Project($this->root, '/var/www/html', 'test', '.worktrees'),
            new ManagedFiles((int) getmyuid(), (int) getmygid()),
        ));
        $tester->execute($force ? ['--force' => true] : []);
        $tester->assertCommandIsSuccessful();

        return $releases->asked;
    }

    public function testWhatItFindsIsLeftWhereThePageReadsIt(): void
    {
        $this->check(['v1.3.0']);

        self::assertSame('v1.3.0', trim((string) file_get_contents($this->noteFile())));
    }

    /**
     * A restart is when this runs and developers restart projects all day. Without
     * an age the check would spend a rate limit on an answer that cannot have
     * changed since the last one.
     */
    public function testAFreshNoteIsNotAskedAfterAgain(): void
    {
        $this->check(['v1.3.0']);

        self::assertSame(0, $this->check(['v1.4.0']), 'asked again while what was noted was still fresh');
        self::assertSame('v1.3.0', trim((string) file_get_contents($this->noteFile())));
    }

    /** Asked outright, the age is not what decides. */
    public function testForceAsksAnyway(): void
    {
        $this->check(['v1.3.0']);

        self::assertSame(1, $this->check(['v1.4.0'], force: true));
        self::assertSame('v1.4.0', trim((string) file_get_contents($this->noteFile())));
    }

    /** A note older than the age it is taken as current for is asked after again. */
    public function testANoteOlderThanItsAgeIsAskedAfterAgain(): void
    {
        $this->check(['v1.3.0']);
        touch($this->noteFile(), time() - 7 * 3600);

        self::assertSame(1, $this->check(['v1.4.0']));
        self::assertSame('v1.4.0', trim((string) file_get_contents($this->noteFile())));
    }

    /**
     * No network is not news that there is no version: replacing what was noted
     * with nothing would take the page's answer away every time a developer
     * started a project on a train.
     */
    public function testNoAnswerLeavesWhatWasNotedStanding(): void
    {
        $this->check(['v1.3.0']);
        touch($this->noteFile(), time() - 7 * 3600);
        $this->check([null]);

        self::assertSame('v1.3.0', trim((string) file_get_contents($this->noteFile())));
    }

    /** And with nothing noted yet, no answer writes no file rather than an empty one. */
    public function testNoAnswerAndNothingNotedWritesNothing(): void
    {
        $this->check([null]);

        self::assertFileDoesNotExist($this->noteFile());
    }
}
