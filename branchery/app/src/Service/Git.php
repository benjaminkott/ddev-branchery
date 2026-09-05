<?php

declare(strict_types=1);

namespace App\Service;

use App\Model\Branch;
use App\Model\WorktreeState;

/**
 * Git calls inside the web container. Paths are built from the host path: git
 * writes them into its bookkeeping absolutely, and they have to be correct on
 * the host too.
 */
final class Git
{
    /** Answers kept for one request; dropped by forget() wherever this class writes. */
    private ?string $currentBranch = null;

    /** @var ?list<string> */
    private ?array $remotes = null;

    /** @var ?array<string, string> */
    private ?array $remoteUrls = null;

    /** @var ?array<string, string> */
    private ?array $worktreeBranches = null;

    /** What the remote calls its own branch; "" once asked and there was none. */
    private ?string $defaultBranch = null;

    /** @var ?array{merged: list<string>, gone: list<string>} */
    private ?array $finished = null;

    /** Read alongside the worktrees in worktreeStates(), which the page asks for anyway. */
    private ?WorktreeState $projectState = null;

    /** @var ?list<Branch> */
    private ?array $byRecency = null;

    /**
     * How far pairs of branches stand apart. Kept pair by pair, because the project
     * row asks one branch against every candidate and the list asks every branch
     * against every candidate -- the first is a corner of the second.
     *
     * @var array<string, array<string, array{int, int}>>
     */
    private array $distances = [];

    public function __construct(
        private readonly Project $project,
        private readonly WebContainer $web,
        private readonly Locks $locks,
    ) {
    }

    /** Every cached answer at once: a stale one shows a branch that has moved. */
    private function forget(): void
    {
        $this->currentBranch = null;
        $this->remotes = null;
        $this->remoteUrls = null;
        $this->worktreeBranches = null;
        $this->defaultBranch = null;
        $this->finished = null;
        $this->byRecency = null;
        $this->distances = [];
        $this->projectState = null;
    }

    public function run(string ...$arguments): CommandResult
    {
        return $this->git($this->project->hostRoot(), false, ...$arguments);
    }

    /** git doing something rather than being asked: its output goes to the operation log. */
    private function work(string ...$arguments): CommandResult
    {
        return $this->git($this->project->hostRoot(), true, ...$arguments);
    }

    public function inWorktree(string $name, string ...$arguments): CommandResult
    {
        return $this->git($this->project->hostWorktreeDirectory($name), false, ...$arguments);
    }

    /** A worktree by name, or the project's own -- which has no directory under worktrees/. */
    private function inCheckout(?string $name, string ...$arguments): CommandResult
    {
        return $name === null ? $this->run(...$arguments) : $this->inWorktree($name, ...$arguments);
    }

    /** The same, for git doing something rather than being asked. */
    private function workInWorktree(string $name, string ...$arguments): CommandResult
    {
        return $this->git($this->project->hostWorktreeDirectory($name), true, ...$arguments);
    }

    private function git(string $directory, bool $working, string ...$arguments): CommandResult
    {
        return $this->web->run(array_values(['git', '-C', $directory, ...$arguments]), null, $working);
    }

    /** A file at a ref, so a branch can be read before anything is created for it. */
    public function fileAt(string $ref, string $path): ?string
    {
        $result = $this->run('show', $ref . ':' . $path);

        return $result->isSuccessful() ? $result->output : null;
    }

    public function tracks(string $worktree, string $path): bool
    {
        return $this->inWorktree($worktree, 'ls-files', '--error-unmatch', '--', $path)->isSuccessful();
    }

    public function currentBranch(): string
    {
        if ($this->currentBranch === null) {
            $this->read();
        }

        return $this->currentBranch ?? '';
    }

    public function hasRef(string $ref): bool
    {
        return $this->run('rev-parse', '--verify', '--quiet', $ref)->isSuccessful();
    }

    /**
     * Origin first where there is one. Neither the name nor the count is given, so
     * nothing may assume "origin".
     *
     * @return list<string>
     */
    public function remotes(): array
    {
        if ($this->remotes === null) {
            $this->read();
        }

        return $this->remotes ?? [];
    }

    /**
     * Name and address in one question: everything that wants the one wants the other.
     *
     * @return array<string, string>
     */
    public function remoteUrls(): array
    {
        if ($this->remoteUrls === null) {
            $this->read();
        }

        return $this->remoteUrls ?? [];
    }

    /**
     * What the repository is asked about itself, in one shell. The page wants all
     * of it on every look, and each is otherwise a container call away; a caller
     * wanting one pays for the rest.
     */
    private function read(): void
    {
        $script = <<<'SH'
            printf '\036head\n'
            git -C "$1" rev-parse --abbrev-ref HEAD 2>/dev/null
            printf '\036worktrees\n'
            git -C "$1" worktree list --porcelain 2>/dev/null
            printf '\036remotes\n'
            git -C "$1" remote | while IFS= read -r remote; do
                printf '%s\t%s\n' "$remote" "$(git -C "$1" remote get-url "$remote" 2>/dev/null)"
            done
            SH;

        $said = GitOutput::sectionsOf($this->web->run([
            'bash', '-c', $script, 'branchery', $this->project->hostRoot(),
        ])->output);

        $this->currentBranch = trim($said['head'] ?? '');
        $this->worktreeBranches = GitOutput::branchesOf(
            $said['worktrees'] ?? '',
            $this->project->hostWorktreesDirectory() . '/',
        );
        $this->remoteUrls = GitOutput::remotesOf($said['remotes'] ?? '');
        // A remote called "13" becomes an integer key, which no strict
        // comparison against a name from a request would match.
        $this->remotes = array_map(strval(...), array_keys($this->remoteUrls));
    }

    public function defaultRemote(): ?string
    {
        return $this->remotes()[0] ?? null;
    }

    /**
     * Not every remote is a page -- one cloned from a directory has nowhere to link
     * to, and says so with null rather than an address that opens a broken tab.
     */
    public function repositoryUrl(?string $remote = null): ?string
    {
        $url = $this->urlOf($remote);

        return $url === null ? null : GitOutput::browsableRemote($url);
    }

    private function urlOf(?string $remote): ?string
    {
        $remote ??= $this->defaultRemote();
        $url = $remote === null ? '' : $this->remoteUrls()[$remote] ?? '';

        return $url === '' ? null : $url;
    }

    /**
     * By date and not by name: what somebody wants is nearly always what they were
     * on last. Local and remote in one question, which is what makes the order
     * between them real; a branch on both is dated by the commit it has locally.
     *
     * @return list<Branch>
     */
    public function branchesByRecency(?string $remote = null): array
    {
        // The usual question is answered out of readBranches().
        if ($remote === null) {
            if ($this->byRecency === null) {
                $this->readBranches();
            }

            return $this->byRecency ?? [];
        }
        $namespaces = $this->branchNamespaces($remote);
        $result = $this->run('for-each-ref', '--sort=-committerdate', '--format=' . self::BRANCH_FORMAT, ...$namespaces);

        return GitOutput::branchesFromRefs($result->lines(), $namespaces);
    }

    /** Where a branch is, when it moved, and its tip. */
    private const string BRANCH_FORMAT = '%(refname)%09%(committerdate:unix)%09%(objectname:short)%09%(contents:subject)';

    /**
     * A pattern matches at the slash, so "feature" brings "feature/checkout" along;
     * only the branch asked for is kept.
     */
    public function branchNamed(string $branch): ?Branch
    {
        $namespaces = $this->branchNamespaces();
        $result = $this->run(
            'for-each-ref',
            '--sort=-committerdate',
            '--format=' . self::BRANCH_FORMAT,
            ...array_map(static fn (string $namespace): string => $namespace . $branch, $namespaces),
        );

        foreach (GitOutput::branchesFromRefs($result->lines(), $namespaces) as $found) {
            if ($found->name === $branch) {
                return $found;
            }
        }

        return null;
    }

    /**
     * Its own ref, or the remote's where the branch is only there -- such a branch
     * has no short name that resolves. Null where neither is there.
     */
    public function refOf(string $branch): ?string
    {
        if ($this->hasRef('refs/heads/' . $branch)) {
            return $branch;
        }
        $remote = $this->defaultRemote();
        if ($remote !== null && $this->hasRef('refs/remotes/' . $remote . '/' . $branch)) {
            return $remote . '/' . $branch;
        }

        return null;
    }

    /**
     * @return list<string>
     */
    private function branchNamespaces(?string $remote = null): array
    {
        $remote ??= $this->defaultRemote();
        $namespaces = ['refs/heads/'];
        if ($remote !== null) {
            $namespaces[] = 'refs/remotes/' . $remote . '/';
        }

        return $namespaces;
    }

    /**
     * Asked only after a fetch has failed, so an https remote is not blamed on a
     * missing ssh key and the developer sent after "ddev auth ssh" for nothing.
     */
    public function reachesOverSsh(?string $remote = null): bool
    {
        $url = $this->urlOf($remote);

        return $url !== null && GitOutput::isSsh($url);
    }

    public function fetch(?string $remote = null): CommandResult
    {
        $remote ??= $this->defaultRemote();
        if ($remote === null) {
            return new CommandResult(1, '', 'The repository has no remote to fetch from.');
        }

        // Writes the remote refs every worktree reads.
        $lock = $this->locks->hold(Locks::REPOSITORY);
        $result = $this->work('fetch', $remote, '--prune');
        $this->forget();

        return $result;
    }

    /** Null where it follows none, rather than a guess at which remote was meant. */
    public function upstreamOf(?string $name = null, string $ref = 'HEAD'): ?string
    {
        $result = $this->inCheckout($name, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', $ref . '@{upstream}');

        return $result->isSuccessful() && $result->output !== '' ? $result->output : null;
    }

    /**
     * A page at a time, counted from the HEAD the first page was read at -- a commit
     * made meanwhile shifts the pages, which is what every log does. "own" is a
     * commit not in the base the branch was cut from.
     *
     * @return list<array{sha: string, subject: string, when: int, author: string, pushed: bool, own: bool}>
     */
    public function commits(?string $name = null, int $limit = 10, int $skip = 0, ?string $base = null, string $ref = 'HEAD'): array
    {
        // Matched by the whole sha: how far git abbreviates need not be the same
        // in two answers.
        $unpushed = $this->unpushedShas($name, $ref);
        $ahead = array_flip($unpushed ?? []);
        $own = $base === null ? null : array_flip($this->inCheckout($name, 'rev-list', $base . '..' . $ref)->lines());

        $commits = [];
        foreach ($this->log($name, $ref, $limit, $skip) as $commit) {
            $commits[] = [
                'sha' => $commit['sha'],
                'subject' => $commit['subject'],
                'when' => $commit['when'],
                'author' => $commit['author'],
                'pushed' => $unpushed !== null && !isset($ahead[$commit['id']]),
                'own' => $own === null || isset($own[$commit['id']]),
            ];
        }

        return $commits;
    }

    /**
     * Null where git does not know the revision -- a sha in an address outlives the
     * branch it was on, and that is a page saying so rather than an error.
     *
     * @return ?array{sha: string, id: string, subject: string, body: string, when: int, author: string, parents: list<string>, pushed: bool, files: list<array{status: string, path: string}>}
     */
    public function commit(?string $name, string $sha): ?array
    {
        // The body last and read whole: the one field carrying newlines, and the
        // one that could carry a separator of its own.
        $result = $this->inCheckout($name, 'show', '--no-patch', '--format=%H%x1f%h%x1f%s%x1f%ct%x1f%an%x1f%p%x1f%b', $sha);
        if (!$result->isSuccessful()) {
            return null;
        }
        $parts = explode("\x1f", $result->output, 7);
        if (\count($parts) < 7) {
            return null;
        }

        $unpushed = $this->unpushedShas($name);

        return [
            'sha' => $parts[1],
            'id' => $parts[0],
            'subject' => $parts[2],
            'body' => trim($parts[6]),
            'when' => (int) $parts[3],
            'author' => $parts[4],
            'parents' => array_values(array_filter(explode(' ', trim($parts[5])), static fn (string $parent): bool => $parent !== '')),
            'pushed' => $unpushed !== null && !\in_array($parts[0], $unpushed, true),
            'files' => $this->commitFiles($name, $sha),
        ];
    }

    /**
     * A merge answers with nothing, which is git's own answer: inventing a combined
     * diff would decide something git does not.
     *
     * @return list<array{status: string, path: string}>
     */
    private function commitFiles(?string $name, string $sha): array
    {
        $result = $this->inCheckout($name, 'show', '--name-status', '--format=', $sha);
        if (!$result->isSuccessful()) {
            return [];
        }

        $files = [];
        foreach ($result->lines() as $line) {
            $columns = explode("\t", $line);
            if (\count($columns) < 2) {
                continue;
            }
            // A rename names both paths; the one there afterwards is the last.
            $files[] = [
                'status' => GitOutput::statusWord($columns[0]),
                'path' => $columns[\count($columns) - 1],
            ];
        }

        return $files;
    }

    /**
     * Against its first parent, and held to the same length as the uncommitted diff.
     *
     * @return array{lines: list<array{kind: string, text: string}>, truncated: bool}
     */
    public function commitDiff(?string $name, string $sha, string $path): array
    {
        $result = $this->inCheckout($name, 'show', '--format=', $sha, '--', $path);
        if (!$result->isSuccessful()) {
            throw new \RuntimeException(sprintf('Reading %s in %s: %s', $path, $sha, $result->message()));
        }

        return GitOutput::held($result->output);
    }

    /**
     * Capped: a branch cut from an old base is ahead by everything since.
     *
     * @return list<array{sha: string, subject: string, when: int, author: string}>
     */
    public function unpushed(string $name): array
    {
        $commits = [];
        foreach ($this->log($name, '@{upstream}..HEAD', 50) as $commit) {
            $commits[] = [
                'sha' => $commit['sha'],
                'subject' => $commit['subject'],
                'when' => $commit['when'],
                'author' => $commit['author'],
            ];
        }

        return $commits;
    }

    /**
     * @return list<array{id: string, sha: string, subject: string, when: int, author: string}>
     */
    private function log(?string $name, string $range, int $limit, int $skip = 0): array
    {
        $result = $this->inCheckout(
            $name,
            'log',
            '--max-count=' . max(1, $limit),
            '--skip=' . max(0, $skip),
            '--format=%H%x1f%h%x1f%s%x1f%ct%x1f%an',
            $range,
        );
        if (!$result->isSuccessful()) {
            return [];
        }

        $commits = [];
        foreach ($result->lines() as $line) {
            $parts = explode("\x1f", $line);
            if (\count($parts) < 5) {
                continue;
            }
            $commits[] = [
                'id' => $parts[0],
                'sha' => $parts[1],
                'subject' => $parts[2],
                'when' => (int) $parts[3],
                'author' => $parts[4],
            ];
        }

        return $commits;
    }

    /**
     * Against the upstream where the branch has one; where it has none -- every
     * fresh fork -- against every remote branch, since the commits it was cut with
     * are on the remote under another name and would all read as unpushed.
     *
     * @return ?list<string>
     */
    private function unpushedShas(?string $name, string $ref = 'HEAD'): ?array
    {
        $result = $this->inCheckout($name, 'rev-list', $ref . '@{upstream}..' . $ref);
        if ($result->isSuccessful()) {
            return $result->lines();
        }
        $anywhere = $this->inCheckout($name, 'rev-list', $ref, '--not', '--remotes');

        return $anywhere->isSuccessful() ? $anywhere->lines() : null;
    }

    /**
     * The one operation here that takes something away: unpushed commits are left
     * in no branch, findable through `git reflog` and only for a while.
     */
    public function resetToUpstream(string $name): CommandResult
    {
        $result = $this->workInWorktree($name, 'reset', '--hard', '@{upstream}');
        $this->forget();

        return $result;
    }

    /**
     * `--ff-only`, so a branch that has moved on its own is refused rather than
     * merged or rebased: which of the two it should be is the developer's call.
     */
    public function fastForward(string $name): CommandResult
    {
        $result = $this->workInWorktree($name, 'merge', '--ff-only', '@{upstream}');
        $this->forget();

        return $result;
    }

    /**
     * `switch` and not `checkout`: it refuses a path given by mistake, and says no
     * where the working copy would have to be carried along or written over.
     */
    public function switchBranch(string $name, string $branch): CommandResult
    {
        $lock = $this->locks->hold(Locks::REPOSITORY);
        $result = $this->workInWorktree($name, 'switch', $branch);
        $this->forget();

        return $result;
    }

    /**
     * Exactly as it stands. `worktree add -B` would reset the branch onto its
     * remote and drop unpushed commits silently.
     */
    public function addExistingBranch(string $name, string $branch): CommandResult
    {
        return $this->checkOut($name, ['worktree', 'add', $this->pathFor($name), $branch]);
    }

    /** A worktree of a branch that does not exist yet, cut at a start point. */
    public function addNewBranch(string $name, string $branch, string $startPoint): CommandResult
    {
        return $this->checkOut($name, ['worktree', 'add', '-b', $branch, $this->pathFor($name), $startPoint]);
    }

    private function pathFor(string $name): string
    {
        return $this->project->hostWorktreeDirectory($name);
    }

    /**
     * @param list<string> $arguments
     */
    private function checkOut(string $name, array $arguments): CommandResult
    {
        // Writes the repository's list of worktrees and creates the branch. Over
        // in a moment, so the lock is here and not around the operation.
        $lock = $this->locks->hold(Locks::REPOSITORY);
        // A worktree deleted by hand is still in git's list, and blocks adding one
        // at the same path.
        $this->run('worktree', 'prune');
        $result = $this->work(...$arguments);
        $this->forget();
        if ($result->isSuccessful()) {
            $this->repairPaths($name);
        }

        return $result;
    }

    /**
     * git resolves symlinks when adding a worktree, so the container path ends up
     * in its bookkeeping and the host counts the worktree prunable. Both references
     * are reset to the host path here.
     */
    public function repairPaths(string $name): void
    {
        $hostRoot = $this->project->hostRoot();
        $seenHere = $this->project->root();
        if ($hostRoot === $seenHere) {
            return;
        }

        // Quoted for the shell, a project path being the developer's to choose, and
        // escaped for sed, which reads "&" in a replacement as the text it matched.
        $from = GitOutput::sedPattern($seenHere);
        $to = GitOutput::sedReplacement($hostRoot);
        $result = $this->web->run(['bash', '-c', sprintf(
            'gitfile=%s/.git; ' .
            '[ -f "$gitfile" ] || exit 0; ' .
            'sed -i %s "$gitfile" && ' .
            'admin=$(sed -n "s|^gitdir: ||p" "$gitfile") && ' .
            '{ [ ! -f "$admin/gitdir" ] || sed -i %s "$admin/gitdir"; }',
            escapeshellarg($this->project->hostWorktreeDirectory($name)),
            escapeshellarg(sprintf('s|^gitdir: %s|gitdir: %s|', $from, $to)),
            escapeshellarg(sprintf('s|^%s|%s|', $from, $to)),
        )]);
        // Unrepaired, the host counts the worktree prunable and finds it on no
        // branch. Neither says why, so this does.
        if (!$result->isSuccessful()) {
            throw new \RuntimeException(sprintf('Repairing the paths of the worktree "%s": %s', $name, $result->message()));
        }
    }

    /**
     * Asked before reading a change, so a stale sha in an address answers "not
     * here" rather than with git's complaint about a bad object.
     */
    public function hasCommit(?string $name, string $sha): bool
    {
        return $this->inCheckout($name, 'rev-parse', '--verify', '--quiet', $sha . '^{commit}')->isSuccessful();
    }

    /**
     * What git says is handed back: it refuses one holding a submodule or one that
     * is locked, and the caller decides what to do with the directory.
     */
    public function removeWorktree(string $name): CommandResult
    {
        $lock = $this->locks->hold(Locks::REPOSITORY);
        $result = $this->work('worktree', 'remove', '--force', $this->project->hostWorktreeDirectory($name));
        $this->forget();

        return $result;
    }

    public function pruneWorktrees(): void
    {
        $lock = $this->locks->hold(Locks::REPOSITORY);
        $this->run('worktree', 'prune');
        $this->forget();
    }

    public function deleteBranch(string $branch): CommandResult
    {
        $lock = $this->locks->hold(Locks::REPOSITORY);
        $result = $this->work('branch', '-D', $branch);
        $this->forget();

        return $result;
    }

    /**
     * "merged" is a branch whose commits are all in the base: removing it loses
     * nothing. "gone" is one whose remote counterpart was deleted, which is what a
     * squashed merge leaves behind -- likely finished, but it may still hold
     * something. Reported apart because what is safe to say of them differs.
     *
     * @return array{merged: list<string>, gone: list<string>}
     */
    public function finishedBranches(string $base): array
    {
        // The project's own branch is answered out of readBranches().
        if ($base === $this->currentBranch()) {
            if ($this->finished === null) {
                $this->readBranches();
            }

            return $this->finished ?? ['merged' => [], 'gone' => []];
        }

        $result = $this->web->run([
            'bash', '-c', self::FINISHED . "\nfinished \"\$1\" \"\$2\"", 'branchery', $this->project->hostRoot(), $base,
        ]);

        return GitOutput::finishedOf($result->output);
    }

    /** The same as a shell function, because it is asked from two scripts. */
    private const string FINISHED = <<<'SH'
        finished() {
            git -C "$1" branch --merged "$2" --format='merged %(refname:short)' 2>/dev/null
            git -C "$1" for-each-ref --format='%(refname:short) %(upstream:track,nobracket)' refs/heads/ 2>/dev/null \
                | sed -n 's/^\(.*\) gone$/gone \1/p'
        }
        SH;

    /** Three answers the page wants on every look, for one process start. */
    private function readBranches(): void
    {
        $remote = $this->defaultRemote();
        $namespaces = $this->branchNamespaces($remote);
        $script = self::FINISHED . <<<'SH'

            printf '\036default\n'
            if [ -n "$2" ]; then
                if head="$(git -C "$1" symbolic-ref --short "refs/remotes/$2/HEAD" 2>/dev/null)"; then
                    branch="${head#"$2"/}"
                    if [ "$branch" != "$head" ]; then
                        if git -C "$1" rev-parse --verify --quiet "refs/heads/$branch" >/dev/null 2>&1; then
                            printf '%s\n' "$branch"
                        else
                            printf '%s\n' "$head"
                        fi
                    fi
                fi
            fi
            printf '\036refs\n'
            git -C "$1" for-each-ref --sort=-committerdate --format="$4" refs/heads/ ${2:+"refs/remotes/$2/"} 2>/dev/null
            printf '\036finished\n'
            finished "$1" "$3"
            SH;

        $said = GitOutput::sectionsOf($this->web->run([
            'bash', '-c', $script, 'branchery',
            $this->project->hostRoot(), $remote ?? '', $this->currentBranch(), self::BRANCH_FORMAT,
        ])->output);

        $this->defaultBranch = trim($said['default'] ?? '');
        $this->byRecency = GitOutput::branchesFromRefs(
            array_values(array_filter(explode("\n", $said['refs'] ?? ''), static fn (string $line): bool => $line !== '')),
            $namespaces,
        );
        $this->finished = GitOutput::finishedOf($said['finished'] ?? '');
    }

    /**
     * What a fork is offered to carry over; without a name, the project's own. What
     * travels is decided in App\Operation\CarriedFiles.
     *
     * @return list<string>
     */
    public function ignoredEntries(?string $name): array
    {
        $arguments = ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory'];
        $result = $name === null ? $this->run(...$arguments) : $this->inWorktree($name, ...$arguments);
        // --directory lists an ignored directory as one entry.
        $entries = array_map(static fn (string $line): string => rtrim($line, '/'), $result->lines());
        sort($entries);

        return $entries;
    }

    /**
     * The row's count says something is at stake; this says what.
     *
     * @return list<array{status: string, path: string}>
     */
    public function changes(?string $name): array
    {
        return GitOutput::changesOf($this->inCheckout($name, ...self::STATUS)->output);
    }

    /**
     * File by file, including inside a directory git has never seen: folded, such a
     * directory is one line -- a row counted three for a hundred new files, and
     * offered a diff for a directory, which there is none of.
     *
     * @var list<string>
     */
    private const array STATUS = ['status', '--porcelain', '--untracked-files=all'];

    /**
     * Against HEAD, so staged and unstaged read as one change; an untracked file
     * has no HEAD to differ from and is shown whole.
     *
     * @return array{lines: list<array{kind: string, text: string}>, truncated: bool}
     */
    public function diff(?string $name, string $path): array
    {
        $tracked = $this->inCheckout($name, 'ls-files', '--error-unmatch', '--', $path)->isSuccessful();
        $result = $tracked
            ? $this->inCheckout($name, 'diff', 'HEAD', '--', $path)
            : $this->inCheckout($name, 'diff', '--no-index', '--', '/dev/null', $path);
        // "--no-index" answers 1 where the files differ.
        if (!$result->isSuccessful() && !(!$tracked && $result->exitCode === 1)) {
            throw new \RuntimeException(sprintf('Reading the change in %s: %s', $path, $result->message()));
        }

        return GitOutput::held($result->output);
    }

    /** Only for a worktree the list did not reach; the rest read checkoutState(). */
    public function changeCount(string $name): int
    {
        return \count($this->inWorktree($name, ...self::STATUS)->lines());
    }

    /** Untracked files are not counted: a hard reset leaves them where they are. */
    public function modifiedCount(string $name): int
    {
        return \count(GitOutput::modifiedOf($this->inWorktree($name, ...self::STATUS)->output));
    }

    /**
     * Null where it tracks nothing, which is not the same as being in step.
     *
     * @return ?array{int, int}
     */
    public function tracking(?string $worktree = null, string $ref = 'HEAD'): ?array
    {
        $result = $this->inCheckout($worktree, 'rev-list', '--left-right', '--count', $ref . '...' . $ref . '@{upstream}');

        if (!$result->isSuccessful() || preg_match('/(\d+)\s+(\d+)/', $result->output, $hit) !== 1) {
            return null;
        }

        return [(int) $hit[1], (int) $hit[2]];
    }

    /**
     * A detached worktree is not in the map -- git names no branch there, and what
     * the checkout was made for is in its metadata.
     *
     * @return array<string, string>
     */
    public function worktreeBranches(): array
    {
        if ($this->worktreeBranches === null) {
            $this->read();
        }

        return $this->worktreeBranches ?? [];
    }

    /**
     * What each worktree holds, in one shell for all of them. The three counts are
     * three ways of losing work; "rebuild" is whether what the build reads changed
     * between the commit it was made at and this one -- not whether HEAD moved,
     * since making commits is what a worktree is for.
     *
     * @return array<string, WorktreeState>
     */
    public function worktreeStates(): array
    {
        // Directories travel as arguments, never written into the script: a path
        // goes through a shell here. The project's own checkout goes first, under a
        // name no worktree can have.
        $loop = self::CHECKOUT_STATE . self::SPREAD . <<<'SH'

            {
                printf '%s\t/dev/null\t%s\n' "$3" "$4"
                for directory in "$1"/*/; do
                    [ -d "$directory" ] || continue
                    directory="${directory%/}"
                    printf '%s\t%s/%s.json\n' "$directory" "$2" "$(basename "$directory")"
                done
            } | spread state
            SH;

        $result = $this->web->run([
            'bash', '-c', $loop, 'branchery',
            $this->project->hostWorktreesDirectory(), $this->project->metadataDirectory(),
            $this->project->hostRoot(), self::PROJECT_STATE,
        ]);

        $states = GitOutput::statesOf($result->output);
        if (isset($states[self::PROJECT_STATE])) {
            $this->projectState = $states[self::PROJECT_STATE];
            unset($states[self::PROJECT_STATE]);
        }

        return $states;
    }

    /** Not a name a worktree can have, so the two cannot be confused. */
    private const string PROJECT_STATE = '@project';

    /**
     * Running one shell function over a list of lines, a few at a time. A fixed few
     * and not all: this runs in the developer's own web container, and a burst of
     * forty gits is a laptop that stops answering.
     *
     * Every worker writes into a file of its own, because two writing into the one
     * stream would land inside each other's line -- so the answers come back out of
     * order, which no caller reads them in. Without a temporary directory the list
     * is walked one at a time, slow rather than silent.
     */
    private const string SPREAD = <<<'SH'

        spread() {
            each="$1"
            workers=8
            work="$(mktemp -d 2>/dev/null)" || {
                while IFS=$'\t' read -r first second third; do
                    [ -n "$first" ] && "$each" "$first" "$second" "$third"
                done
                return 0
            }
            cat > "$work/lines"
            shard=0
            while [ "$shard" -lt "$workers" ]; do
                (
                    awk -v n="$workers" -v k="$shard" 'NR % n == k' "$work/lines" |
                        while IFS=$'\t' read -r first second third; do
                            [ -n "$first" ] && "$each" "$first" "$second" "$third"
                        done
                ) > "$work/answer.$shard" &
                shard=$((shard + 1))
            done
            wait
            cat "$work"/answer.*
            rm -rf "$work"
        }
        SH;

    /**
     * The directory, the file this add-on wrote about the checkout (/dev/null where
     * there is none), and the name to answer under where the directory's will not
     * do. One copy, because the list and the page about one worktree stand side by
     * side and must not answer differently.
     */
    private const string CHECKOUT_STATE = <<<'SH'
        state() {
            worktree="$1"
            printf '# %s\n' "${3:-$worktree}"
            printf 'changes %s\n' "$(git -C "$worktree" status --porcelain --untracked-files=all 2>/dev/null | wc -l)"
            # Hash, subject and message in one git rather than three, once per
            # worktree on every visit.
            commit="$(git -C "$worktree" log -1 --format='%H%x09%h%x09%s%x1f%B' 2>/dev/null)"
            printf 'head %s\n' "${commit%%$'\t'*}"
            said="${commit#*$'\t'}"
            printf 'tip %s\n' "${said%%$'\x1f'*}"
            message="${said#*$'\x1f'}"
            printf 'change %s\n' "$(printf '%s' "$message" | sed -n 's/^Change-Id: *//p' | tail -1)"
            printf 'issue %s\n' "$(printf '%s' "$message" | sed -n 's/^\(Resolves\|Related\): *#\([0-9][0-9]*\).*/\2/p' | head -1)"
            tracking="$(git -C "$worktree" rev-list --left-right --count 'HEAD...@{upstream}' 2>/dev/null)"
            [ -n "$tracking" ] && printf 'tracking %s\n' "$tracking"
            built="$(sed -n 's/.*"builtHead": *"\([0-9a-f]*\)".*/\1/p' "$2" 2>/dev/null | head -1)"
            if [ -n "$built" ]; then
                if changed="$(git -C "$worktree" diff --name-only "$built" HEAD -- composer.json composer.lock .ddev/branchery.yaml 2>/dev/null)"; then
                    printf 'rebuild %s\n' "$(printf '%s' "$changed" | grep -c .)"
                else
                    printf 'rebuild 1\n'
                fi
            fi
            true
        }
        SH;

    /**
     * Through the same shell function as the list, so a worktree read on its own
     * says exactly what the list says: read any other way it carried no head, and a
     * fresh fork was reported as merged the morning it was made.
     */
    public function checkoutState(?string $name = null): WorktreeState
    {
        // Already read where worktreeStates() came first in this request.
        if ($name === null && $this->projectState !== null) {
            return $this->projectState;
        }
        $directory = $name === null
            ? $this->project->hostRoot()
            : $this->project->hostWorktreeDirectory($name);
        // A path that is certainly there and says nothing: sed is handed one either way.
        $metadata = $name === null
            ? '/dev/null'
            : $this->project->metadataDirectory() . '/' . $name . '.json';

        $result = $this->web->run([
            'bash', '-c', self::CHECKOUT_STATE . "\nstate \"\$1\" \"\$2\"", 'branchery', $directory, $metadata,
        ]);

        return array_values(GitOutput::statesOf($result->output))[0] ?? new WorktreeState(0, null, null);
    }

    /**
     * As a local branch where there is one of that name, and as the remote's ref
     * otherwise. Null where there is no remote, or the remote never said.
     */
    public function defaultBranch(): ?string
    {
        if ($this->defaultBranch === null) {
            $this->readBranches();
        }

        return $this->defaultBranch === '' ? null : $this->defaultBranch;
    }

    /**
     * In one process: a dozen against a dozen is a hundred questions. The pairs
     * travel as arguments and never through the script, a branch name going through
     * a shell here.
     *
     * @param list<string> $branches
     * @param list<string> $candidates
     *
     * @return array<string, array<string, array{int, int}>> branch => candidate => [moved, own]
     */
    public function distances(array $branches, array $candidates): array
    {
        if ($branches === [] || $candidates === []) {
            return [];
        }

        $this->measure(GitOutput::pairsOf($branches, $candidates, $this->distances));

        $answer = [];
        foreach ($branches as $branch) {
            foreach ($candidates as $candidate) {
                $apart = $this->distances[$branch][$candidate] ?? null;
                if ($apart !== null) {
                    $answer[$branch][$candidate] = $apart;
                }
            }
        }

        return $answer;
    }

    /**
     * @param list<string> $pairs
     */
    private function measure(array $pairs): void
    {
        if ($pairs === []) {
            return;
        }

        // A dozen branches make seventy-odd pairs, each a walk of history.
        $script = self::SPREAD . <<<'SH'

            apart() {
                [ -n "$2" ] || return 0
                counted="$(git -C "$repository" rev-list --left-right --count "$2...$1" 2>/dev/null)" || return 0
                printf '%s\t%s\t%s\n' "$1" "$2" "$counted"
            }

            repository="$1"
            printf '%s\n' "$2" | spread apart
            SH;

        $result = $this->web->run([
            'bash', '-c', $script, 'branchery', $this->project->hostRoot(), implode("\n", $pairs),
        ]);

        // Pair by pair and not by spreading one map into another: a branch called
        // "13" is an integer key, and a spread renumbers those.
        foreach (Lineage::distancesOf($result->output) as $branch => $apart) {
            foreach ($apart as $candidate => $count) {
                $this->distances[$branch][$candidate] = $count;
                // The same fact read from the other end.
                $this->distances[$candidate][$branch] = [$count[1], $count[0]];
            }
        }
    }
}
