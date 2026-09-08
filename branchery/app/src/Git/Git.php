<?php

declare(strict_types=1);

namespace App\Git;

use App\CommandResult;
use App\Model\Branch;
use App\Model\WorktreeState;

/**
 * git, as this application asks it.
 *
 * Twelve classes ask questions of git and most of them ask across every subject
 * at once -- a worktree's row wants the branch it is on, the commits it carries,
 * what is uncommitted in it and how far it stands from the trunk. So there is
 * one name for all of it, and the subjects live behind it in App\Git: how a
 * command is run, what the repository says about itself, what a branch carries,
 * what a checkout has uncommitted, and what changes the repository.
 *
 * What used to be written out here and is now designed away: every method that
 * wrote had to remember to drop the nine answers kept for the request, and two
 * of them had stopped remembering. The Runner tells whoever kept one.
 */
final readonly class Git
{
    public function __construct(
        private Runner $runner,
        private Facts $facts,
        private History $history,
        private WorkingCopy $workingCopy,
        private Repository $repository,
        private Images $images,
    ) {
    }

    /** A question at the project's own checkout, for a caller that has one to ask. */
    public function run(string ...$arguments): CommandResult
    {
        return $this->runner->run(...$arguments);
    }

    public function inWorktree(string $name, string ...$arguments): CommandResult
    {
        return $this->runner->inWorktree($name, ...$arguments);
    }

    // What the repository says about itself.

    public function currentBranch(): string
    {
        return $this->facts->currentBranch();
    }

    /** @return array<string, string> */
    public function worktreeBranches(): array
    {
        return $this->facts->worktreeBranches();
    }

    /** @return list<string> */
    public function remotes(): array
    {
        return $this->facts->remotes();
    }

    /** @return array<string, string> */
    public function remoteUrls(): array
    {
        return $this->facts->remoteUrls();
    }

    public function defaultRemote(): ?string
    {
        return $this->facts->defaultRemote();
    }

    public function repositoryUrl(?string $remote = null): ?string
    {
        return $this->facts->repositoryUrl($remote);
    }

    public function reachesOverSsh(?string $remote = null): bool
    {
        return $this->facts->reachesOverSsh($remote);
    }

    /** @return list<Branch> */
    public function branchesByRecency(?string $remote = null): array
    {
        return $this->facts->branchesByRecency($remote);
    }

    public function branchNamed(string $branch): ?Branch
    {
        return $this->facts->branchNamed($branch);
    }

    public function hasRef(string $ref): bool
    {
        return $this->facts->hasRef($ref);
    }

    public function refOf(string $branch): ?string
    {
        return $this->facts->refOf($branch);
    }

    public function defaultBranch(): ?string
    {
        return $this->facts->defaultBranch();
    }

    /** @return array{merged: list<string>, gone: list<string>} */
    public function finishedBranches(string $base): array
    {
        return $this->facts->finishedBranches($base);
    }

    /** @return array<string, WorktreeState> */
    public function worktreeStates(): array
    {
        return $this->facts->worktreeStates();
    }

    public function checkoutState(?string $name = null): WorktreeState
    {
        return $this->facts->checkoutState($name);
    }

    /**
     * @param list<string> $branches
     * @param list<string> $candidates
     *
     * @return array<string, array<string, array{int, int}>> branch => candidate => [moved, own]
     */
    public function distances(array $branches, array $candidates): array
    {
        return $this->facts->distances($branches, $candidates);
    }

    // What a branch carries.

    public function fileAt(string $ref, string $path): ?string
    {
        return $this->history->fileAt($ref, $path);
    }

    public function upstreamOf(?string $name = null, string $ref = 'HEAD'): ?string
    {
        return $this->history->upstreamOf($name, $ref);
    }

    /** @return ?array{int, int} */
    public function tracking(?string $worktree = null, string $ref = 'HEAD'): ?array
    {
        return $this->history->tracking($worktree, $ref);
    }

    /**
     * @return list<array{sha: string, subject: string, when: int, author: string, pushed: bool, own: bool}>
     */
    public function commits(?string $name = null, int $limit = 10, int $skip = 0, ?string $base = null, string $ref = 'HEAD'): array
    {
        return $this->history->commits($name, $limit, $skip, $base, $ref);
    }

    /**
     * @return ?array{sha: string, id: string, subject: string, body: string, when: int, author: string, parents: list<string>, pushed: bool, files: list<array{status: string, path: string}>}
     */
    public function commit(?string $name, string $sha): ?array
    {
        return $this->history->commit($name, $sha);
    }

    /** @return array{lines: list<array{kind: string, text: string}>, truncated: bool} */
    public function commitDiff(?string $name, string $sha, string $path): array
    {
        return $this->history->commitDiff($name, $sha, $path);
    }

    public function hasCommit(?string $name, string $sha): bool
    {
        return $this->history->hasCommit($name, $sha);
    }

    /**
     * The two sides of a change in an image, a diff of one saying only that it
     * changed.
     *
     * @return array{before: ?array{blob: ?string, bytes: int}, after: ?array{blob: ?string, bytes: int}}
     */
    public function commitImage(?string $name, string $sha, string $path): array
    {
        return $this->images->inCommit($name, $sha, $path);
    }

    /** @return list<array{sha: string, subject: string, when: int, author: string}> */
    public function unpushed(string $name): array
    {
        return $this->history->unpushed($name);
    }

    // What a checkout has uncommitted.

    public function tracks(string $worktree, string $path): bool
    {
        return $this->workingCopy->tracks($worktree, $path);
    }

    /** @return list<array{status: string, path: string}> */
    public function changes(?string $name): array
    {
        return $this->workingCopy->changes($name);
    }

    /** @return array{lines: list<array{kind: string, text: string}>, truncated: bool} */
    public function diff(?string $name, string $path): array
    {
        return $this->workingCopy->diff($name, $path);
    }

    /**
     * @return array{before: ?array{blob: ?string, bytes: int}, after: ?array{blob: ?string, bytes: int}}
     */
    public function image(?string $name, string $path): array
    {
        return $this->images->uncommitted($name, $path);
    }

    /** One side of such a change, as itself -- what the door beside the diff hands out. */
    public function imageBytes(?string $name, ?string $blob, string $path): ?string
    {
        return $this->images->bytes($name, $blob, $path);
    }

    public function changeCount(string $name): int
    {
        return $this->workingCopy->changeCount($name);
    }

    public function modifiedCount(string $name): int
    {
        return $this->workingCopy->modifiedCount($name);
    }

    /** @return list<string> */
    public function ignoredEntries(?string $name): array
    {
        return $this->workingCopy->ignoredEntries($name);
    }

    // What changes the repository.

    /**
     * Without a name, the remote the repository would use. One with no remote at
     * all answers as the failure it is rather than being asked to fetch from
     * nowhere.
     */
    public function fetch(?string $remote = null): CommandResult
    {
        $remote ??= $this->defaultRemote();
        if ($remote === null) {
            return new CommandResult(1, '', 'The repository has no remote to fetch from.');
        }

        return $this->repository->fetch($remote);
    }

    public function resetToUpstream(string $name): CommandResult
    {
        return $this->repository->resetToUpstream($name);
    }

    public function fastForward(string $name): CommandResult
    {
        return $this->repository->fastForward($name);
    }

    public function switchBranch(string $name, string $branch): CommandResult
    {
        return $this->repository->switchBranch($name, $branch);
    }

    public function addExistingBranch(string $name, string $branch): CommandResult
    {
        return $this->repository->addExistingBranch($name, $branch);
    }

    public function addNewBranch(string $name, string $branch, string $startPoint): CommandResult
    {
        return $this->repository->addNewBranch($name, $branch, $startPoint);
    }

    public function removeWorktree(string $name): CommandResult
    {
        return $this->repository->removeWorktree($name);
    }

    public function pruneWorktrees(): void
    {
        $this->repository->pruneWorktrees();
    }

    public function deleteBranch(string $branch): CommandResult
    {
        return $this->repository->deleteBranch($branch);
    }

    public function repairPaths(string $name): void
    {
        $this->repository->repairPaths($name);
    }
}
