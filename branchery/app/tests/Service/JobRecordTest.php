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
     * A worktree that goes on existing kept every record it ever made. Nothing
     * took one away: forget() runs when a name is reused or a worktree is
     * removed, and a worktree that is neither is one nobody ever swept. A
     * composer install writes hundreds of kilobytes into its log.
     */
    public function testAWorktreeKeepsOnlySoManyOperations(): void
    {
        $kept = (new \ReflectionClassConstant(JobRunner::class, 'KEPT'))->getValue();
        self::assertIsInt($kept);

        for ($made = 0; $made < $kept + 5; ++$made) {
            $this->job(sprintf('20260821-%03d-x', $made), [
                'subject' => "my-fix\n",
                'status' => "done\n",
                'log' => 'built',
                'started' => (string) $made,
                'exit' => '0',
            ]);
        }

        // Starting another is what sweeps: no timer, and nothing to run by hand.
        $this->runner()->adopt(['worktree:pull'], 'my-fix');

        $history = $this->runner()->history('my-fix');
        self::assertCount($kept, $history, 'the history grew past what is kept');
        // The newest, and the one just made among them.
        self::assertSame('worktree:pull', $history[0]['command']);
        // And nothing of what went is left lying: a file without its record reads
        // as an operation with no log and no time.
        $known = array_column($history, 'id');
        foreach (glob($this->jobs . '/*') ?: [] as $file) {
            self::assertContains(
                preg_replace('/\.[a-z]+$/', '', basename($file)),
                $known,
                sprintf('%s belongs to a record that is gone', basename($file)),
            );
        }
    }

    /**
     * An operation about no worktree writes no subject, and forget() looks a
     * record up by one -- so a fetch was a record nothing could ever reach.
     * Swept as a group of its own, or one worktree's history would push it out.
     */
    public function testOperationsAboutNoWorktreeAreSweptToo(): void
    {
        $kept = (new \ReflectionClassConstant(JobRunner::class, 'KEPT'))->getValue();
        self::assertIsInt($kept);

        for ($made = 0; $made < $kept + 5; ++$made) {
            $this->job(sprintf('20260821-%03d-f', $made), [
                'status' => "done\n",
                'command' => "git:fetch\n",
                'log' => 'fetched',
                'started' => (string) $made,
                'exit' => '0',
            ]);
        }
        $this->job('20260821-900-w', ['subject' => "my-fix\n", 'status' => "done\n", 'started' => '900', 'exit' => '0']);

        $this->runner()->adopt(['git:fetch']);

        // The worktree's own record is untouched by a sweep of the others.
        self::assertCount(1, $this->runner()->history('my-fix'));
        $left = array_filter(
            glob($this->jobs . '/*.status') ?: [],
            static fn (string $file): bool => !is_file(substr($file, 0, -7) . '.subject'),
        );
        self::assertCount($kept, $left, 'the operations about no worktree grew past what is kept');
    }

    /** Whatever its age: a sweep that took a running operation would take its log. */
    public function testNothingRunningIsSweptAway(): void
    {
        $kept = (new \ReflectionClassConstant(JobRunner::class, 'KEPT'))->getValue();
        self::assertIsInt($kept);

        $this->job('20260821-000-old', ['subject' => "my-fix\n", 'status' => "running\n", 'started' => (string) time(), 'pid' => (string) getmypid()]);
        for ($made = 1; $made < $kept + 5; ++$made) {
            $this->job(sprintf('20260821-%03d-x', $made), [
                'subject' => "my-fix\n",
                'status' => "done\n",
                'started' => (string) $made,
                'exit' => '0',
            ]);
        }

        $this->runner()->adopt(['worktree:pull'], 'my-fix');

        self::assertFileExists($this->jobs . '/20260821-000-old.status', 'a running operation was swept away');
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
