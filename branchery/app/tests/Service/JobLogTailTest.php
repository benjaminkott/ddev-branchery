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
 * What an operation reports about itself the second and every later time it is
 * asked. The page asks once a second and a composer install writes hundreds of
 * kilobytes, so what has already been read must not come again -- and what is
 * left out has to be exactly what cannot have changed.
 */
#[CoversClass(JobRunner::class)]
final class JobLogTailTest extends TestCase
{
    private string $root;
    private string $jobs;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-tail-' . bin2hex(random_bytes(4));
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

    /** An operation that is over, so nothing about it depends on a process. */
    private function settled(string $log): void
    {
        file_put_contents($this->jobs . '/j.log', $log);
        file_put_contents($this->jobs . '/j.status', "done\n");
        file_put_contents($this->jobs . '/j.exit', "0\n");
        file_put_contents($this->jobs . '/j.started', "1\n");
    }

    private const string LOG = "##STEP 1/2 +0s Reading what the branch needs\nread it\n##STEP 2/2 +2s Installing dependencies\ninstalling\ndone installing\n";

    public function testWithoutSinceTheWholeLogComes(): void
    {
        $this->settled(self::LOG);

        $state = $this->runner()->state('j');

        self::assertFalse($state->partial);
        self::assertSame(\strlen(self::LOG), $state->size);
        self::assertStringContainsString('[1/2] Reading what the branch needs', $state->log);
        self::assertStringContainsString('done installing', $state->log);
        self::assertSame('read it', $state->steps[0]['output']);
    }

    /**
     * Read twice with what the first read reported, the two halves have to be the
     * whole -- the page glues them together and copies the result into a report.
     */
    public function testTheSecondReadCarriesOnWhereTheFirstStopped(): void
    {
        $half = strpos(self::LOG, '##STEP 2/2');
        self::assertIsInt($half);

        $this->settled(substr(self::LOG, 0, $half));
        $first = $this->runner()->state('j');

        $this->settled(self::LOG);
        $second = $this->runner()->state('j', $first->size);

        self::assertTrue($second->partial);
        self::assertSame(
            $this->runner()->state('j')->log,
            $first->log . $second->log,
        );
    }

    /**
     * The step that was over already keeps what the caller has; the one it was in
     * the middle of comes again, having gained a line since.
     */
    public function testOnlyWhatCouldHaveMovedCarriesItsOutput(): void
    {
        $upTo = strpos(self::LOG, 'done installing');
        self::assertIsInt($upTo);

        $this->settled(substr(self::LOG, 0, $upTo));
        $first = $this->runner()->state('j');

        $this->settled(self::LOG);
        $second = $this->runner()->state('j', $first->size);

        self::assertNull($second->steps[0]['output']);
        self::assertSame("installing\ndone installing", $second->steps[1]['output']);
    }

    /**
     * A log the caller cannot be holding a part of -- it was replaced under it --
     * comes whole, rather than as a slice that would be glued onto the wrong text.
     */
    public function testAnImpossiblePositionIsAnsweredWithTheWholeLog(): void
    {
        $this->settled(self::LOG);

        $state = $this->runner()->state('j', \strlen(self::LOG) + 100);

        self::assertFalse($state->partial);
        self::assertStringContainsString('[1/2] Reading what the branch needs', $state->log);
    }

    /**
     * A tool writing mid-line is the ordinary state of a log being written, and
     * half a marker in one answer and half in the next is a step nobody can read.
     */
    public function testARunningOperationIsReportedUpToItsLastWholeLine(): void
    {
        file_put_contents($this->jobs . '/r.log', "##STEP 1/2 +0s Reading\nread it\n##STEP 2/2 +1s Instal");
        file_put_contents($this->jobs . '/r.status', "running\n");
        file_put_contents($this->jobs . '/r.started', (string) time());
        file_put_contents($this->jobs . '/r.pid', (string) getmypid());

        $state = $this->runner()->state('r');

        self::assertSame('running', $state->status);
        self::assertStringNotContainsString('Instal', $state->log);
        self::assertStringEndsWith("read it\n", $state->log);
    }
}
