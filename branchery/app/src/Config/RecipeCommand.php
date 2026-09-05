<?php

declare(strict_types=1);

namespace App\Config;

/**
 * One line out of a project's recipe, written the way DDEV writes a hook task:
 * "exec" is a command, "composer" is composer. A bare string is "exec", which is
 * what most lines are.
 */
final readonly class RecipeCommand
{
    public const KINDS = ['exec', 'composer'];

    public function __construct(
        public string $kind,
        public string $line,
        /**
         * A line is in the recipe because the worktree is not finished without it,
         * which is what makes a failure stop everything. Not every line is that,
         * though: an asset toolchain a branch cannot install is the whole build
         * lost over something no PHP work in that worktree needs. Such a line says
         * so itself, and a worktree built past one ends in a warning.
         */
        public bool $optional = false,
    ) {
    }

    /**
     * The arguments of a composer line, as composer wants them.
     *
     * @return list<string>
     */
    public function arguments(): array
    {
        return preg_split('/\s+/', trim($this->line)) ?: [];
    }
}
