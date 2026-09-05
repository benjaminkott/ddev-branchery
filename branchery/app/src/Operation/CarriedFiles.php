<?php

declare(strict_types=1);

namespace App\Operation;

use App\Service\Git;
use App\Service\Project;
use App\Service\Recipes;
use App\Service\StepReporter;
use App\Service\WebContainer;
use App\Text;

/**
 * What a fork brings over from the checkout it was cut from.
 *
 * Everything git ignores is the answer that needs no project to write it down
 * -- a vendor directory, a .env, an editor's own files -- and it is also how a
 * cache built for other code arrives in a checkout it is wrong for. So a
 * project may say instead, and what it says is read here.
 */
final readonly class CarriedFiles
{
    public function __construct(
        private Project $project,
        private Git $git,
        private Recipes $recipes,
        private WebContainer $web,
    ) {
    }

    /**
     * @return list<string>
     */
    public function of(?string $from, string $directory): array
    {
        $left = $this->leftBehind($directory);

        return array_values(array_filter(
            $this->recipes->for($directory)->carry() ?? $this->git->ignoredEntries($from),
            static fn (string $entry): bool => !self::isUnder($entry, $left),
        ));
    }

    /**
     * At whatever depth it sits, because a project may keep its caches inside
     * something it does need. A project that says what travels is taken at its
     * word; the worktrees directory, .git and .ddev are refused either way --
     * carried over, the first would be every worktree inside the one being made.
     *
     * @return list<string>
     */
    public function leftBehind(string $directory): array
    {
        $build = $this->recipes->for($directory);
        $ours = ['.git', '.ddev', $this->project->worktreesName()];

        return $build->carry() !== null ? $ours : [...$build->carryExcept(), ...$ours];
    }

    /**
     * The copy itself, into a worktree that has just been checked out.
     *
     * tar and not cp, for the one thing cp cannot do: leave out something that
     * lies *inside* what is being copied, such as ".Build/var".
     */
    public function copy(?string $from, string $name, StepReporter $reporter): void
    {
        $directory = $this->project->worktreeDirectory($name);
        $without = $this->leftBehind($directory);
        $entries = $this->of($from, $directory);
        // How many, not which: ignore rules that name files make a thousand lines.
        $reporter->note($entries === [] ? 'Nothing to carry over.' : sprintf('%s carried over.', Text::count(\count($entries), 'entry', 'entries')));
        foreach ($entries as $entry) {
            $reporter->detail($entry);
        }

        $here = $from !== null ? $this->project->worktreeDirectory($from) : $this->project->root();
        // One archive rather than a container round trip per entry. What is not
        // there is left out here, so tar is never asked for something it would
        // refuse the whole run over.
        $present = array_values(array_filter($entries, static fn (string $entry): bool => file_exists($here . '/' . $entry)));
        if ($present === []) {
            return;
        }

        // Anchored, so a path means the one place it names.
        $excludes = implode(' ', array_map(
            static fn (string $path): string => '--exclude=' . escapeshellarg($path),
            $without,
        ));
        // pipefail, and checked: a copy that stops halfway leaves half a vendor
        // directory under a tick saying the worktree is ready.
        $copied = $this->web->run(['bash', '-c', sprintf(
            'set -o pipefail; cd %1$s && tar -cf - --anchored %2$s -- %3$s | (cd %4$s && tar -xf -)',
            escapeshellarg($from !== null ? $this->project->hostWorktreeDirectory($from) : $this->project->hostRoot()),
            $excludes,
            implode(' ', array_map('escapeshellarg', $present)),
            escapeshellarg($this->project->hostWorktreeDirectory($name)),
        )]);
        if (!$copied->isSuccessful()) {
            throw new \RuntimeException(sprintf('Carrying over the unversioned files: %s', $copied->message()));
        }
    }

    /**
     * @param list<string> $names
     */
    private static function isUnder(string $path, array $names): bool
    {
        foreach ($names as $name) {
            if ($path === $name || str_starts_with($path, $name . '/')) {
                return true;
            }
        }

        return false;
    }
}
