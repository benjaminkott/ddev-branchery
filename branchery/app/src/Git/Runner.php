<?php

declare(strict_types=1);

namespace App\Git;

use App\Service\CommandResult;
use App\Service\Project;
use App\Service\WebContainer;

/**
 * How a git command is run, and who is told when one of them writes.
 *
 * Paths are built from the host path: git writes them into its bookkeeping
 * absolutely, and they have to be correct on the host too.
 *
 * The second half is the point. What this application reads about the
 * repository is true only until git moves, and it is this application that
 * moves it -- so a write and the dropping of what was read before it are one
 * thing, said here once, rather than two things every writing method has to
 * remember. Two of them had already stopped remembering.
 */
final class Runner
{
    /** @var list<\Closure(): void> */
    private array $afterWrite = [];

    public function __construct(
        private readonly Project $project,
        private readonly WebContainer $web,
    ) {
    }

    /** Told after every write, in the order they asked to be. */
    public function onWrite(\Closure $listener): void
    {
        $this->afterWrite[] = $listener;
    }

    /** A question at the project's own checkout. */
    public function run(string ...$arguments): CommandResult
    {
        return $this->git($this->project->hostRoot(), false, ...$arguments);
    }

    /** git doing something rather than being asked: its output goes to the operation log. */
    public function work(string ...$arguments): CommandResult
    {
        $result = $this->git($this->project->hostRoot(), true, ...$arguments);
        $this->wrote();

        return $result;
    }

    public function inWorktree(string $name, string ...$arguments): CommandResult
    {
        return $this->git($this->project->hostWorktreeDirectory($name), false, ...$arguments);
    }

    /** The same, for git doing something rather than being asked. */
    public function workInWorktree(string $name, string ...$arguments): CommandResult
    {
        $result = $this->git($this->project->hostWorktreeDirectory($name), true, ...$arguments);
        $this->wrote();

        return $result;
    }

    /** A worktree by name, or the project's own -- which has no directory under worktrees/. */
    public function inCheckout(?string $name, string ...$arguments): CommandResult
    {
        return $name === null ? $this->run(...$arguments) : $this->inWorktree($name, ...$arguments);
    }

    /**
     * Several questions in one process start. What the script needs travels as
     * arguments and never inside it: a path and a branch name are the developer's
     * to choose, and this is a shell.
     *
     * @param list<string> $arguments what the script reads as $1, $2, ...
     */
    public function shell(string $script, array $arguments = []): CommandResult
    {
        return $this->web->run(['bash', '-c', $script, 'branchery', ...$arguments]);
    }

    /**
     * That something was written by a way other than work(): a script that edits
     * git's own files, or a "prune" that is asked as a question and is a write all
     * the same. The few of those are why this is public.
     */
    public function wrote(): void
    {
        foreach ($this->afterWrite as $listener) {
            $listener();
        }
    }

    private function git(string $directory, bool $working, string ...$arguments): CommandResult
    {
        return $this->web->run(array_values(['git', '-C', $directory, ...$arguments]), null, $working);
    }
}
