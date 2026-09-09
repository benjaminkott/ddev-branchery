<?php

declare(strict_types=1);

namespace App\Tests\Contract;

use App\Http\ApiController;
use App\Http\Response;
use App\Http\Router;
use App\Tests\Fake\Wiring;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * That the container answers with the shapes api-answers.json writes down.
 *
 * The file says the container is the truth, and a claim like that is worth
 * exactly as much as what checks it: without this, the mock and the interface
 * would be held to a description of the container that nothing holds the
 * container to, and a field renamed here would leave both of them right about
 * a shape nobody answers with any more.
 *
 * The answers are produced against a container that runs nothing and is told
 * what to say -- see App\Tests\Fake. Every door of the contract is asked for
 * and every shape of it is reached: an answer that carried nothing to look at
 * would pass this saying nothing, so both of those are held to as well.
 */
#[CoversClass(ApiController::class)]
final class ApiAnswersTest extends TestCase
{
    /** The worktree every answer about one is asked for. */
    private const string NAME = 'demo';

    /** A commit of the branch in it, as the log below has it. */
    private const string SHA = '9b31d02';

    private Wiring $wiring;

    /** An operation that is over, so there is one in a history to report. */
    private string $finished;

    protected function setUp(): void
    {
        $this->wiring = new Wiring(sys_get_temp_dir() . '/branchery-answers-' . bin2hex(random_bytes(4)));
        // A page worth opening, because a shape only reached through a list is
        // never walked by a project that names none -- and an unwalked shape is
        // one the contract holds nobody to.
        // And a way to make an account, because a worktree whose configuration says
        // nothing about one answers null there -- and a shape only reached through
        // a value that is null is a shape this holds nobody to.
        // And an editor, because what a machine has none of is answered as an empty
        // list -- and a shape only reached through an empty one is a shape this
        // holds nobody to.
        $this->wiring->recipe("entrypoints:\n  - Backend: /typo3\neditors:\n  - VS Code: 'vscode://file{path}'\naccount:\n  - ./bin/account.sh\n");
        $directory = $this->wiring->worktree(self::NAME);
        // An image the worktree carries uncommitted, because the change in one is
        // the two images and not a diff -- and a shape nothing answers with is a
        // shape this holds nobody to.
        file_put_contents($directory . '/logo.png', str_repeat('.', 96));
        // And one already made, so the field that tells the two apart is answered
        // as it is on a worktree somebody has pressed it for.
        $this->wiring->worktrees->store(self::NAME, ['account' => 1767225600]);
        $this->tell();
        $this->finished = $this->ran();
        // And one still going, which is what the list marks a row with.
        $this->wiring->jobs->append(
            $this->wiring->jobs->adopt(['worktree:provision'], self::NAME),
            '##STEP 3/7 +12s Installing dependencies',
        );
    }

    protected function tearDown(): void
    {
        $this->wiring->remove();
    }

    public function testEveryAnswerIsTheShapeTheContractSays(): void
    {
        $contract = self::contract();
        $seen = [];
        $wrong = [];

        foreach ($contract['answers'] as $answer => $type) {
            $body = json_decode($this->ask($answer)->body, true);
            $wrong = [
                ...$wrong,
                ...Shape::mismatches($body, $type, $contract['shapes'], $answer, $seen),
            ];
        }

        self::assertSame([], $wrong, "\n  " . implode("\n  ", $wrong) . "\n");
    }

    /**
     * A shape nothing walked is a shape nothing checks, and that happens on its
     * own: a list that came back empty carries no element to look at, and the
     * answer above passes saying nothing about it.
     */
    public function testEveryShapeIsWalkedByAnAnswer(): void
    {
        $contract = self::contract();
        $seen = [];
        foreach ($contract['answers'] as $answer => $type) {
            Shape::mismatches(json_decode($this->ask($answer)->body, true), $type, $contract['shapes'], $answer, $seen);
        }

        $missed = array_values(array_diff(array_keys($contract['shapes']), array_keys($seen)));

        self::assertSame([], $missed, 'these shapes were written down and not walked: ' . implode(', ', $missed));
    }

    /** Every answer of the contract is asked for here, or written down as not. */
    public function testNoAnswerLeavesThisSuiteQuietly(): void
    {
        foreach (array_keys(self::contract()['answers']) as $answer) {
            self::assertTrue(
                $this->reaches($answer),
                sprintf('"%s" is in the contract and nothing here asks for it.', $answer),
            );
        }
    }

    private function reaches(string $answer): bool
    {
        return \in_array($answer, [
            'GET /api/state',
            'GET /api/worktrees',
            'GET /api/worktrees/preview',
            'GET /api/worktrees/{name}/commits',
            'GET /api/worktrees/{name}/commits/{sha}',
            'GET /api/worktrees/{name}/commits/{sha}/diff',
            'GET /api/worktrees/{name}/changes',
            'GET /api/worktrees/{name}/changes/diff',
            'GET /api/worktrees/{name}/usage',
            'GET /api/worktrees/{name}/jobs',
            'GET /api/branches',
            'GET /api/branch',
            'GET /api/branch/commits',
            'GET /api/php-versions',
            'GET /api/jobs/{id}',
        ], true);
    }

    /** The answer behind one door of the contract, as the router would reach it. */
    private function ask(string $answer): Response
    {
        $api = $this->wiring->api;

        return match ($answer) {
            'GET /api/state' => $api->state(),
            'GET /api/worktrees' => $api->list(),
            'GET /api/worktrees/preview' => $api->preview(['branch' => '13.4']),
            'GET /api/worktrees/{name}/commits' => $api->commits(self::NAME),
            'GET /api/worktrees/{name}/commits/{sha}' => $api->commit(self::NAME, self::SHA),
            'GET /api/worktrees/{name}/commits/{sha}/diff' => $api->commitDiff(self::NAME, self::SHA, ['path' => 'a.php']),
            'GET /api/worktrees/{name}/changes' => $api->changes(self::NAME),
            'GET /api/worktrees/{name}/changes/diff' => $api->changeDiff(self::NAME, ['path' => 'logo.png']),
            'GET /api/worktrees/{name}/usage' => $api->usage(self::NAME),
            'GET /api/worktrees/{name}/jobs' => $api->worktreeJobs(self::NAME),
            'GET /api/branches' => $api->branches(),
            'GET /api/branch' => $api->branch(['branch' => '13.4']),
            'GET /api/branch/commits' => $api->branchCommits(['branch' => '13.4']),
            'GET /api/php-versions' => $api->phpVersions(),
            'GET /api/jobs/{id}' => $api->job($this->finished),
            default => self::fail(sprintf('nothing here asks for "%s".', $answer)),
        };
    }

    /** An operation that ran, so there is one to report on and one in a history. */
    private function ran(): string
    {
        $id = $this->wiring->jobs->adopt(['worktree:pull'], self::NAME);
        $this->wiring->jobs->append($id, '##STEP 1/2 +0s Updating origin');
        $this->wiring->jobs->append($id, 'From github.com:example/site');
        $this->wiring->jobs->finish($id, true);

        return $id;
    }

    /**
     * What git and the tools say, for the answers that are read out of them. Broad
     * on purpose: what is being held to here is the shape of what this application
     * makes of an answer, not the answer itself.
     */
    private function tell(): void
    {
        $root = $this->wiring->root;
        $web = $this->wiring->web;

        // The first match answers, so the scripts come before the plain calls
        // they are built out of: several of them carry a "status --porcelain" or
        // a "for-each-ref" inside.

        // How every checkout stands, the project's own first.
        $web->answer('spread state', implode("\n", [
            '# @project',
            'changes 0',
            'head 4f2a1c9c0e2b2e6e4f5a6b7c8d9e0f1a2b3c4d5e',
            "tip 4f2a1c9\tThe one before it",
            'tracking 0	0',
            '# ' . self::NAME,
            'changes 2',
            'head 9b31d02aa1b2c3d4e5f60718293a4b5c6d7e8f90',
            'tip ' . self::SHA . "\tRead what git said in a class of its own",
            'issue 91234',
            'tracking 1	0',
        ]));

        // How far each pair of branches stands apart, which is what says where a
        // branch was cut from: "branch, candidate, moved, own".
        $web->answer('spread apart', implode("\n", [
            "13.4\tmain\t3\t2",
            "feature/search\tmain\t1\t4",
        ]));

        // The three answers the page wants about branches, in one shell: which
        // one the remote calls its own, every ref by recency, and what is finished.
        $web->answer('036default', implode("\n", [
            "\x1edefault",
            'main',
            "\x1erefs",
            self::refs(),
            "\x1efinished",
            '',
        ]));

        // Everything the repository is asked about itself, in one shell.
        $web->answer('worktree list --porcelain', implode("\n", [
            "\x1ehead",
            'main',
            "\x1eworktrees",
            'worktree ' . $root,
            'HEAD 4f2a1c9c0e2b2e6e4f5a6b7c8d9e0f1a2b3c4d5e',
            'branch refs/heads/main',
            '',
            'worktree ' . $root . '/.worktrees/' . self::NAME,
            'HEAD 1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d',
            'branch refs/heads/13.4',
            '',
            "\x1eremotes",
            "origin\thttps://github.com/example/site.git",
        ]));

        // One branch asked for by name, in the same format.
        $web->answer('for-each-ref', self::refs());

        // The log, in the two formats it is read in: with the whole hash first.
        $web->answer('--format=%H%x1f%h%x1f%s%x1f%ct%x1f%an%x1f%p%x1f%b', implode("\x1f", [
            '9b31d02aa1b2c3d4e5f60718293a4b5c6d7e8f90',
            self::SHA,
            'Read what git said in a class of its own',
            '1750000000',
            'A Developer',
            '4f2a1c9',
            "The body of it.\n",
        ]));
        $web->answer('--format=%H%x1f%h%x1f%s%x1f%ct%x1f%an', implode("\n", [
            "9b31d02aa1b2c3d4e5f60718293a4b5c6d7e8f90\x1f" . self::SHA . "\x1fRead what git said in a class of its own\x1f1750000000\x1fA Developer",
            "4f2a1c9c0e2b2e6e4f5a6b7c8d9e0f1a2b3c4d5e\x1f4f2a1c9\x1fThe one before it\x1f1749000000\x1fA Developer",
        ]));

        // What git holds at each side of a change in an image: the object and its
        // length. The side that is not committed is read off the disk.
        $web->answer('cat-file -s', 'd0b9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091 2048');

        // What is uncommitted, and what one commit touched.
        $web->answer('status --porcelain', " M a.php\n?? b.php");
        $web->answer('--name-status', "M\ta.php");
        // The change in one file, as the commit door reads it. The one beside it
        // is asked about an image, which is answered with the images themselves.
        $web->answer('show --format=', implode("\n", [
            'diff --git a/a.php b/a.php',
            '--- a/a.php',
            '+++ b/a.php',
            '@@ -1,2 +1,2 @@',
            ' <?php',
            '-echo "before";',
            '+echo "after";',
        ]));
        $web->answer('rev-list', '9b31d02aa1b2c3d4e5f60718293a4b5c6d7e8f90');
        $web->answer('rev-parse --abbrev-ref --symbolic-full-name', 'origin/13.4');
        // The branch is here, which is what makes a page of its log readable
        // out of the project's own checkout.
        $web->answer('rev-parse --verify --quiet refs/heads/13.4', 'refs/heads/13.4');

        // What one worktree takes up: the checkout, then its database.
        $web->answer('du -sk', "1024\t.");
        $web->answer('COALESCE(SUM', '4096');

        // The pools the image has, which is what a version may be set to.
        $web->answer('php-fpm', "8.2\n8.3\n8.4");
    }

    /**
     * The other half of the file: what a door answers when it will not answer.
     * Asked through the router, because the status a refusal comes back with is
     * the router's to decide and the interface reads it.
     */
    public function testEveryRefusalIsTheOneTheContractWritesDown(): void
    {
        $router = new Router($this->wiring->api);
        $refusals = self::contract()['refusals'];
        self::assertNotSame([], $refusals, 'no refusals were read out of the contract');

        foreach ($refusals as $refusal) {
            [$method, $address] = explode(' ', $refusal['ask'], 2);
            [$path, $asked] = array_pad(explode('?', $address, 2), 2, '');
            parse_str($asked, $parsed);
            // As the server hands it over: what stood behind the question mark,
            // by name. A list where a value was expected is a malformed request
            // and the controller says so for itself.
            $query = [];
            foreach ($parsed as $name => $value) {
                $query[(string) $name] = $value;
            }

            $answer = $router->dispatch(
                $method,
                $path,
                isset($refusal['body']) ? (string) json_encode($refusal['body']) : '',
                $query,
            );

            self::assertSame($refusal['status'], $answer->status, $refusal['ask'] . ': ' . $answer->body);
            if ($refusal['says'] !== null) {
                $said = json_decode($answer->body, true);
                self::assertIsArray($said);
                self::assertStringContainsString($refusal['says'], (string) ($said['error'] ?? ''), $refusal['ask']);
            }
        }
    }

    /**
     * The refs as git prints them for BRANCH_FORMAT: where the branch is, when it
     * moved, the commit it stands on and what that commit says. Tabs, because that
     * is the "%09" in the format the two callers share.
     */
    private static function refs(): string
    {
        return implode("\n", [
            "refs/heads/13.4\t1750000000\t1a2b3c4\tSomething that was done",
            "refs/remotes/origin/13.4\t1750000000\t1a2b3c4\tSomething that was done",
            "refs/heads/main\t1749000000\t4f2a1c9\tThe one before it",
            // No worktree stands on this one, which is what makes it offerable.
            "refs/heads/feature/search\t1748000000\t7c1e88a\tSomething else again",
        ]);
    }

    /**
     * @return array{answers: array<string, string>, shapes: array<string, array<string, string>>, refusals: list<array{ask: string, status: int, says: ?string, body?: array<string, mixed>}>}
     */
    private static function contract(): array
    {
        $read = json_decode((string) file_get_contents(\dirname(__DIR__, 2) . '/api-answers.json'), true);
        self::assertIsArray($read);
        self::assertIsArray($read['answers'] ?? null);
        self::assertIsArray($read['shapes'] ?? null);
        self::assertIsArray($read['refusals'] ?? null);

        // On a variable rather than on the return: a docblock that hangs on
        // nothing is demoted to a plain comment by the coding-style pass, and the
        // analyser then stops seeing the type it is here to state.
        /** @var array{answers: array<string, string>, shapes: array<string, array<string, string>>, refusals: list<array{ask: string, status: int, says: ?string, body?: array<string, mixed>}>} $contract */
        $contract = $read;

        return $contract;
    }
}
