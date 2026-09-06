<?php

declare(strict_types=1);

namespace App\Git;

use App\Model\Branch;
use App\Model\WorktreeState;

/**
 * What git said, read.
 *
 * The other half of Git: everything here takes a block of text a command wrote
 * and answers what is in it, and nothing here starts a process or remembers
 * anything. That is what makes it the half worth holding to -- reading one of
 * these blocks wrongly puts a worktree on the wrong branch, or says that nothing
 * would be lost by removing one, and both are a question about a string.
 */
final readonly class GitOutput
{
    /**
     * One answer carrying several. The heading is a control character and not a
     * word, because git can write any word -- a remote may be called almost
     * anything. A section with nothing under it is "", which is what "none" is.
     *
     * @return array<string, string>
     */
    public static function sectionsOf(string $output): array
    {
        $sections = [];
        $name = null;
        foreach (explode("\n", $output) as $line) {
            if (str_starts_with($line, self::SECTION)) {
                $name = substr($line, \strlen(self::SECTION));
                $sections[$name] = [];

                continue;
            }
            if ($name !== null) {
                $sections[$name][] = $line;
            }
        }

        return array_map(static fn (array $lines): string => implode("\n", $lines), $sections);
    }

    /** ASCII's record separator. */
    private const string SECTION = "\x1e";

    /**
     * Origin first where there is one. A remote git names no address for is still
     * a remote, and stands here with none.
     *
     * @return array<string, string>
     */
    public static function remotesOf(string $output): array
    {
        $found = [];
        foreach (explode("\n", $output) as $line) {
            [$name, $url] = array_pad(explode("\t", rtrim($line), 2), 2, '');
            $name = trim($name);
            if ($name !== '') {
                $found[$name] = trim($url);
            }
        }

        $remotes = [];
        if (isset($found['origin'])) {
            $remotes['origin'] = $found['origin'];
        }
        foreach ($found as $name => $url) {
            $remotes[(string) $name] = $url;
        }

        return $remotes;
    }

    /**
     * Only host and path are kept; the rest is how git gets there. That is also
     * what keeps a token out of the page -- `https://user:tok@host/o/r` carries one.
     */
    public static function browsableRemote(string $url): ?string
    {
        $url = trim($url);
        if ($url === '') {
            return null;
        }

        // The scp-like form git writes by default, which no address parser
        // recognises: host and path held apart by a colon, not by a scheme.
        if (preg_match('#^(?:[^@/]+@)?([^/:]+):(?!//)(.+)$#', $url, $matches) === 1) {
            return self::webAddress('https', $matches[1], $matches[2]);
        }

        $parts = parse_url($url);
        if (!is_array($parts) || !isset($parts['host'], $parts['path'])) {
            return null;
        }
        $scheme = $parts['scheme'] ?? '';
        if (!in_array($scheme, ['http', 'https', 'ssh', 'git'], true)) {
            return null;
        }

        // A browser speaks https, except where the remote says plain http --
        // somebody's own server, not ours to correct.
        return self::webAddress($scheme === 'http' ? 'http' : 'https', $parts['host'], $parts['path']);
    }

    private static function webAddress(string $scheme, string $host, string $path): ?string
    {
        $path = trim($path, '/');
        if (str_ends_with($path, '.git')) {
            $path = substr($path, 0, -4);
        }
        if ($path === '' || $host === '') {
            return null;
        }

        return sprintf('%s://%s/%s', $scheme, $host, $path);
    }

    /**
     * The subject is last, so a tab in it stays whole.
     *
     * @param list<string> $lines
     * @param list<string> $namespaces
     *
     * @return list<Branch>
     */
    public static function branchesFromRefs(array $lines, array $namespaces): array
    {
        $seen = [];
        $onRemote = [];
        foreach ($lines as $line) {
            [$ref, $when, $sha, $subject] = array_pad(explode("\t", $line, 4), 4, '');
            $branch = null;
            $namespace = null;
            foreach ($namespaces as $candidate) {
                if (str_starts_with($ref, $candidate)) {
                    $branch = substr($ref, strlen($candidate));
                    $namespace = $candidate;

                    break;
                }
            }
            // Matched against the whole ref: "refs/remotes/origin/HEAD" shortens to
            // "origin", which passed every guard against HEAD.
            if ($branch === null || $branch === '' || $branch === 'HEAD') {
                continue;
            }
            if ($namespace !== 'refs/heads/') {
                $onRemote[$branch] = true;
            }
            // The first dates the branch; a second ref only says where else it is.
            $seen[$branch] ??= ['when' => (int) $when, 'sha' => $sha, 'subject' => $subject];
        }

        $branches = [];
        foreach ($seen as $branch => $said) {
            $branches[] = new Branch(
                (string) $branch,
                $said['when'],
                $said['sha'] === '' ? null : ['sha' => $said['sha'], 'subject' => $said['subject']],
                isset($onRemote[$branch]),
            );
        }

        return $branches;
    }

    /** The scp-like form is the one to get right: it is ssh and carries no scheme. */
    public static function isSsh(string $url): bool
    {
        $url = trim($url);
        if (preg_match('#^(?:[^@/]+@)?[^/:]+:(?!//)#', $url) === 1) {
            return true;
        }

        $scheme = parse_url($url, PHP_URL_SCHEME);

        return is_string($scheme) && in_array(strtolower($scheme), ['ssh', 'git+ssh'], true);
    }

    /**
     * A string handed to git is a revision -- a tag, `HEAD@{yesterday}`, or a dash
     * it reads as an option -- so only a hash is let through.
     */
    public static function asSha(string $sha): ?string
    {
        $sha = trim($sha);

        return preg_match('/^[0-9a-f]{4,40}$/', $sha) === 1 ? $sha : null;
    }

    /** A path as a literal on the left of a sed expression delimited by "|". */
    public static function sedPattern(string $path): string
    {
        return (string) preg_replace('/[\\\\|.*^$\[\]]/', '\\\\$0', $path);
    }

    /** The same for the right side, where "&" is the one a directory name has. */
    public static function sedReplacement(string $path): string
    {
        return (string) preg_replace('/[\\\\|&]/', '\\\\$0', $path);
    }

    /**
     * @return array{merged: list<string>, gone: list<string>}
     */
    public static function finishedOf(string $output): array
    {
        $finished = ['merged' => [], 'gone' => []];
        foreach (explode("\n", $output) as $line) {
            $line = trim($line);
            foreach (['merged', 'gone'] as $kind) {
                if (str_starts_with($line, $kind . ' ')) {
                    $branch = trim(substr($line, \strlen($kind) + 1));
                    // git marks the checked-out one with an asterisk, and the project's own
                    // branch always is.
                    $branch = ltrim($branch, '* ');
                    if ($branch !== '') {
                        $finished[$kind][] = $branch;
                    }
                }
            }
        }

        return $finished;
    }

    /**
     * The two columns are the index and the working copy, and the reader is told
     * the one word that fits both; a rename is named by its new path.
     *
     * @return list<array{status: string, path: string}>
     */
    public static function changesOf(string $status): array
    {
        $changes = [];
        foreach (explode("\n", $status) as $line) {
            if (\strlen($line) < 4) {
                continue;
            }
            $code = substr($line, 0, 2);
            $path = substr($line, 3);
            if (str_contains($path, ' -> ')) {
                $path = substr($path, strrpos($path, ' -> ') + 4);
            }
            $changes[] = ['status' => self::statusWord($code), 'path' => trim($path, '"')];
        }

        return $changes;
    }

    public static function statusWord(string $code): string
    {
        return match (true) {
            $code === '??' => 'untracked',
            str_contains($code, 'D') => 'deleted',
            str_contains($code, 'R') => 'renamed',
            str_contains($code, 'A') => 'added',
            default => 'modified',
        };
    }

    /** Enough of a change for a review, not a vendor directory. */
    private const int DIFF_LIMIT = 200_000;

    /**
     * The same limit wherever a diff is read: a lock file is a lock file either way.
     *
     * @return array{lines: list<array{kind: string, text: string}>, truncated: bool}
     */
    public static function held(string $diff): array
    {
        $truncated = \strlen($diff) > self::DIFF_LIMIT;

        return [
            'lines' => self::diffLines($truncated ? substr($diff, 0, self::DIFF_LIMIT) : $diff),
            'truncated' => $truncated,
        ];
    }

    /**
     * The file headers are dropped -- the page shows the path already -- while a
     * hunk header stays as context, since it says where in the file the reader is.
     *
     * @return list<array{kind: string, text: string}>
     */
    public static function diffLines(string $diff): array
    {
        $lines = [];
        foreach (explode("\n", $diff) as $line) {
            if ($line === '' && $lines === []) {
                continue;
            }
            if (preg_match('/^(diff --git|index |--- |\+\+\+ |new file mode|deleted file mode|old mode|new mode|similarity index|rename from|rename to)/', $line) === 1) {
                continue;
            }
            $kind = match (true) {
                str_starts_with($line, '+') => 'add',
                str_starts_with($line, '-') => 'del',
                default => 'context',
            };
            $lines[] = ['kind' => $kind, 'text' => $kind === 'context' ? preg_replace('/^ /', '', $line) ?? $line : substr($line, 1)];
        }
        while ($lines !== [] && $lines[\count($lines) - 1]['text'] === '' && $lines[\count($lines) - 1]['kind'] === 'context') {
            array_pop($lines);
        }

        return $lines;
    }

    /**
     * A request can name any path, and one leading out of the checkout would be
     * answered with a file of the machine's.
     */
    public static function insideCheckout(string $path): ?string
    {
        $path = trim($path);
        if ($path === '' || str_starts_with($path, '/') || str_contains($path, "\0")) {
            return null;
        }
        foreach (explode('/', $path) as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..') {
                return null;
            }
        }

        return $path;
    }

    /**
     * @return list<string>
     */
    public static function modifiedOf(string $status): array
    {
        return array_values(array_filter(
            explode("\n", $status),
            static fn (string $line): bool => trim($line) !== '' && !str_starts_with($line, '??'),
        ));
    }

    /**
     * What is missing from a block is missing because git had nothing to say -- a
     * branch that tracks nothing has no counts, which is not nought.
     *
     * @return array<string, WorktreeState>
     */
    public static function statesOf(string $output): array
    {
        // Made into a state once per block: it is immutable, so building it per
        // line would rebuild it six times.
        $blocks = [];
        $name = null;
        foreach (explode("\n", $output) as $line) {
            $line = trim($line);
            if (str_starts_with($line, '# ')) {
                $name = basename(trim(substr($line, 2)));
                $blocks[$name] = [];

                continue;
            }
            if ($name === null || !preg_match('/^(changes|head|change|issue|tracking|rebuild|tip) ?(.*)$/', $line, $hit)) {
                continue;
            }
            $blocks[$name][$hit[1]] = trim($hit[2]);
        }

        $states = [];
        foreach ($blocks as $name => $said) {
            // "3\t2": ahead, then behind, as --left-right counts them.
            $apart = preg_match('/(\d+)\s+(\d+)/', $said['tracking'] ?? '', $count) === 1
                ? [(int) $count[1], (int) $count[2]]
                : [null, null];
            $states[$name] = new WorktreeState(
                (int) ($said['changes'] ?? 0),
                $apart[0],
                $apart[1],
                $said['head'] ?? '',
                $said['change'] ?? '',
                $said['issue'] ?? '',
                (int) ($said['rebuild'] ?? 0) > 0,
                self::tipOf($said['tip'] ?? ''),
            );
        }

        return $states;
    }

    /**
     * The commit a checkout stands on, out of "log -1 --format=%h%x09%s".
     *
     * @return ?array{sha: string, subject: string}
     */
    public static function tipOf(string $line): ?array
    {
        $parts = explode("\t", trim($line), 2);
        if ($parts[0] === '') {
            return null;
        }

        return ['sha' => $parts[0], 'subject' => trim($parts[1] ?? '')];
    }

    /**
     * Each unordered pair once: git prints both sides of the distance in one answer.
     * A pair git could not answer is in no answer and is asked about again.
     *
     * @param list<string>                                  $branches
     * @param list<string>                                  $candidates
     * @param array<string, array<string, array{int, int}>> $known
     *
     * @return list<string>
     */
    public static function pairsOf(array $branches, array $candidates, array $known = []): array
    {
        $pairs = [];
        foreach ($branches as $branch) {
            foreach ($candidates as $candidate) {
                if ($candidate === $branch || isset($known[$branch][$candidate])) {
                    continue;
                }
                // One key whichever way round it was asked.
                $pairs[$branch < $candidate ? $branch . "\t" . $candidate : $candidate . "\t" . $branch] = true;
            }
        }

        return array_keys($pairs);
    }

    /**
     * Only what lies under the given directory: the project's own checkout is in
     * that list too, and is not one of the worktrees.
     *
     * @return array<string, string>
     */
    public static function branchesOf(string $output, string $prefix): array
    {
        $branches = [];
        $name = null;
        foreach (explode("\n", $output) as $line) {
            $line = trim($line);
            if (str_starts_with($line, 'worktree ')) {
                $path = substr($line, \strlen('worktree '));
                $name = str_starts_with($path, $prefix) ? substr($path, \strlen($prefix)) : null;

                continue;
            }
            if ($name !== null && str_starts_with($line, 'branch refs/heads/')) {
                $branches[$name] = substr($line, \strlen('branch refs/heads/'));
            }
        }

        return $branches;
    }
}
