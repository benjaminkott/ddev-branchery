<?php

declare(strict_types=1);

namespace App\Tests\Git;

use App\Git\Git;
use App\Git\GitOutput;
use App\Model\Branch;
use PHPUnit\Framework\TestCase;

/**
 * What git says about all the worktrees at once. The answer arrives as one
 * block of text, and reading it wrongly would put a worktree on the wrong
 * branch, or say that nothing would be lost by removing one.
 */
final class GitTest extends TestCase
{
    private const string PREFIX = '/home/dev/projects/blog/.worktrees/';

    public function testEachWorktreeIsOnTheBranchItsBlockNames(): void
    {
        $listed = <<<'OUT'
            worktree /home/dev/projects/blog
            HEAD 4f2a1c9c0e2b2e6e4f5a6b7c8d9e0f1a2b3c4d5e
            branch refs/heads/main

            worktree /home/dev/projects/blog/.worktrees/v13
            HEAD 1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d
            branch refs/heads/13.4

            worktree /home/dev/projects/blog/.worktrees/feature-checkout
            HEAD 9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c
            branch refs/heads/feature/checkout
            OUT;

        self::assertSame(
            ['v13' => '13.4', 'feature-checkout' => 'feature/checkout'],
            GitOutput::branchesOf($listed, self::PREFIX),
        );
    }

    /**
     * Every one of these is a way somebody's clone is actually written. The last
     * two matter most: a remote that is a directory has no page at all, and one
     * carrying a token must not put it in the markup.
     */
    public function testARemoteIsReadAsTheAddressItIsBrowsedAt(): void
    {
        self::assertSame(
            'https://github.com/benjaminkott/ddev-branchery',
            GitOutput::browsableRemote('git@github.com:benjaminkott/ddev-branchery.git'),
        );
        self::assertSame(
            'https://github.com/benjaminkott/ddev-branchery',
            GitOutput::browsableRemote('https://github.com/benjaminkott/ddev-branchery.git'),
        );
        self::assertSame(
            'https://git.example.org/team/site',
            GitOutput::browsableRemote('ssh://git@git.example.org:2222/team/site.git'),
        );
        self::assertSame(
            'https://gitlab.com/group/subgroup/site',
            GitOutput::browsableRemote('git@gitlab.com:group/subgroup/site.git'),
        );
        self::assertSame(
            'http://git.internal/team/site',
            GitOutput::browsableRemote('http://git.internal/team/site.git'),
        );
    }

    /**
     * What a hard reset writes over is what is modified in tracked files: the
     * refusal that counted untracked ones kept a developer from dropping their
     * commits over a stray file.
     */
    public function testOnlyTrackedChangesAreWhatAResetWouldWriteOver(): void
    {
        $status = " M composer.json\n?? notes.txt\nA  src/New.php\n?? build/\n";

        self::assertSame([' M composer.json', 'A  src/New.php'], GitOutput::modifiedOf($status));
        self::assertSame([], GitOutput::modifiedOf("?? one\n?? two\n"));
    }

    /**
     * The one word for each that fits both what the index says and what the
     * working copy says.
     */
    public function testEveryUncommittedFileIsNamedWithOneWordForItsState(): void
    {
        $status = " M composer.json\n?? notes.txt\nA  src/New.php\nRM old.php -> src/Renamed.php\n D gone.txt\nMM both.php\n?? \"with space.txt\"\n";

        self::assertSame([
            ['status' => 'modified', 'path' => 'composer.json'],
            ['status' => 'untracked', 'path' => 'notes.txt'],
            ['status' => 'added', 'path' => 'src/New.php'],
            ['status' => 'renamed', 'path' => 'src/Renamed.php'],
            ['status' => 'deleted', 'path' => 'gone.txt'],
            ['status' => 'modified', 'path' => 'both.php'],
            ['status' => 'untracked', 'path' => 'with space.txt'],
        ], GitOutput::changesOf($status));
        self::assertSame([], GitOutput::changesOf(''));
    }

    /**
     * git's own headers dropped, a hunk's header kept as the context it is, and
     * each line saying whether it came or went.
     */
    public function testADiffIsReadAsTheLinesItAddsAndRemoves(): void
    {
        $diff = <<<'DIFF'
            diff --git a/composer.json b/composer.json
            index 3b18e51..a0c3d1f 100644
            --- a/composer.json
            +++ b/composer.json
            @@ -1,4 +1,4 @@
             {
            -    "name": "old",
            +    "name": "new",
                 "type": "project"
            DIFF;

        self::assertSame([
            ['kind' => 'context', 'text' => '@@ -1,4 +1,4 @@'],
            ['kind' => 'context', 'text' => '{'],
            ['kind' => 'del', 'text' => '    "name": "old",'],
            ['kind' => 'add', 'text' => '    "name": "new",'],
            ['kind' => 'context', 'text' => '    "type": "project"'],
        ], GitOutput::diffLines($diff));
    }

    /** A path the page asks about stays inside the checkout, whatever the request says. */
    public function testOnlyAPathInsideTheCheckoutIsAskedAbout(): void
    {
        self::assertSame('src/New.php', GitOutput::insideCheckout('src/New.php'));
        self::assertSame('with space.txt', GitOutput::insideCheckout(' with space.txt '));

        foreach (['', '/etc/passwd', '../project/.env', 'src/../../x', './x', 'a//b', "a\0b"] as $path) {
            self::assertNull(GitOutput::insideCheckout($path), $path);
        }
    }

    /**
     * Everything else in that place is a revision git would resolve: a branch, a
     * tag, `HEAD@{1}`, or a word beginning with a dash.
     */
    public function testOnlyAHashNamesACommit(): void
    {
        self::assertSame('b5607cae9ca', GitOutput::asSha('b5607cae9ca'));
        self::assertSame('4f2a1c9c0e2b2e6e4f5a6b7c8d9e0f1a2b3c4d5e', GitOutput::asSha(' 4f2a1c9c0e2b2e6e4f5a6b7c8d9e0f1a2b3c4d5e '));

        foreach (['', 'main', 'HEAD@{1}', '--all', 'B5607CA', 'abc', 'b5607cae9ca..HEAD', str_repeat('a', 41)] as $revision) {
            self::assertNull(GitOutput::asSha($revision), $revision);
        }
    }

    /** What cannot be looked at is said to be nothing, not linked to anyway. */
    /**
     * The path repair writes the project's path into a sed expression, and a
     * directory called "R&D" is the ordinary way that goes wrong.
     */
    public function testAPathIsALiteralOnBothSidesOfTheSedExpression(): void
    {
        self::assertSame('/home/me/R\\&D/a\\|b\\\\c', GitOutput::sedReplacement('/home/me/R&D/a|b\\c'));
        self::assertSame('/var/www/html\\.x/\\[a\\]\\*', GitOutput::sedPattern('/var/www/html.x/[a]*'));
        // What ordinary paths look like: untouched.
        self::assertSame('/home/benji/projects/site', GitOutput::sedReplacement('/home/benji/projects/site'));
        self::assertSame('/var/www/html', GitOutput::sedPattern('/var/www/html'));
    }

    public function testARemoteWithNoPageBehindItIsNoAddress(): void
    {
        self::assertNull(GitOutput::browsableRemote('/srv/git/site.git'));
        self::assertNull(GitOutput::browsableRemote('file:///srv/git/site.git'));
        self::assertNull(GitOutput::browsableRemote(''));
    }

    /** A clone made with a token in it carries one; the link may not. */
    public function testTheCredentialsInARemoteAreLeftBehind(): void
    {
        self::assertSame(
            'https://github.com/team/site',
            GitOutput::browsableRemote('https://benji:ghp_secretsecret@github.com/team/site.git'),
        );
    }

    /**
     * Origin first, because it is the one a repository is worked with -- git lists
     * them by name, which puts a remote called "13" above it. A remote git names no
     * address for is still a remote.
     */
    public function testTheRemotesAreReadWithTheAddressEachIsAt(): void
    {
        $listed = <<<'OUT'
            13	https://example.org/x/y.git
            mirror	git@example.com:team/blog.git
            origin	https://github.com/team/site.git
            broken
            OUT;

        self::assertSame(
            [
                'origin' => 'https://github.com/team/site.git',
                '13' => 'https://example.org/x/y.git',
                'mirror' => 'git@example.com:team/blog.git',
                'broken' => '',
            ],
            GitOutput::remotesOf($listed),
        );
    }

    /** A repository with no remote at all answers with none, and not with one blank. */
    public function testARepositoryWithoutRemotesHasNone(): void
    {
        self::assertSame([], GitOutput::remotesOf(''));
        self::assertSame([], GitOutput::remotesOf("\n\n"));
    }

    /** The checkout DDEV is configured in is in that list too, and is not one of them. */
    public function testTheProjectsOwnCheckoutIsNotAWorktree(): void
    {
        $listed = <<<'OUT'
            worktree /home/dev/projects/blog
            HEAD 4f2a1c9c0e2b2e6e4f5a6b7c8d9e0f1a2b3c4d5e
            branch refs/heads/main
            OUT;

        self::assertSame([], GitOutput::branchesOf($listed, self::PREFIX));
    }

    /** A checkout on no branch has none to name; its metadata says what it was made for. */
    public function testAWorktreeWithoutABranchIsNotNamed(): void
    {
        $listed = <<<'OUT'
            worktree /home/dev/projects/blog/.worktrees/v13
            HEAD 1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d
            detached
            OUT;

        self::assertSame([], GitOutput::branchesOf($listed, self::PREFIX));
    }

    public function testWhatAWorktreeHoldsIsReadOffItsBlock(): void
    {
        $written = <<<'OUT'
            # /home/dev/projects/blog/.worktrees/v13
            changes 2
            tracking 3	1
            # /home/dev/projects/blog/.worktrees/feature-checkout
            changes 0
            tracking 0	0
            OUT;

        $states = GitOutput::statesOf($written);

        self::assertSame(2, $states['v13']->changes);
        self::assertSame(3, $states['v13']->ahead);
        self::assertSame(1, $states['v13']->behind);
        self::assertSame(0, $states['feature-checkout']->ahead);
    }

    /**
     * A branch that tracks nothing has no counts, and nought would read as "in step
     * with the remote" about a branch that is on no remote at all.
     */
    public function testABranchThatTracksNothingIsNotInStepWithAnything(): void
    {
        $written = <<<'OUT'
            # /home/dev/projects/blog/.worktrees/spike-idea
            changes 7
            OUT;

        $state = GitOutput::statesOf($written)['spike-idea'];

        self::assertSame(7, $state->changes);
        self::assertNull($state->ahead);
        self::assertNull($state->behind);
    }

    /** Nothing asked, nothing said -- and no worktree invented out of it. */
    public function testNothingSaidIsNoWorktreeAtAll(): void
    {
        self::assertSame([], GitOutput::statesOf(''));
    }

    /**
     * What hangs on it is whether a refused fetch is answered with "ddev auth ssh"
     * or with nothing: an https remote refuses for reasons of its own, and the
     * scp-like form is ssh while saying nothing about it.
     */
    public function testARemoteIsSshWhereGitSpeaksSsh(): void
    {
        self::assertTrue(GitOutput::isSsh('git@github.com:TYPO3/typo3.git'));
        self::assertTrue(GitOutput::isSsh('ssh://benjaminkott@review.typo3.org:29418/Packages/TYPO3.CMS.git'));
        self::assertTrue(GitOutput::isSsh('github.com:TYPO3/typo3.git'));
        self::assertFalse(GitOutput::isSsh('https://github.com/TYPO3/typo3.git'));
        self::assertFalse(GitOutput::isSsh('git://github.com/TYPO3/typo3.git'));
        self::assertFalse(GitOutput::isSsh('/srv/git/typo3.git'));
        self::assertFalse(GitOutput::isSsh(''));
    }

    /**
     * The list is read for what to check out next, so this decides the order they
     * stand in, which are here and nowhere else, and what each tip says. A local
     * branch and its remote are one branch, and a subject with a tab in it is
     * still one subject.
     */
    public function testTheBranchesAreReadWithWhatAListSaysAboutEachOfThem(): void
    {
        $listed = [
            "refs/heads/bugfix/flexform-migration\t1750000000\ta41f0c2\t[BUGFIX] Keep the default value",
            "refs/remotes/origin/bugfix/flexform-migration\t1749000000\t9c31b70\t[BUGFIX] Keep it earlier",
            "refs/heads/review/98211\t1740000000\t0b7fa63\t[BUGFIX] Show it only once",
            "refs/remotes/origin/main\t1730000000\tb02c8d4\t[TASK] Raise doctrine/dbal\tand then some",
            // Not a branch: the name the remote's own HEAD carries, which is
            // shortened to the remote's name and passed every guard but this.
            "refs/remotes/origin/HEAD\t1730000000\tb02c8d4\t[TASK] Raise doctrine/dbal",
        ];

        $branches = GitOutput::branchesFromRefs($listed, ['refs/heads/', 'refs/remotes/origin/']);

        self::assertSame(
            ['bugfix/flexform-migration', 'review/98211', 'main'],
            array_map(static fn (Branch $branch): string => $branch->name, $branches),
        );
        // The local ref came first and is what dates the branch.
        self::assertSame(1750000000, $branches[0]->when);
        self::assertTrue($branches[0]->onRemote);
        self::assertFalse($branches[1]->onRemote);
        self::assertSame(['sha' => 'b02c8d4', 'subject' => "[TASK] Raise doctrine/dbal\tand then some"], $branches[2]->tip);
    }

    /**
     * Four answers in one shell, with a heading before each. The heading is a
     * control character because a remote can be called almost anything: a word
     * would be a heading a repository could write for itself.
     */
    public function testOneAnswerIsSplitAtItsHeadings(): void
    {
        $said = GitOutput::sectionsOf("\x1ehead\nmaster\n\x1eworktrees\nworktree /blog\nbranch refs/heads/master\n\x1eremotes\norigin\tgit@example.org:blog.git");

        self::assertSame('master', $said['head']);
        self::assertSame("worktree /blog\nbranch refs/heads/master", $said['worktrees']);
        self::assertSame("origin\tgit@example.org:blog.git", $said['remotes']);
    }

    /** A repository with no remote answers the question with nothing, not with silence. */
    public function testASectionWithNothingUnderItIsEmptyAndNotAbsent(): void
    {
        $said = GitOutput::sectionsOf("\x1ehead\nmain\n\x1eremotes\n");

        self::assertArrayHasKey('remotes', $said);
        self::assertSame('', $said['remotes']);
        self::assertSame([], GitOutput::remotesOf($said['remotes']));
    }

    /**
     * git writes no control characters, so what a repository can produce stays
     * inside its section.
     */
    public function testALineThatMerelyLooksLikeAHeadingStaysInItsSection(): void
    {
        $said = GitOutput::sectionsOf("\x1eremotes\n## remotes\tgit@example.org:odd.git");

        self::assertSame(['## remotes' => 'git@example.org:odd.git'], GitOutput::remotesOf($said['remotes']));
    }
}
