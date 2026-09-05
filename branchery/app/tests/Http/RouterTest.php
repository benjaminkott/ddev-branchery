<?php

declare(strict_types=1);

namespace App\Tests\Http;

use App\Http\Router;
use App\Tests\Fake\Wiring;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * What a request becomes, including when it is refused.
 *
 * The status a caller is sent back with is a decision the interface reads and
 * acts on -- a 409 puts "come back in a moment" on the page, a 404 says the
 * thing is gone, a 400 says what was asked for cannot be done -- and until now
 * it was made in public/index.php, which is the one file no test can reach.
 * The mocked API decides the same statuses of its own accord, so nothing held
 * the two together either.
 */
#[CoversClass(Router::class)]
final class RouterTest extends TestCase
{
    private Wiring $wiring;

    protected function setUp(): void
    {
        $this->wiring = new Wiring(sys_get_temp_dir() . '/branchery-router-' . bin2hex(random_bytes(4)));
    }

    protected function tearDown(): void
    {
        $this->wiring->remove();
    }

    private function router(): Router
    {
        return new Router($this->wiring->api);
    }

    /**
     * Every door that names a worktree refuses one it does not know, and says so
     * as "not here" rather than as a fault. The way this goes wrong is a single
     * door left out of it.
     */
    #[DataProvider('doorsThatNameAWorktree')]
    public function testANameThatIsNoWorktreeIsNotHere(string $method, string $path): void
    {
        $answer = $this->router()->dispatch($method, $path, '', ['path' => 'a.php']);

        self::assertSame(404, $answer->status, $path);
        self::assertSame(['error' => 'Unknown worktree.'], json_decode($answer->body, true), $path);
    }

    /** @return iterable<string, array{string, string}> */
    public static function doorsThatNameAWorktree(): iterable
    {
        yield 'usage' => ['GET', '/api/worktrees/nowhere/usage'];
        yield 'commits' => ['GET', '/api/worktrees/nowhere/commits'];
        yield 'one commit' => ['GET', '/api/worktrees/nowhere/commits/9b31d02'];
        yield 'a commit diff' => ['GET', '/api/worktrees/nowhere/commits/9b31d02/diff'];
        yield 'changes' => ['GET', '/api/worktrees/nowhere/changes'];
        yield 'a change diff' => ['GET', '/api/worktrees/nowhere/changes/diff'];
        yield 'a version' => ['PATCH', '/api/worktrees/nowhere'];
        yield 'removal' => ['DELETE', '/api/worktrees/nowhere'];
        yield 'provision' => ['POST', '/api/worktrees/nowhere/provision'];
        yield 'sync' => ['POST', '/api/worktrees/nowhere/sync'];
        yield 'pull' => ['POST', '/api/worktrees/nowhere/pull'];
        yield 'restore' => ['POST', '/api/worktrees/nowhere/restore'];
        yield 'discard' => ['POST', '/api/worktrees/nowhere/discard'];
    }

    /**
     * The one door under a worktree that does not: a history outlives the thing
     * it is about, and its last entry is usually the removal.
     */
    public function testTheHistoryOfAWorktreeThatIsGoneIsStillHandedOver(): void
    {
        $answer = $this->router()->dispatch('GET', '/api/worktrees/nowhere/jobs', '');

        self::assertSame(200, $answer->status);
        self::assertSame([], json_decode($answer->body, true));
    }

    /**
     * What the caller asked for cannot be done, which is neither a fault nor a
     * thing that is missing.
     */
    public function testWhatCannotBeDoneIsTheCallersToFix(): void
    {
        $answer = $this->router()->dispatch(
            'POST',
            '/api/worktrees',
            (string) json_encode(['mode' => 'fork', 'branch' => 'feature/x', 'name' => 'Not A Name']),
        );

        self::assertSame(400, $answer->status);
        self::assertStringContainsString('lowercase letters', (string) json_decode($answer->body, true)['error']);
    }

    /** A branch name that is not one never reaches git. */
    public function testABranchNameThatIsNotOneIsRefusedAtTheDoor(): void
    {
        $answer = $this->router()->dispatch('GET', '/api/branch', '', ['branch' => '-- --upload-pack=touch']);

        self::assertSame(400, $answer->status);
        self::assertSame(['error' => 'Invalid branch name.'], json_decode($answer->body, true));
    }

    /**
     * Several routes share a path and differ only in their verb. Stopping at the
     * first match would answer "method not allowed" for a path that has one.
     */
    public function testAPathThatExistsUnderAnotherVerbSaysWhichItIs(): void
    {
        $answer = $this->router()->dispatch('DELETE', '/api/state', '');

        self::assertSame(405, $answer->status);
        self::assertSame(['error' => 'Method not allowed.'], json_decode($answer->body, true));
    }

    public function testAPathThatIsNoDoorAtAllIsUnknown(): void
    {
        $answer = $this->router()->dispatch('GET', '/api/nothing-here', '');

        self::assertSame(404, $answer->status);
        self::assertSame(['error' => 'Unknown endpoint.'], json_decode($answer->body, true));
    }

    /**
     * The literal stands before the pattern that would swallow it: "preview" is
     * a name a worktree may have, and this claims one verb on one path.
     */
    public function testThePreviewIsNotReadAsAWorktreeCalledPreview(): void
    {
        $answer = $this->router()->dispatch('GET', '/api/worktrees/preview', '', ['branch' => 'main']);

        self::assertNotSame(404, $answer->status, 'the preview was taken for a worktree of that name');
    }

    /**
     * What a segment may contain is part of the pattern, so a path that is not a
     * name never reaches the code behind it -- ".." is a directory too.
     */
    #[DataProvider('segmentsThatAreNoName')]
    public function testASegmentThatIsNoNameReachesNothing(string $path): void
    {
        $answer = $this->router()->dispatch('GET', $path, '');

        self::assertSame(404, $answer->status, $path);
        self::assertSame(['error' => 'Unknown endpoint.'], json_decode($answer->body, true), $path);
    }

    /** @return iterable<string, array{string}> */
    public static function segmentsThatAreNoName(): iterable
    {
        yield 'the project itself' => ['/api/worktrees/../changes'];
        yield 'a path' => ['/api/worktrees/one%2Ftwo/changes'];
        yield 'a name that starts with a dot' => ['/api/worktrees/.hidden/changes'];
        // A commit is named by its hash and by nothing else.
        yield 'a commit that is a word' => ['/api/worktrees/demo/commits/HEAD'];
        yield 'a commit that is an option' => ['/api/worktrees/demo/commits/--all'];
    }

    /**
     * A body that is not JSON at all is a request with nothing in it rather than
     * a page that does not come up: what it asked for is then missing, and the
     * answer says which field.
     */
    public function testABodyThatIsNotJsonIsARequestWithNothingInIt(): void
    {
        $answer = $this->router()->dispatch('POST', '/api/worktrees', 'this is not json');

        self::assertSame(400, $answer->status);
        self::assertSame(['error' => 'Invalid branch name.'], json_decode($answer->body, true));
    }
}
