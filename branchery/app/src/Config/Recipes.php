<?php

declare(strict_types=1);

namespace App\Config;

/**
 * Where the answer to "how is this built" comes from. One place asks, so every
 * caller gets the same answer: the project's own file, read out of the worktree
 * first and the project checkout second, over the shipped file it names.
 *
 * The shipped files are configuration and not code -- the same grammar a
 * project writes -- so what a TYPO3 needs can be read and copied by whoever is
 * looking at their own file.
 */
final class Recipes
{
    /**
     * What each file said, by the file and not by the checkout that asked: keyed by
     * directory, a list of twenty worktrees took the one project file apart
     * twenty-one times.
     *
     * A file that cannot be read is remembered as the refusal it caused, or a
     * project with a typo in its file pays the parse and the exception on every row
     * of the page whose point is to say what is wrong with it.
     *
     * @var array<string, Recipe|\RuntimeException>
     */
    private array $parsed = [];

    /** @var array<string, ?Recipe> */
    private array $shipped = [];

    public function __construct(
        private readonly string $projectDirectory,
        private readonly string $defaultsDirectory,
    ) {
    }

    /**
     * Throws where the file cannot be read or names something that is not there: an
     * operation that went on would leave a worktree missing exactly what the file
     * was written for.
     */
    public function for(string $directory): Build
    {
        return $this->build($this->recipeFor($directory));
    }

    /**
     * What it says, over the shipped configuration it names -- or over nothing,
     * where it names none.
     */
    public function build(Recipe $recipe): Build
    {
        $name = $recipe->profile;

        return new Build($recipe, $name === null ? Recipe::none() : $this->shipped($name), $name);
    }

    /**
     * The same question, for a caller that must not fail. A file with a typo in it
     * would take the page down rather than the operation it belongs to, and a list
     * that will not come up says nothing about which file to fix.
     */
    public function quietly(string $directory): Build
    {
        try {
            return $this->for($directory);
        } catch (\RuntimeException) {
            return new Build(Recipe::none(), Recipe::none(), null);
        }
    }

    /**
     * Said at the top of every page rather than only in the operation that trips
     * over it: the file is the project's, and it is fixed with the list in front of
     * you.
     */
    public function problem(): ?string
    {
        try {
            $this->for($this->projectDirectory);

            return null;
        } catch (\RuntimeException $exception) {
            return $exception->getMessage();
        }
    }

    /** Whether the project has said anything at all about how it is built. */
    public function saysNothing(): bool
    {
        return $this->quietly($this->projectDirectory)->isEmpty();
    }

    /**
     * @return list<string>
     */
    public function names(): array
    {
        $names = [];
        foreach (glob($this->defaultsDirectory . '/*.yaml') ?: [] as $file) {
            $names[] = basename($file, '.yaml');
        }
        sort($names);

        return $names;
    }

    /** One of the shipped files, read once. */
    public function shipped(string $name): Recipe
    {
        if (!array_key_exists($name, $this->shipped)) {
            // The name before the path it would make: a shipped file is named and
            // never pointed at, so a name that is not one is answered here rather
            // than by asking the disk about whatever it composes.
            $file = $this->defaultsDirectory . '/' . $name . '.yaml';
            $this->shipped[$name] = $this->isPlain($name) && is_file($file) ? Recipe::fromFile($file) : null;
        }

        return $this->shipped[$name] ?? throw new \RuntimeException(sprintf('%s names "%s", which is not one of the shipped configurations. There is %s.', Recipe::FILE, $name, implode(', ', $this->names())));
    }

    /** One of the shipped files as it is written, to be read and copied. */
    public function shippedFile(string $name): string
    {
        $this->shipped($name);

        return (string) file_get_contents($this->defaultsDirectory . '/' . $name . '.yaml');
    }

    /** A name and not a path: nothing outside the shipped directory is read. */
    private function isPlain(string $name): bool
    {
        return $name !== '' && preg_match('/^[a-z0-9][a-z0-9-]*$/', $name) === 1;
    }

    /** Its own file, and the project's where it has none. */
    private function recipeFor(string $directory): Recipe
    {
        $file = $this->fileFor($directory);
        if ($file === null) {
            return Recipe::none();
        }

        $read = $this->parsed[$file] ??= self::parse($file);
        if ($read instanceof \RuntimeException) {
            throw $read;
        }

        return $read;
    }

    /**
     * The worktree's own comes first and the project's is the fallback, which
     * covers both ways of working: a file committed to the branch, and one kept out
     * of the repository because it is this developer's own.
     */
    private function fileFor(string $directory): ?string
    {
        foreach ([$directory, $this->projectDirectory] as $where) {
            $file = $where . '/' . Recipe::FILE;
            if (is_file($file)) {
                return $file;
            }
        }

        return null;
    }

    /** The file as what it says, or as the refusal reading it earns. */
    private static function parse(string $file): Recipe|\RuntimeException
    {
        try {
            return Recipe::fromFile($file);
        } catch (\RuntimeException $problem) {
            return $problem;
        }
    }
}
