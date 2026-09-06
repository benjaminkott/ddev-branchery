<?php

declare(strict_types=1);

namespace App\Git;

/**
 * What a checkout has that is not committed, and what it carries that git was
 * told to ignore.
 *
 * The row in the list says a count -- "12 uncommitted" -- and everything here
 * is what turns that number into the files it is about. Nothing writes.
 */
final readonly class WorkingCopy
{
    public function __construct(private Runner $runner)
    {
    }

    /**
     * File by file, including inside a directory git has never seen: folded, such a
     * directory is one line -- a row counted three for a hundred new files, and
     * offered a diff for a directory, which there is none of.
     *
     * @var list<string>
     */
    private const array STATUS = ['status', '--porcelain', '--untracked-files=all'];

    public function tracks(string $worktree, string $path): bool
    {
        return $this->runner->inWorktree($worktree, 'ls-files', '--error-unmatch', '--', $path)->isSuccessful();
    }

    /**
     * The row's count says something is at stake; this says what.
     *
     * @return list<array{status: string, path: string}>
     */
    public function changes(?string $name): array
    {
        return GitOutput::changesOf($this->runner->inCheckout($name, ...self::STATUS)->output);
    }

    /**
     * Against HEAD, so staged and unstaged read as one change; an untracked file
     * has no HEAD to differ from and is shown whole.
     *
     * @return array{lines: list<array{kind: string, text: string}>, truncated: bool}
     */
    public function diff(?string $name, string $path): array
    {
        $tracked = $this->runner->inCheckout($name, 'ls-files', '--error-unmatch', '--', $path)->isSuccessful();
        $result = $tracked
            ? $this->runner->inCheckout($name, 'diff', 'HEAD', '--', $path)
            : $this->runner->inCheckout($name, 'diff', '--no-index', '--', '/dev/null', $path);
        // "--no-index" answers 1 where the files differ.
        if (!$result->isSuccessful() && !(!$tracked && $result->exitCode === 1)) {
            throw new \RuntimeException(sprintf('Reading the change in %s: %s', $path, $result->message()));
        }

        return GitOutput::held($result->output);
    }

    /** Only for a worktree the list did not reach; the rest read checkoutState(). */
    public function changeCount(string $name): int
    {
        return \count($this->runner->inWorktree($name, ...self::STATUS)->lines());
    }

    /** Untracked files are not counted: a hard reset leaves them where they are. */
    public function modifiedCount(string $name): int
    {
        return \count(GitOutput::modifiedOf($this->runner->inWorktree($name, ...self::STATUS)->output));
    }

    /**
     * What a fork is offered to carry over; without a name, the project's own. What
     * travels is decided in App\Operation\CopiedFiles.
     *
     * @return list<string>
     */
    public function ignoredEntries(?string $name): array
    {
        $arguments = ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory'];
        $result = $name === null
            ? $this->runner->run(...$arguments)
            : $this->runner->inWorktree($name, ...$arguments);
        // --directory lists an ignored directory as one entry.
        $entries = array_map(static fn (string $line): string => rtrim($line, '/'), $result->lines());
        sort($entries);

        return $entries;
    }
}
