<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\Lineage;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Which branch a branch was cut from, read off the distances. The shapes are
 * those of one real project: a trunk, a release branch two commits off it,
 * patches off both, and a patch that had not moved from where it was cut.
 */
#[CoversClass(Lineage::class)]
final class LineageTest extends TestCase
{
    /**
     * A branch named with digits alone becomes an integer key on the way through
     * PHP's arrays, and the base is still a name.
     */
    public function testABranchNamedWithDigitsIsStillANameHere(): void
    {
        $distances = Lineage::distancesOf("feature/x\t95618\t2\t3\n");

        self::assertSame(
            ['branch' => '95618', 'own' => 3, 'moved' => 2],
            Lineage::baseOf('feature/x', $distances['feature/x'], ['main']),
        );
    }

    /** And such a name is recognised as the trunk it is. */
    public function testANumericTrunkWinsTheTie(): void
    {
        $distances = Lineage::distancesOf("feature/x\t2025\t0\t3\nfeature/x\tmain\t0\t3\n");

        self::assertSame(
            ['branch' => '2025', 'own' => 3, 'moved' => 0],
            Lineage::baseOf('feature/x', $distances['feature/x'], ['2025']),
        );
    }

    /** The release branch and the trunk have parted; the patch left the release branch last. */
    public function testTheNearestPartingWins(): void
    {
        $base = Lineage::baseOf('task/docs-v14', [
            'master' => [0, 5],
            'v14.0' => [0, 3],
            'bugfix/comments-v14' => [2, 3],
        ], ['master']);

        self::assertSame(['branch' => 'v14.0', 'own' => 3, 'moved' => 0], $base);
    }

    /** A branch that was itself cut from this one is not its base. */
    public function testWhatWasCutFromTheBranchDoesNotCount(): void
    {
        $base = Lineage::baseOf('v14.0', [
            'master' => [0, 2],
            'bugfix/comments-v14' => [1, 0],
            'task/docs-v14' => [5, 0],
        ], ['master']);

        self::assertSame(['branch' => 'master', 'own' => 2, 'moved' => 0], $base);
    }

    /** Cut and never committed to: still off the trunk, with nothing of its own. */
    public function testStandingOnTheTrunkIsOffTheTrunk(): void
    {
        $base = Lineage::baseOf('jochen', [
            'master' => [0, 0],
            'bugfix/comments' => [1, 0],
        ], ['master']);

        self::assertSame(['branch' => 'master', 'own' => 0, 'moved' => 0], $base);
    }

    public function testTheTrunkIsCutFromNothing(): void
    {
        self::assertNull(Lineage::baseOf('master', ['jochen' => [0, 0]], ['master']));
    }

    public function testWhatTheForkWroteDownWins(): void
    {
        $base = Lineage::baseOf('feature/x', [
            'master' => [4, 1],
            'v14.0' => [0, 1],
        ], ['master'], 'master');

        self::assertSame(['branch' => 'master', 'own' => 1, 'moved' => 4], $base);
    }

    /** What was written down about a branch that is gone is no base any more. */
    public function testARecordedBaseThatIsGoneFallsBackToTheDistances(): void
    {
        $base = Lineage::baseOf('feature/x', ['master' => [4, 1]], ['master'], 'v13.0');

        self::assertSame(['branch' => 'master', 'own' => 1, 'moved' => 4], $base);
    }

    public function testTheTableGitWroteIsReadPairByPair(): void
    {
        $distances = Lineage::distancesOf("jochen\tmaster\t0\t0\njochen\tv14.0\t2\t0\nnonsense\n\nv14.0\tmaster\t0\t2\n");

        self::assertSame([
            'jochen' => ['master' => [0, 0], 'v14.0' => [2, 0]],
            'v14.0' => ['master' => [0, 2]],
        ], $distances);
    }
}
