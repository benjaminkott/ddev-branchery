<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Git\History;
use App\Git\WorkingCopy;
use App\Service\Git;
use App\Tests\Fake\Wiring;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * What is made of what git said.
 *
 * The parsing has a suite of its own -- GitOutput reads a block of text and is
 * held to it. What had none is the assembling: which question is asked, in what
 * order, and what the two answers together mean. A commit is "not pushed"
 * because one call said so and another did not mention it, and getting that
 * backwards puts a warning on every commit of a fresh fork or on none of them.
 */
#[CoversClass(History::class)]
#[CoversClass(WorkingCopy::class)]
#[CoversClass(Git::class)]
final class GitReadingTest extends TestCase
{
    private Wiring $wiring;

    protected function setUp(): void
    {
        $this->wiring = new Wiring(sys_get_temp_dir() . '/branchery-reading-' . bin2hex(random_bytes(4)));
        $this->wiring->worktree('demo');
    }

    protected function tearDown(): void
    {
        $this->wiring->remove();
    }

    /** One line of "git log" in the format this asks for. */
    private static function logged(string $id, string $sha, string $subject, int $when = 1750000000): string
    {
        return implode("\x1f", [$id, $sha, $subject, (string) $when, 'A Developer']);
    }

    /**
     * A commit above the upstream is one the remote has never seen, which is the
     * whole of what "not pushed" means and the one thing a reader acts on.
     */
    public function testACommitAboveTheUpstreamIsNotPushed(): void
    {
        $web = $this->wiring->web;
        // Registered before the plainer "rev-list": the first match answers.
        $web->answer('rev-list HEAD@{upstream}..HEAD', 'aaa111');
        $web->answer('log --max-count=', implode("\n", [
            self::logged('aaa111', 'aaa111a', 'The one above'),
            self::logged('bbb222', 'bbb222b', 'The one below'),
        ]));

        $commits = $this->wiring->git->commits('demo');

        self::assertSame('aaa111a', $commits[0]['sha']);
        self::assertFalse($commits[0]['pushed'], 'a commit the remote has not seen was reported as pushed');
        self::assertTrue($commits[1]['pushed'], 'a commit the remote has was reported as unpushed');
    }

    /**
     * A fresh fork follows nothing yet, and asking about an upstream it has none
     * of fails. Read as "everything is unpushed", every commit it was cut with
     * carries the warning -- so what is asked instead is what no remote holds.
     */
    public function testABranchFollowingNothingIsMeasuredAgainstEveryRemote(): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-list HEAD@{upstream}..HEAD', '', 1);
        $web->answer('rev-list HEAD --not --remotes', 'aaa111');
        $web->answer('log --max-count=', implode("\n", [
            self::logged('aaa111', 'aaa111a', 'Mine alone'),
            self::logged('bbb222', 'bbb222b', 'Cut with the branch'),
        ]));

        $commits = $this->wiring->git->commits('demo');

        self::assertTrue($web->ran('--not --remotes'), 'nothing asked what no remote holds');
        self::assertFalse($commits[0]['pushed']);
        self::assertTrue($commits[1]['pushed'], 'a commit the fork was cut with was called unpushed');
    }

    /**
     * git answering nothing at all is not "every commit is pushed": it is not
     * knowing, and a tick beside work that is here and nowhere else is the one
     * answer that costs something.
     */
    public function testNothingKnownAboutTheRemoteIsNotAClaimThatEverythingIsPushed(): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-list HEAD@{upstream}..HEAD', '', 1);
        $web->answer('rev-list HEAD --not --remotes', '', 1);
        $web->answer('log --max-count=', self::logged('aaa111', 'aaa111a', 'Somewhere'));

        $commits = $this->wiring->git->commits('demo');

        self::assertFalse($commits[0]['pushed'], 'not knowing was reported as pushed');
    }

    /**
     * Everything above where the branch was cut is its own; the rest is the base
     * showing through, and the list draws the two differently.
     */
    public function testOnlyTheCommitsAboveTheCutAreTheBranchesOwn(): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-list HEAD@{upstream}..HEAD', '');
        $web->answer('rev-list main..HEAD', 'aaa111');
        $web->answer('log --max-count=', implode("\n", [
            self::logged('aaa111', 'aaa111a', 'Above the cut'),
            self::logged('bbb222', 'bbb222b', 'The base showing through'),
        ]));

        $commits = $this->wiring->git->commits('demo', 10, 0, 'main');

        self::assertTrue($commits[0]['own']);
        self::assertFalse($commits[1]['own'], 'a commit of the base was called the branch\'s own');
    }

    /** The trunk is cut from nothing, so everything on it is its own. */
    public function testWithoutABaseEverythingIsTheBranchesOwn(): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-list HEAD@{upstream}..HEAD', '');
        $web->answer('log --max-count=', self::logged('aaa111', 'aaa111a', 'On the trunk'));

        $commits = $this->wiring->git->commits('demo');

        self::assertTrue($commits[0]['own']);
    }

    /**
     * The body is read whole and last: it is the one field that carries newlines,
     * and a separator inside it would take the fields after it with it.
     */
    public function testACommitIsReadWithItsBodyWhole(): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-list', '');
        $web->answer('--no-patch', implode("\x1f", [
            'aaa111ffffffffffffffffffffffffffffffffff',
            'aaa111a',
            'The subject',
            '1750000000',
            'A Developer',
            'bbb222b ccc333c',
            "A body over\ntwo lines, with an \x1f in it.\n",
        ]));
        $web->answer('--name-status', "M\tsrc/Thing.php");

        $commit = $this->wiring->git->commit('demo', 'aaa111a');

        self::assertNotNull($commit);
        self::assertSame('The subject', $commit['subject']);
        self::assertSame("A body over\ntwo lines, with an \x1f in it.", $commit['body']);
        self::assertSame(['bbb222b', 'ccc333c'], $commit['parents'], 'a merge lost one of its parents');
    }

    /**
     * A sha in an address outlives the branch it was read on. Null is what makes
     * that a page saying so rather than git's complaint about a bad object.
     */
    public function testACommitThisBranchDoesNotCarryIsNothing(): void
    {
        $this->wiring->web->answer('--no-patch', '', 1);

        self::assertNull($this->wiring->git->commit('demo', 'deadbee'));
    }

    /** And an answer cut short is no answer: half a record is not a commit. */
    public function testAnAnswerMissingItsFieldsIsNothing(): void
    {
        $this->wiring->web->answer('--no-patch', "aaa111\x1faaa111a\x1fThe subject");

        self::assertNull($this->wiring->git->commit('demo', 'aaa111a'));
    }

    /**
     * A rename names both paths. The one there afterwards is the last, and taking
     * the first offers a diff for a file that is not in the checkout any more.
     */
    public function testARenameIsNamedByThePathItEndsAt(): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-list', '');
        $web->answer('--no-patch', implode("\x1f", ['aaa111', 'aaa111a', 'Moved it', '1750000000', 'Dev', '', '']));
        $web->answer('--name-status', "R096\tsrc/Old.php\tsrc/New.php");

        $commit = $this->wiring->git->commit('demo', 'aaa111a');

        self::assertNotNull($commit);
        self::assertSame([['status' => 'renamed', 'path' => 'src/New.php']], $commit['files']);
    }

    /**
     * git's own answer to what a merge changed is nothing, and inventing a
     * combined diff would decide something git does not.
     */
    public function testAMergeAnswersWithNoFiles(): void
    {
        $web = $this->wiring->web;
        $web->answer('rev-list', '');
        $web->answer('--no-patch', implode("\x1f", ['aaa111', 'aaa111a', 'Merge branch', '1750000000', 'Dev', 'b c', '']));
        $web->answer('--name-status', '', 1);

        $commit = $this->wiring->git->commit('demo', 'aaa111a');

        self::assertNotNull($commit);
        self::assertSame([], $commit['files']);
    }

    // -- the working copy ---------------------------------------------------

    /**
     * Untracked files are asked for one by one. Folded, a directory git has never
     * seen is one line: a row counted three for a hundred new files, and offered
     * a diff for a directory, which there is none of.
     */
    public function testEveryUntrackedFileIsNamed(): void
    {
        $this->wiring->web->answer('status --porcelain', " M src/Thing.php\n?? new/a.php\n?? new/b.php");

        $changes = $this->wiring->git->changes('demo');

        self::assertCount(3, $changes);
        self::assertTrue($this->wiring->web->ran('--untracked-files=all'), 'the untracked files were folded');
    }

    /**
     * An untracked file has no HEAD to differ from, so it is shown whole -- and
     * "--no-index" answers 1 where the files differ, which is not a failure.
     */
    public function testAnUntrackedFileIsShownWholeRatherThanFailing(): void
    {
        $web = $this->wiring->web;
        $web->answer('ls-files --error-unmatch', '', 1);
        $web->answer('diff --no-index', "+++ b/new.php\n@@ -0,0 +1 @@\n+<?php\n", 1);

        $diff = $this->wiring->git->diff('demo', 'new.php');

        self::assertNotSame([], $diff['lines'], 'an untracked file came back with no diff at all');
    }

    /** A diff that actually failed is not one to draw as an empty change. */
    public function testADiffThatFailedIsSaidRatherThanDrawnEmpty(): void
    {
        $web = $this->wiring->web;
        $web->answer('ls-files --error-unmatch', '');
        $web->answer('diff HEAD', '', 128, 'fatal: bad revision');

        $this->expectException(\RuntimeException::class);

        $this->wiring->git->diff('demo', 'src/Thing.php');
    }

    /** An ignored directory is one entry, and the trailing slash is not its name. */
    public function testAnIgnoredDirectoryIsOneEntryWithoutItsSlash(): void
    {
        $this->wiring->web->answer('--others --ignored', "vendor/\nnode_modules/\n.env");

        self::assertSame(
            ['.env', 'node_modules', 'vendor'],
            $this->wiring->git->ignoredEntries('demo'),
        );
    }

    /** Untracked files are not counted: a hard reset leaves them where they are. */
    public function testWhatAResetWouldWriteOverCountsAndNothingElse(): void
    {
        $this->wiring->web->answer('status --porcelain', " M a.php\nA  b.php\n?? c.php");

        self::assertSame(2, $this->wiring->git->modifiedCount('demo'));
        self::assertSame(3, $this->wiring->git->changeCount('demo'));
    }

    /** A checkout following nothing is not one in step: it is on no remote. */
    public function testABranchThatTracksNothingIsNotInStep(): void
    {
        $this->wiring->web->answer('rev-list --left-right --count', '', 128, 'fatal: no upstream');

        self::assertNull($this->wiring->git->tracking('demo'));
    }
}
