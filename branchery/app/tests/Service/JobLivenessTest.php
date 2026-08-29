<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\JobRunner;
use App\Service\ManagedFiles;
use App\Service\Project;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;

/**
 * What an operation says about itself when nobody closed it properly. A
 * container is restarted mid-build often enough that this is not an edge: the
 * process is killed, nothing writes an exit code, and the record is left saying
 * "running" -- which is worse than saying it failed, because only the second
 * lets the reader start again.
 */
#[CoversClass(JobRunner::class)]
final class JobLivenessTest extends TestCase
{
    private string $root;
    private string $jobs;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-jobs-' . bin2hex(random_bytes(4));
        $this->jobs = $this->root . '/.ddev/branchery/var/jobs';
        (new Filesystem())->mkdir($this->jobs);
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->root);
    }

    private function runner(): JobRunner
    {
        return new JobRunner(
            new Project($this->root, '/var/www/html', 'test', '.worktrees'),
            new ManagedFiles((int) getmyuid(), (int) getmygid()),
            '/opt/branchery/bin/console',
        );
    }

    /** @param array<string, string> $files */
    private function job(string $id, array $files): void
    {
        foreach ($files as $suffix => $content) {
            file_put_contents($this->jobs . '/' . $id . '.' . $suffix, $content);
        }
    }

    public function testAnOperationWhoseProcessIsAliveIsRunning(): void
    {
        $this->job('alive', ['status' => "running\n", 'log' => '', 'started' => (string) time(), 'pid' => (string) getmypid()]);

        self::assertSame('running', $this->runner()->state('alive')->status);
    }

    public function testAnOperationWhoseProcessIsGoneFailed(): void
    {
        // A process id nothing can be running under: the kernel's own bound is
        // well below this.
        $this->job('killed', ['status' => "running\n", 'log' => '', 'started' => (string) time(), 'pid' => '4194303']);

        self::assertSame('failed', $this->runner()->state('killed')->status);
    }

    /** The exit code decides where there is one, however the process is. */
    public function testAnOperationThatWroteAnExitCodeIsJudgedByIt(): void
    {
        $this->job('done', ['status' => "running\n", 'log' => '', 'started' => (string) time(), 'pid' => '4194303', 'exit' => "0\n"]);
        $this->job('bad', ['status' => "running\n", 'log' => '', 'started' => (string) time(), 'pid' => '4194303', 'exit' => "1\n"]);

        self::assertSame('done', $this->runner()->state('done')->status);
        self::assertSame('failed', $this->runner()->state('bad')->status);
    }

    /**
     * The shell writes the process id as its first act, so an operation that has
     * none and was started a moment ago is one that is starting.
     */
    public function testAnOperationThatHasJustStartedIsGivenAMoment(): void
    {
        $this->job('starting', ['status' => "running\n", 'log' => '', 'started' => (string) time()]);

        self::assertSame('running', $this->runner()->state('starting')->status);
    }

    /**
     * And one with no process id from long ago is what every project has after an
     * update: a record from before this was written down.
     */
    public function testAnOperationFromBeforeAnyOfThisIsNotRunningForGood(): void
    {
        $this->job('ancient', ['status' => "running\n", 'log' => '', 'started' => (string) (time() - 3600)]);

        self::assertSame('failed', $this->runner()->state('ancient')->status);
    }

    /**
     * A process that has exited and has not been collected keeps its entry under
     * /proc, and this container has no init to collect it. Reading that as "still
     * working" is how a row says "installing dependencies" about a process that
     * ended an hour ago.
     */
    public function testAProcessThatHasEndedButNotBeenCollectedIsNotWorking(): void
    {
        $process = proc_open(['sh', '-c', 'exit 0'], [], $pipes);
        self::assertIsResource($process);
        $pid = (int) proc_get_status($process)['pid'];
        self::assertGreaterThan(0, $pid);

        // Let it exit without collecting it: proc_close would, and that is
        // precisely what nothing does for the shells this spawns.
        for ($waited = 0; $waited < 200; ++$waited) {
            $stat = @file_get_contents('/proc/' . $pid . '/stat');
            if (is_string($stat) && str_contains(substr($stat, (int) strrpos($stat, ')')), 'Z')) {
                break;
            }
            usleep(10000);
        }

        $this->job('zombie', ['status' => "running\n", 'log' => '', 'started' => (string) time(), 'pid' => (string) $pid]);

        try {
            self::assertSame('failed', $this->runner()->state('zombie')->status);
        } finally {
            proc_close($process);
        }
    }

    /**
     * A restarted container hands out its numbers again, so the one an operation
     * wrote down may belong to something that outlives it -- and the row would say
     * "installing dependencies" for as long, refusing every operation meanwhile.
     */
    public function testAProcessThatBeganAfterTheOperationIsNotTheOperation(): void
    {
        $this->job('reused', ['status' => "running\n", 'log' => '', 'started' => (string) (time() - 3600), 'pid' => (string) getmypid()]);

        self::assertSame('failed', $this->runner()->state('reused')->status);
        self::assertTrue($this->runner()->state('reused')->interrupted);
    }

    public function testNothingRunningIsReportedAsRunning(): void
    {
        $this->job('killed', ['status' => "running\n", 'log' => '', 'started' => (string) time(), 'pid' => '4194303']);
        $this->job('ancient', ['status' => "running\n", 'log' => '', 'started' => (string) (time() - 3600)]);

        self::assertSame([], $this->runner()->running());
    }
}
