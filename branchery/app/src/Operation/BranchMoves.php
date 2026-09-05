<?php

declare(strict_types=1);

namespace App\Operation;

use App\Git\Git;
use App\Git\SshAgent;
use App\Jobs\StepReporter;
use App\Text;
use App\Worktree\WorktreeRepository;

/**
 * The three operations that move a checkout rather than build one: bringing a
 * branch up to what its remote has, going back to the branch the worktree was
 * made for, and putting a branch back on its remote.
 *
 * None of them touches the dependencies or the database. That is the point of
 * having them apart from a build: the list already has a word for new code
 * against an old vendor directory, and a catch-up that costs minutes is one
 * nobody makes.
 *
 * The worktree is claimed by the caller. These are the steps inside that claim.
 */
final readonly class BranchMoves
{
    public function __construct(
        private Git $git,
        private WorktreeRepository $worktrees,
        private SshAgent $ssh,
    ) {
    }

    /**
     * Refused where moving the branch would be more than moving it, git answering
     * that with "Not possible to fast-forward" and nothing about what to do.
     */
    public function pull(string $name, StepReporter $reporter): void
    {
        $branch = $this->branchIn($name);
        $upstream = $this->git->upstreamOf($name);
        if ($upstream === null) {
            throw new \RuntimeException(sprintf('"%s" follows no remote branch, so there is nothing to bring in. Push it once and it will.', $branch));
        }

        $reporter->expect(2);
        $this->bringUpToDate($name, $branch, $upstream, $reporter);
        $reporter->finish();
    }

    /**
     * The way back out of trying a patch, after which the worktree called "14-3",
     * served at 14-3.… and holding a database named after it, is on something else.
     * The branch it leaves stays where it is: this moves the checkout, not the work.
     */
    public function restore(string $name, StepReporter $reporter): void
    {
        $meta = $this->worktrees->metadata($name);
        $wanted = (string) ($meta['branch'] ?? '');
        if ($wanted === '') {
            throw new \RuntimeException(sprintf('Nothing was written down about which branch "%s" was made for, so there is nowhere to go back to.', $name));
        }

        $left = $this->branchIn($name);
        if ($left === $wanted) {
            throw new \RuntimeException(sprintf('"%s" is on %s already.', $name, $wanted));
        }

        // git would refuse this itself, but with a path rather than the name. The
        // key is a worktree name, and one made of digits comes back as an integer.
        $elsewhere = array_search($wanted, $this->git->worktreeBranches(), true);
        if ($elsewhere !== false && (string) $elsewhere !== $name) {
            throw new \RuntimeException(sprintf('%s is checked out in "%s". A branch can only be in one worktree at a time.', $wanted, (string) $elsewhere));
        }

        $reporter->expect(3);
        $reporter->step(sprintf('Going back to %s', $wanted));
        $switched = $this->git->switchBranch($name, $wanted);
        if (!$switched->isSuccessful()) {
            throw new \RuntimeException($switched->message());
        }
        $reporter->note(sprintf('%s stays where it is; nothing committed on it is lost.', $left));

        // Worth having with nothing to bring in: a branch that was never pushed is
        // exactly the kind a worktree is made for.
        $upstream = $this->git->upstreamOf($name);
        if ($upstream === null) {
            $reporter->note(sprintf('%s follows no remote branch, so there is nothing to bring in.', $wanted));
            $reporter->finish();

            return;
        }

        $this->bringUpToDate($name, $wanted, $upstream, $reporter);
        $reporter->finish();
    }

    /**
     * A press of its own and not a corner of the catch-up, because rebasing or
     * letting go is not the tool's choice to make. The commits are left in no
     * branch and `git reflog` finds them until git collects; uncommitted work has
     * no such second chance, so an unclean working copy is refused.
     */
    public function discard(string $name, StepReporter $reporter): void
    {
        $branch = $this->branchIn($name);
        $upstream = $this->git->upstreamOf($name);
        if ($upstream === null) {
            throw new \RuntimeException(sprintf('"%s" follows no remote branch. Everything on it is here and nowhere else, so there is nothing to put it back onto.', $branch));
        }

        // Only what the reset would write over: an untracked file stays.
        $changes = $this->git->modifiedCount($name);
        if ($changes > 0) {
            throw new \RuntimeException(sprintf('%s in this worktree were never committed, and putting the branch back would write over them. Commit or stash them first.', Text::count($changes, 'change')));
        }

        $reporter->expect(2);
        $this->fetchUpstream($upstream, $reporter);

        $reporter->step(sprintf('Putting %s back on %s', $branch, $upstream));
        $distance = $this->git->tracking($name);
        $ahead = $distance[0] ?? 0;
        $behind = $distance[1] ?? 0;
        if ($ahead === 0 && $behind === 0) {
            $reporter->note(sprintf('%s is already what %s has.', $branch, $upstream));
            $reporter->finish();

            return;
        }

        $dropped = $this->git->unpushed($name);
        $reset = $this->git->resetToUpstream($name);
        if (!$reset->isSuccessful()) {
            throw new \RuntimeException($reset->message());
        }

        foreach ($dropped as $commit) {
            $reporter->note(sprintf('Dropped %s %s', $commit['sha'], $commit['subject']));
        }
        if ($ahead > 0) {
            $reporter->note(sprintf('%s no longer in any branch. "git reflog" in this worktree still finds them until git next collects.', Text::count($ahead, 'commit')));
        }
        $reporter->finish();
    }

    /**
     * Shared by the two operations that end in them. It neither claims the worktree
     * nor finishes the report: only the caller knows how many steps there are.
     */
    private function bringUpToDate(string $name, string $branch, string $upstream, StepReporter $reporter): void
    {
        $this->fetchUpstream($upstream, $reporter);

        $reporter->step(sprintf('Moving %s onto %s', $branch, $upstream));
        $distance = $this->git->tracking($name);
        $ahead = $distance[0] ?? 0;
        $behind = $distance[1] ?? 0;
        if ($ahead > 0 && $behind > 0) {
            throw new \RuntimeException(sprintf('%s and %s have gone their own ways -- %s here, %s there. Merging or rebasing that is yours to decide, in the worktree itself.', $branch, $upstream, Text::count($ahead, 'commit'), Text::count($behind, 'commit')));
        }
        if ($behind === 0) {
            $reporter->note(sprintf('%s is already what %s has.', $branch, $upstream));

            return;
        }

        $moved = $this->git->fastForward($name);
        if (!$moved->isSuccessful()) {
            throw new \RuntimeException($moved->message());
        }

        // What was built is now built from something else; the row says so from
        // here on, and offers provisioning again.
        $reporter->note(sprintf('%s brought in. The dependencies and the database are still the ones of before.', Text::count($behind, 'commit')));
    }

    /**
     * A remote name cannot hold a slash and a branch name can, so what stands
     * before the first one is the remote -- "origin" out of "origin/feature/search".
     */
    private function fetchUpstream(string $upstream, StepReporter $reporter): void
    {
        $remote = strstr($upstream, '/', true) ?: $upstream;
        $reporter->step(sprintf('Updating %s', $remote));
        $fetched = $this->git->fetch($remote);
        if (!$fetched->isSuccessful()) {
            throw new \RuntimeException($this->ssh->explain($remote, $fetched->message(), $reporter));
        }
    }

    private function branchIn(string $name): string
    {
        return $this->git->inWorktree($name, 'rev-parse', '--abbrev-ref', 'HEAD')->output;
    }
}
