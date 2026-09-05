<?php

declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\AbstractJobCommand;
use App\Command\AbstractWorktreeCommand;
use App\Jobs\JobRunner;
use App\Jobs\StepReporter;
use App\ManagedFiles;
use App\Project;
use App\Tests\Fake\RecordingContainer;
use App\Web\WebContainer;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\Filesystem\Filesystem;

/**
 * What the command line lets through to an operation. The interface is behind a
 * route that only matches a worktree name; the console took it as typed, and
 * ".." names the project itself under worktrees/ -- a removal of it went to
 * work on the whole checkout.
 *
 * And that an operation run there leaves the same record as one started from
 * the page, markers included.
 */
#[CoversClass(AbstractWorktreeCommand::class)]
#[CoversClass(AbstractJobCommand::class)]
final class WorktreeNameTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-names-' . bin2hex(random_bytes(4));
        (new Filesystem())->mkdir($this->root . '/.ddev/branchery/var/jobs');
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->root);
    }

    /**
     * A command about one worktree, as every one of them is built.
     *
     * @param list<string> $reached the names that made it through to the operation
     */
    private function command(array &$reached): AbstractWorktreeCommand
    {
        $jobs = new JobRunner(
            new Project($this->root, '/home/dev/blog', 'blog', '.worktrees'),
            new ManagedFiles((int) getmyuid(), (int) getmygid()),
            '/opt/branchery/bin/console',
        );

        $record = static function (string $name) use (&$reached): void {
            $reached[] = $name;
        };
        $command = new class($jobs, new RecordingContainer(), $record) extends AbstractWorktreeCommand {
            public function __construct(JobRunner $jobs, WebContainer $web, private readonly \Closure $record)
            {
                parent::__construct($jobs, $web);
            }

            protected function perform(InputInterface $input, OutputInterface $output, StepReporter $reporter): int
            {
                ($this->record)($this->name($input));
                $reporter->expect(2);
                $reporter->step('First');
                $reporter->note('Something worth saying');
                $reporter->step('Second');
                $reporter->finish();

                return self::SUCCESS;
            }
        };
        $command->setName('worktree:test');

        return $command;
    }

    /** @return list<string> the logs written under var/jobs */
    private function logs(): array
    {
        $logs = [];
        foreach (glob($this->root . '/.ddev/branchery/var/jobs/*.log') ?: [] as $file) {
            $logs[] = (string) file_get_contents($file);
        }

        return $logs;
    }

    public function testANameThatCannotBeAWorktreeNeverReachesTheOperation(): void
    {
        foreach (['..', '.', 'My Feature', '../blog', '-x'] as $name) {
            $reached = [];
            $tester = new CommandTester($this->command($reached));
            $status = $tester->execute(['name' => $name]);

            self::assertSame(1, $status, $name);
            self::assertSame([], $reached, $name);
            self::assertStringContainsString('is not a name a worktree can have', $tester->getDisplay(), $name);
        }
    }

    public function testANameAWorktreeCanHaveReachesTheOperation(): void
    {
        $reached = [];
        $tester = new CommandTester($this->command($reached));

        self::assertSame(0, $tester->execute(['name' => 'my-fix']));
        self::assertSame(['my-fix'], $reached);
    }

    /**
     * Whether the terminal draws colour is not the question of what goes into the
     * log: a decorated run wrote its readable lines there, and the interface found
     * no step in them.
     */
    public function testARunFromATerminalLeavesTheMarkersInItsLog(): void
    {
        $reached = [];
        $tester = new CommandTester($this->command($reached));
        $tester->execute(['name' => 'my-fix'], ['decorated' => true]);

        $logs = $this->logs();
        self::assertCount(1, $logs);
        self::assertStringContainsString("##STEP 1/2 +0s First\n", $logs[0]);
        self::assertStringContainsString("→ Something worth saying\n", $logs[0]);
        self::assertStringContainsString("##STEP 2/2 +0s Done\n", $logs[0]);
        self::assertStringNotContainsString('<', $logs[0]);

        // And the terminal gets the readable form, not the marker.
        $display = (string) preg_replace('/\e\[[0-9;]*m/', '', $tester->getDisplay());
        self::assertStringContainsString('[1/2] First', $display);
        self::assertStringNotContainsString('##STEP', $display);
    }
}
