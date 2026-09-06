<?php

declare(strict_types=1);

namespace App\Config;

/**
 * What builds one worktree: the project's own file over the shipped one it
 * names, already laid together, with the answers a caller is entitled to when
 * the file said nothing at all.
 *
 * The arrangement itself is `Recipe::over()` and lives there, so there is one
 * place where a key is carried across. This is where the defaults are, and
 * nowhere else: the checkout's own root, composer's usual bin directory, no
 * editing interface.
 */
final readonly class Build
{
    public function __construct(
        private Recipe $recipe,
        /** What it is built on, by name, where it is built on anything. */
        private ?string $shippedName,
    ) {
    }

    /** What this worktree is built as, where it is built as anything named. */
    public function name(): ?string
    {
        return $this->shippedName;
    }

    /** Whether anything at all was said about how to build this. */
    public function isEmpty(): bool
    {
        return $this->shippedName === null && $this->recipe->isEmpty();
    }

    /**
     * The checkout's own root where nobody says otherwise: guessing at "public,
     * web, htdocs" is exactly the kind of guess this stopped making.
     */
    public function docroot(): string
    {
        return $this->recipe->docroot ?? '';
    }

    /** Where the project's own binaries are. */
    public function bin(): string
    {
        return $this->recipe->bin ?? 'vendor/bin';
    }

    /** What this checkout is to be served with, where anything is asked for. */
    public function php(): ?Version
    {
        return $this->recipe->php;
    }

    /** Nothing is served with it; it is what `npm` in a recipe line runs under. */
    public function node(): ?Version
    {
        return $this->recipe->node;
    }

    /**
     * The pages worth opening, in the order the file offers them. A list written
     * empty is how a project says it has none although the configuration it is
     * built on has.
     *
     * @return list<array{name: string, path: string}>
     */
    public function entrypoints(): array
    {
        return $this->recipe->entrypoints ?? [];
    }

    /**
     * @return array{review: ?string, issue: ?string, commit: ?string}
     */
    public function links(): array
    {
        return $this->recipe->links;
    }

    /**
     * What travels instead of everything git ignores, where the file names it.
     *
     * @return ?list<string>
     */
    public function copy(): ?array
    {
        return $this->recipe->copy['only'];
    }

    /** @return list<string> */
    public function copyExcept(): array
    {
        return $this->recipe->copy['except'] ?? [];
    }

    /**
     * @return array{from: ?string, needs: list<string>, addresses: list<string>}
     */
    public function data(): array
    {
        return [
            'from' => $this->recipe->data['from'],
            'needs' => $this->recipe->data['needs'] ?? [],
            'addresses' => $this->recipe->data['addresses'] ?? [],
        ];
    }

    /** Whether anything happens at this moment. */
    public function does(string $moment): bool
    {
        return $this->lines($moment) !== [];
    }

    /**
     * What runs at this moment, in order. Handed out rather than run here: this
     * says what a worktree is built out of, and the worktree is where it happens.
     *
     * @return list<RecipeCommand>
     */
    public function lines(string $moment): array
    {
        return $this->recipe->lines($moment);
    }

    /**
     * Asked so that what composer will refuse can be said before it is run. The line
     * is handed back rather than a yes, because what it says decides what counts --
     * an install without the development requirements is not missing them.
     */
    public function composerInstall(): ?string
    {
        foreach ($this->lines('install') as $command) {
            $line = $command->kind === 'composer' ? 'composer ' . $command->line : $command->line;
            if (preg_match('/(?:^|[\s\/])composer(?:\.phar)?(?:\s+--?\S+)*\s+(?:install|i)(?:\s|$)/', $line) === 1) {
                return $line;
            }
        }

        return null;
    }
}
