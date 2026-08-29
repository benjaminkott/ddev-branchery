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
 * What is kept of the operations run on a worktree, and until when. The record
 * lives under the worktree's name, and a name comes back.
 */
#[CoversClass(JobRunner::class)]
final class JobRecordTest extends TestCase
{
    private string $root;
    private string $jobs;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-record-' . bin2hex(random_bytes(4));
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

    /**
     * Remove a worktree and create one called the same, and the new one used to
     * open with the operations of its predecessor.
     */
    public function testTheRecordOfAWorktreeGoesWithIt(): void
    {
        $this->job('20260821-1-a', ['subject' => "my-fix\n", 'status' => "done\n", 'log' => 'built', 'started' => '1', 'exit' => '0']);
        $this->job('20260821-2-b', ['subject' => "my-fix\n", 'status' => "failed\n", 'log' => 'broke', 'started' => '2', 'exit' => '1']);
        $this->job('20260821-3-c', ['subject' => "other\n", 'status' => "done\n", 'log' => 'kept', 'started' => '3', 'exit' => '0']);

        self::assertSame(2, $this->runner()->forget('my-fix'));
        self::assertSame([], $this->runner()->history('my-fix'));
        self::assertCount(1, $this->runner()->history('other'));
    }

    /** Every file of it, or what is left reads as an operation with no log. */
    public function testNothingOfAForgottenOperationIsLeftLying(): void
    {
        $this->job('20260821-1-a', ['subject' => "my-fix\n", 'status' => "done\n", 'log' => 'built', 'started' => '1', 'exit' => '0', 'command' => 'worktree:add']);

        $this->runner()->forget('my-fix');

        self::assertSame([], glob($this->jobs . '/20260821-1-a.*'));
    }

    /**
     * The one operation that stays: the removal writing this very log. Taking its
     * files out from under it would leave the page watching it looking at an
     * operation that no longer exists.
     */
    public function testTheOperationDoingTheForgettingSurvivesIt(): void
    {
        $this->job('20260821-9-z', ['subject' => "my-fix\n", 'status' => "running\n", 'log' => 'removing', 'started' => (string) time(), 'pid' => (string) getmypid()]);

        self::assertSame(0, $this->runner()->forget('my-fix'));
        self::assertCount(1, $this->runner()->history('my-fix'));
    }

    /**
     * There is a file here for every operation the project has ever started, and
     * the page asks this every couple of seconds -- so what is over has to be
     * recognised as over before anything else about it is read.
     */
    public function testOnlyWhatIsStillWorkingIsRunning(): void
    {
        $this->job('20260821-1-a', ['subject' => "my-fix\n", 'command' => "worktree:add\n", 'status' => "done\n", 'started' => '1', 'exit' => '0', 'log' => '']);
        $this->job('20260821-2-b', [...$this->working("##STEP 2/7 +3s Installing dependencies\n"), 'subject' => "other\n"]);

        $running = $this->runner()->running();

        self::assertCount(1, $running);
        self::assertSame('other', $running[0]['subject']);
        self::assertSame('worktree:provision', $running[0]['command']);
        self::assertSame('Installing dependencies', $running[0]['step']['label'] ?? null);
    }

    /**
     * The step is found however much the tools have written under it.
     *
     * A composer install writes hundreds of kilobytes into this file and the
     * list reads it every couple of seconds for one line of text, so only its
     * end is read -- and the step being worked on can stand on either side of
     * where that reading begins.
     */
    public function testTheStepIsFoundOnEitherSideOfWhatIsRead(): void
    {
        $noise = str_repeat("  - Downloading vendor/package (1.2.3)\n", 4000);

        // Behind more output than is read, but with its own still short.
        $this->job('20260821-5-e', $this->working("##STEP 1/7 +0s Reading what the branch needs\n" . $noise . "##STEP 2/7 +12s Installing dependencies\n" . str_repeat("ok\n", 200)));
        // And with its own output longer than what is read, so that the end of
        // the file carries no marker at all.
        $this->job('20260821-6-f', $this->working("##STEP 2/7 +12s Installing dependencies\n" . $noise));

        $running = $this->runner()->running();

        self::assertCount(2, $running);
        foreach ($running as $job) {
            self::assertSame('Installing dependencies', $job['step']['label'] ?? null, $job['id']);
            self::assertSame(2, $job['step']['no'] ?? null, $job['id']);
        }
    }

    /**
     * The files of an operation that is running here, right now.
     *
     * @return array<string, string>
     */
    private function working(string $log): array
    {
        return [
            'subject' => "my-fix\n",
            'command' => "worktree:provision\n",
            'status' => "running\n",
            'started' => (string) time(),
            'pid' => (string) getmypid(),
            'log' => $log,
        ];
    }

    /**
     * An operation that ended before the steps it announced closes the step
     * it was on rather than opening one it never took.
     */
    public function testAnOperationThatEndsEarlyHasNoPhantomStep(): void
    {
        $this->job('20260821-4-d', [
            'subject' => "my-fix\n",
            'status' => "done\n",
            'started' => '1',
            'exit' => '0',
            'log' => "##STEP 1/3 +0s Going back to main\nSwitched to branch 'main'\n##STEP 1/1 +2s Done\n",
        ]);

        $steps = $this->runner()->state('20260821-4-d')->steps;

        self::assertCount(1, $steps);
        self::assertSame('Going back to main', $steps[0]['label']);
        self::assertSame('done', $steps[0]['state']);
        self::assertSame(2, $steps[0]['seconds']);
    }
}
