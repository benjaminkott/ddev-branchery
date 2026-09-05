<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Http\Response;
use App\Service\ManagedFiles;
use App\Service\Project;
use App\Service\Snapshot;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;

/**
 * What may be handed out again, and what may not. The answer this keeps is the
 * one the page asks for every two seconds, and reading it is five process
 * starts -- but an answer kept past the end of an operation is a list that says
 * nothing happened.
 */
#[CoversClass(Snapshot::class)]
final class SnapshotTest extends TestCase
{
    private string $root;
    private Snapshot $snapshot;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/branchery-snapshot-' . bin2hex(random_bytes(4));
        (new Filesystem())->mkdir($this->root . '/.ddev/branchery/var/jobs');
        $project = new Project($this->root, $this->root, 'blog', '.worktrees');
        $this->snapshot = new Snapshot($project, new ManagedFiles((int) getmyuid(), (int) getmygid()));
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->root);
    }

    /** @param list<int> $reads */
    private function answering(string $body, array &$reads): \Closure
    {
        return static function () use ($body, &$reads): Response {
            $reads[] = 1;

            return Response::json(['said' => $body]);
        };
    }

    public function testTheSecondQuestionInTheSameMomentCostsNoSecondAnswer(): void
    {
        $reads = [];

        $first = $this->snapshot->of($this->answering('one', $reads));
        $second = $this->snapshot->of($this->answering('two', $reads));

        self::assertCount(1, $reads);
        self::assertSame($first->body, $second->body);
    }

    /**
     * The end of an operation has to be in the next answer and not a second
     * later: the page reads this the moment a build finishes and names what it
     * built out of it.
     */
    public function testAnOperationSayingSomethingElseIsReadAgainAtOnce(): void
    {
        $reads = [];
        $this->snapshot->of($this->answering('one', $reads));

        file_put_contents($this->root . '/.ddev/branchery/var/jobs/j.status', "done\n");
        $again = $this->snapshot->of($this->answering('two', $reads));

        self::assertCount(2, $reads);
        self::assertStringContainsString('two', $again->body);
    }

    /** A worktree gone is a change nothing wrote a status file about. */
    public function testAWorktreeThatWentIsReadAgainAtOnce(): void
    {
        $reads = [];
        (new Filesystem())->mkdir($this->root . '/.worktrees/my-fix');
        $this->snapshot->of($this->answering('one', $reads));

        (new Filesystem())->remove($this->root . '/.worktrees/my-fix');
        $this->snapshot->of($this->answering('two', $reads));

        self::assertCount(2, $reads);
    }

    /**
     * Only an answer worth keeping: one that went wrong is a moment's trouble,
     * and kept it would be a moment's trouble twice.
     */
    public function testWhatWentWrongIsNotHandedOutAgain(): void
    {
        $reads = [];
        $failing = static function () use (&$reads): Response {
            $reads[] = 1;

            return Response::json(['error' => 'no'], 500);
        };

        $this->snapshot->of($failing);
        $this->snapshot->of($failing);

        self::assertCount(2, $reads);
    }
}
