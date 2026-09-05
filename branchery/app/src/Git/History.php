<?php

declare(strict_types=1);

namespace App\Git;

use App\Service\GitOutput;

/**
 * What a branch carries: the commits on it, what one of them changed, and how
 * far it stands from what the remote has.
 *
 * Nothing here writes, so nothing here has to say anything about what was read
 * before it. One repository holds every branch's commits, which is why a page
 * about a commit needs no checkout of its own -- the project's own answers for
 * a branch that has none.
 */
final readonly class History
{
    public function __construct(private Runner $runner)
    {
    }

    /** A file at a ref, so a branch can be read before anything is created for it. */
    public function fileAt(string $ref, string $path): ?string
    {
        $result = $this->runner->run('show', $ref . ':' . $path);

        return $result->isSuccessful() ? $result->output : null;
    }

    /** Null where it follows none, rather than a guess at which remote was meant. */
    public function upstreamOf(?string $name = null, string $ref = 'HEAD'): ?string
    {
        $result = $this->runner->inCheckout($name, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', $ref . '@{upstream}');

        return $result->isSuccessful() && $result->output !== '' ? $result->output : null;
    }

    /**
     * Null where it tracks nothing, which is not the same as being in step.
     *
     * @return ?array{int, int}
     */
    public function tracking(?string $worktree = null, string $ref = 'HEAD'): ?array
    {
        $result = $this->runner->inCheckout($worktree, 'rev-list', '--left-right', '--count', $ref . '...' . $ref . '@{upstream}');

        if (!$result->isSuccessful() || preg_match('/(\d+)\s+(\d+)/', $result->output, $hit) !== 1) {
            return null;
        }

        return [(int) $hit[1], (int) $hit[2]];
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
        $own = $base === null ? null : array_flip($this->runner->inCheckout($name, 'rev-list', $base . '..' . $ref)->lines());

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
        $result = $this->runner->inCheckout($name, 'show', '--no-patch', '--format=%H%x1f%h%x1f%s%x1f%ct%x1f%an%x1f%p%x1f%b', $sha);
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
        $result = $this->runner->inCheckout($name, 'show', '--name-status', '--format=', $sha);
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
        $result = $this->runner->inCheckout($name, 'show', '--format=', $sha, '--', $path);
        if (!$result->isSuccessful()) {
            throw new \RuntimeException(sprintf('Reading %s in %s: %s', $path, $sha, $result->message()));
        }

        return GitOutput::held($result->output);
    }

    /**
     * Asked before reading a change, so a stale sha in an address answers "not
     * here" rather than with git's complaint about a bad object.
     */
    public function hasCommit(?string $name, string $sha): bool
    {
        return $this->runner->inCheckout($name, 'rev-parse', '--verify', '--quiet', $sha . '^{commit}')->isSuccessful();
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
        $result = $this->runner->inCheckout(
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
        $result = $this->runner->inCheckout($name, 'rev-list', $ref . '@{upstream}..' . $ref);
        if ($result->isSuccessful()) {
            return $result->lines();
        }
        $anywhere = $this->runner->inCheckout($name, 'rev-list', $ref, '--not', '--remotes');

        return $anywhere->isSuccessful() ? $anywhere->lines() : null;
    }
}
