<?php

declare(strict_types=1);

namespace App\Git;

use App\Model\Branch;
use App\Model\WorktreeState;
use App\Project;

/**
 * What the repository says about itself, kept for as long as one request.
 *
 * The page asks all of this on every look, and each answer is otherwise a
 * process start in the web container -- so they are asked in shells that answer
 * several at once, and what came back is kept.
 *
 * Everything kept here is true only until git moves. Nothing in this class
 * moves it: the Runner tells this one whenever a command wrote, and invalidate()
 * is the whole of the reaction. That is why there is one place to add a field
 * to and one place to clear it from.
 *
 * Which holds for git run through the Runner, and that is every git command
 * this application runs itself. A recipe line is the other way into the same
 * container -- see Worktree\Place -- and a project whose recipe commits would
 * leave what is kept here a moment out of date, for the rest of the operation
 * that ran it. Nothing is read from here after that point, so it is a boundary
 * to know about rather than a hole to plug: a reader that starts asking after
 * the recipe lines have run needs the Runner told about them.
 */
final class Facts
{
    /** @var array<string, mixed> what has been read, by the name it was asked under */
    private array $kept = [];

    public function __construct(
        private readonly Project $project,
        private readonly Runner $runner,
    ) {
        // Whatever wrote, everything read before it is now a guess.
        $this->runner->onWrite($this->invalidate(...));
    }

    /** Every kept answer at once: a stale one shows a branch that has moved. */
    public function invalidate(): void
    {
        $this->kept = [];
    }

    /**
     * One kept answer, read once. Written this way rather than as a field each,
     * because a field each is a field to forget: nine of them were cleared by hand
     * in a method every writing call had to remember to make.
     *
     * @template T
     *
     * @param callable(): T $read
     *
     * @return T
     */
    private function once(string $name, callable $read): mixed
    {
        if (!array_key_exists($name, $this->kept)) {
            $this->kept[$name] = $read();
        }

        /** @var T $answer */
        $answer = $this->kept[$name];

        return $answer;
    }

    public function currentBranch(): string
    {
        return $this->head()['branch'];
    }

    /**
     * A detached worktree is not in the map -- git names no branch there, and what
     * the checkout was made for is in its metadata.
     *
     * @return array<string, string>
     */
    public function worktreeBranches(): array
    {
        return $this->head()['worktrees'];
    }

    /**
     * Origin first where there is one. Neither the name nor the count is given, so
     * nothing may assume "origin".
     *
     * @return list<string>
     */
    public function remotes(): array
    {
        return array_map(strval(...), array_keys($this->head()['remotes']));
    }

    /**
     * Name and address in one question: everything that wants the one wants the other.
     *
     * @return array<string, string>
     */
    public function remoteUrls(): array
    {
        return $this->head()['remotes'];
    }

    public function defaultRemote(): ?string
    {
        return $this->remotes()[0] ?? null;
    }

    /**
     * What the repository is asked about itself, in one shell. The page wants all
     * of it on every look, and each is otherwise a container call away; a caller
     * wanting one pays for the rest.
     *
     * @return array{branch: string, worktrees: array<string, string>, remotes: array<string, string>}
     */
    private function head(): array
    {
        return $this->once('head', function (): array {
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

            $said = GitOutput::sectionsOf($this->runner->shell($script, [$this->project->hostRoot()])->output);

            return [
                'branch' => trim($said['head'] ?? ''),
                'worktrees' => GitOutput::branchesOf(
                    $said['worktrees'] ?? '',
                    $this->project->hostWorktreesDirectory() . '/',
                ),
                // A remote called "13" becomes an integer key, which no strict
                // comparison against a name from a request would match.
                'remotes' => GitOutput::remotesOf($said['remotes'] ?? ''),
            ];
        });
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

    /**
     * Asked only after a fetch has failed, so an https remote is not blamed on a
     * missing ssh key and the developer sent after "ddev auth ssh" for nothing.
     */
    public function reachesOverSsh(?string $remote = null): bool
    {
        $url = $this->urlOf($remote);

        return $url !== null && GitOutput::isSsh($url);
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
        // The usual question is answered out of branches().
        if ($remote === null) {
            return $this->branches()['refs'];
        }
        $namespaces = $this->namespaces($remote);
        $result = $this->runner->run('for-each-ref', '--sort=-committerdate', '--format=' . self::BRANCH_FORMAT, ...$namespaces);

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
        $namespaces = $this->namespaces();
        $result = $this->runner->run(
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

    public function hasRef(string $ref): bool
    {
        return $this->runner->run('rev-parse', '--verify', '--quiet', $ref)->isSuccessful();
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
     * As a local branch where there is one of that name, and as the remote's ref
     * otherwise. Null where there is no remote, or the remote never said.
     */
    public function defaultBranch(): ?string
    {
        $said = $this->branches()['default'];

        return $said === '' ? null : $said;
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
        // The project's own branch is answered out of branches().
        if ($base === $this->currentBranch()) {
            return $this->branches()['finished'];
        }

        return GitOutput::finishedOf($this->runner->shell(
            self::FINISHED . "\nfinished \"\$1\" \"\$2\"",
            [$this->project->hostRoot(), $base],
        )->output);
    }

    /**
     * @return list<string>
     */
    private function namespaces(?string $remote = null): array
    {
        $remote ??= $this->defaultRemote();
        $namespaces = ['refs/heads/'];
        if ($remote !== null) {
            $namespaces[] = 'refs/remotes/' . $remote . '/';
        }

        return $namespaces;
    }

    /** The same as a shell function, because it is asked from two scripts. */
    private const string FINISHED = <<<'SH'
        finished() {
            git -C "$1" branch --merged "$2" --format='merged %(refname:short)' 2>/dev/null
            git -C "$1" for-each-ref --format='%(refname:short) %(upstream:track,nobracket)' refs/heads/ 2>/dev/null \
                | sed -n 's/^\(.*\) gone$/gone \1/p'
        }
        SH;

    /**
     * Three answers the page wants on every look, for one process start.
     *
     * @return array{default: string, refs: list<Branch>, finished: array{merged: list<string>, gone: list<string>}}
     */
    private function branches(): array
    {
        return $this->once('branches', function (): array {
            $remote = $this->defaultRemote();
            $namespaces = $this->namespaces($remote);
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

            $said = GitOutput::sectionsOf($this->runner->shell($script, [
                $this->project->hostRoot(), $remote ?? '', $this->currentBranch(), self::BRANCH_FORMAT,
            ])->output);

            return [
                'default' => trim($said['default'] ?? ''),
                'refs' => GitOutput::branchesFromRefs(
                    array_values(array_filter(explode("\n", $said['refs'] ?? ''), static fn (string $line): bool => $line !== '')),
                    $namespaces,
                ),
                'finished' => GitOutput::finishedOf($said['finished'] ?? ''),
            ];
        });
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

        $states = GitOutput::statesOf($this->runner->shell($loop, [
            $this->project->hostWorktreesDirectory(),
            $this->project->metadataDirectory(),
            $this->project->hostRoot(),
            self::PROJECT_STATE,
        ])->output);

        if (isset($states[self::PROJECT_STATE])) {
            // Kept for checkoutState(), which the page asks right after this.
            $this->kept['projectState'] = $states[self::PROJECT_STATE];
            unset($states[self::PROJECT_STATE]);
        }

        return $states;
    }

    /** Not a name a worktree can have, so the two cannot be confused. */
    private const string PROJECT_STATE = '@project';

    /**
     * Through the same shell function as the list, so a worktree read on its own
     * says exactly what the list says: read any other way it carried no head, and a
     * fresh fork was reported as merged the morning it was made.
     */
    public function checkoutState(?string $name = null): WorktreeState
    {
        // Already read where worktreeStates() came first in this request.
        $kept = $this->kept['projectState'] ?? null;
        if ($name === null && $kept instanceof WorktreeState) {
            return $kept;
        }
        $directory = $name === null
            ? $this->project->hostRoot()
            : $this->project->hostWorktreeDirectory($name);
        // A path that is certainly there and says nothing: sed is handed one either way.
        $metadata = $name === null
            ? '/dev/null'
            : $this->project->metadataDirectory() . '/' . $name . '.json';

        $said = $this->runner->shell(
            self::CHECKOUT_STATE . "\nstate \"\$1\" \"\$2\"",
            [$directory, $metadata],
        );

        return array_values(GitOutput::statesOf($said->output))[0] ?? new WorktreeState(0, null, null);
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

        $known = $this->apart();
        $this->measure(GitOutput::pairsOf($branches, $candidates, $known));
        $known = $this->apart();

        $answer = [];
        foreach ($branches as $branch) {
            foreach ($candidates as $candidate) {
                $found = $known[$branch][$candidate] ?? null;
                if ($found !== null) {
                    $answer[$branch][$candidate] = $found;
                }
            }
        }

        return $answer;
    }

    /**
     * How far pairs of branches stand apart. Kept pair by pair, because the project
     * row asks one branch against every candidate and the list asks every branch
     * against every candidate -- the first is a corner of the second.
     *
     * @return array<string, array<string, array{int, int}>>
     */
    private function apart(): array
    {
        /** @var array<string, array<string, array{int, int}>> $kept */
        $kept = $this->kept['apart'] ?? [];

        return $kept;
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

        $said = $this->runner->shell($script, [$this->project->hostRoot(), implode("\n", $pairs)]);

        $known = $this->apart();
        // Pair by pair and not by spreading one map into another: a branch called
        // "13" is an integer key, and a spread renumbers those.
        foreach (Lineage::distancesOf($said->output) as $branch => $apart) {
            foreach ($apart as $candidate => $count) {
                $known[(string) $branch][(string) $candidate] = $count;
                // The same fact read from the other end.
                $known[(string) $candidate][(string) $branch] = [$count[1], $count[0]];
            }
        }
        $this->kept['apart'] = $known;
    }

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
}
