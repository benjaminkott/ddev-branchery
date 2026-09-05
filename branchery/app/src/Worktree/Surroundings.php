<?php

declare(strict_types=1);

namespace App\Worktree;

use App\Config\Place;
use App\Git\Git;
use App\Jobs\StepReporter;
use App\ManagedFiles;
use App\Project;
use App\Web\WebContainer;

/**
 * What a worktree gets besides its code: the link the web server reaches it
 * through, what has to travel with data that came from elsewhere, the addresses
 * inside that pointed at this worktree, and the editor's own files. Which files
 * the middle two are is the project's to say; this only knows how to move them.
 *
 * Here rather than in WorktreeManager because they are not an operation: every
 * operation ends by asking for some of them.
 */
final readonly class Surroundings
{
    public function __construct(
        private Project $project,
        private Git $git,
        private ManagedFiles $files,
        private WebContainer $web,
    ) {
    }

    /**
     * Named after the worktree, which is the whole of the address: the server takes
     * the first part of the hostname and serves the link of that name. Named after
     * the branch -- the one thing about a worktree that moves -- a checkout
     * switched to another branch was listed at an address nothing served.
     *
     * Relative, and pointed back out of .ddev: what the container mounts is the
     * project directory, so a link into it has to be a path and not a host place.
     */
    public function linkDocroot(string $name, string $docroot): void
    {
        $this->forgetOtherLinksTo($name);
        $this->files->symlink(
            $this->project->docrootsDirectory() . '/' . $name,
            self::linkTarget($name) . ($docroot !== '' ? '/' . $docroot : ''),
        );
    }

    /** The worktree is served nowhere any more, under whatever name. */
    public function unlinkDocroot(string $name): void
    {
        $this->forgetOtherLinksTo($name);
        $this->files->remove($this->project->docrootsDirectory() . '/' . $name);
    }

    /**
     * A worktree built before the address followed the name is linked under its
     * branch, and that link would go on serving it beside the right one. Found by
     * where they point rather than by what they are called, because what they were
     * called is exactly what is not known here any more.
     */
    private function forgetOtherLinksTo(string $name): void
    {
        $target = self::linkTarget($name);
        foreach (glob($this->project->docrootsDirectory() . '/*') ?: [] as $link) {
            if (basename($link) === $name || !is_link($link)) {
                continue;
            }
            $points = (string) readlink($link);
            if ($points === $target || str_starts_with($points, $target . '/')) {
                $this->files->remove($link);
            }
        }
    }

    private function linkTarget(string $name): string
    {
        return $this->project->docrootLinkTarget($name);
    }

    /**
     * Data and the configuration that reads it belong together: a site points at
     * its root page by uid, and an application that has never been installed boots
     * as an installer. Which paths those are is the project's answer.
     *
     * One the branch keeps under version control is left alone; one the worktree
     * already has is not written over.
     *
     * @param list<string> $paths
     */
    public function bring(?string $from, string $name, array $paths): void
    {
        $source = $from !== null
            ? $this->project->hostWorktreeDirectory($from)
            : $this->project->hostRoot();
        $target = $this->project->hostWorktreeDirectory($name);

        foreach ($paths as $relative) {
            if ($this->git->tracks($name, $relative)) {
                continue;
            }
            // A directory is replaced whole and a file only put where there is none:
            // the first is the configuration that came with the data, the second the
            // installation's own record of itself.
            $copied = $this->web->run(['bash', '-c', sprintf(
                'if [ -d %1$s ]; then rm -rf %2$s && mkdir -p %2$s && cp -a %1$s/. %2$s/;'
                . ' elif [ -f %1$s ] && [ ! -e %2$s ]; then mkdir -p "$(dirname %2$s)" && cp -a %1$s %2$s; fi',
                escapeshellarg($source . '/' . $relative),
                escapeshellarg($target . '/' . $relative),
            )]);
            // A site configuration that did not arrive is a database whose root pages
            // nothing points at, which shows as an error on every request and says
            // nothing about the copy that failed.
            if (!$copied->isSuccessful()) {
                throw new \RuntimeException(sprintf('Bringing %s along: %s', $relative, $copied->message()));
            }
        }
    }

    /**
     * Only where the configuration is the worktree's own to write: one the branch
     * has under version control is the project's, and writing a developer's
     * worktree address into a tracked file leaves every fresh worktree standing as
     * "1 uncommitted" -- with the one change in it that must never be pushed.
     *
     * @param list<string> $paths where the project says its addresses stand
     *
     * @return list<string> what was left as the branch has it
     */
    public function retargetSites(string $name, string $url, array $paths, ?StepReporter $reporter = null): array
    {
        $kept = $this->putAddressesBack($name, $url, $paths);
        foreach ($kept as $left) {
            $reporter?->note(sprintf(
                '%s is under version control and is left as the branch has it. This worktree answers at %s'
                . ' -- configuration.md, "Where the addresses come from", says how a project points its sites there.',
                $left,
                Place::hostOf($url),
            ));
        }

        return $kept;
    }

    /**
     * @param list<string> $paths
     *
     * @return list<string>
     */
    private function putAddressesBack(string $name, string $url, array $paths): array
    {
        $directory = $this->project->worktreeDirectory($name);
        $kept = [];
        foreach ($paths as $relative) {
            $path = $directory . '/' . $relative;
            if (!is_dir($path)) {
                continue;
            }
            if ($this->git->tracks($name, $relative)) {
                $kept[] = $relative;

                continue;
            }
            // Under the domain DDEV puts this machine's projects under, which is what
            // the addresses in a copied configuration end in -- and not the usual one,
            // which a project set up under another domain never wrote.
            $domain = str_replace('.', '\\.', $this->project->domain());
            $rewritten = $this->web->run(['bash', '-c', sprintf(
                'set -o pipefail; grep -rl %s %s 2>/dev/null | while read -r f; do sed -i -E %s "$f" || exit 1; done; true',
                escapeshellarg($domain),
                escapeshellarg($this->project->hostWorktreeDirectory($name) . '/' . $relative),
                escapeshellarg(sprintf('s|https://[a-z0-9.-]+\\.%s/?|%s|g', $domain, $url)),
            )]);
            if (!$rewritten->isSuccessful()) {
                throw new \RuntimeException(sprintf('Putting the addresses in %s back: %s', $relative, $rewritten->message()));
            }
        }

        return $kept;
    }

    /**
     * What the editor needs: a debugger that finds the right files, and a terminal
     * that knows which worktree it is standing in.
     */
    public function writeEditorConfiguration(string $name, string $url): void
    {
        $directory = $this->project->worktreeDirectory($name) . '/.vscode';
        $containerPath = $this->project->worktreeDirectory($name);

        // This one lands inside a checkout the user works in, so it carries its
        // own .gitignore; otherwise every worktree starts out dirty.
        $this->files->ensureIgnoredDirectory($directory);

        // Only what the branch does not already have under version control: a
        // tracked settings.json written over is a worktree that stands in the list
        // as "1 uncommitted" from the moment it is built.
        if (!$this->git->tracks($name, '.vscode/launch.json')) {
            $this->files->write($directory . '/launch.json', json_encode([
                'version' => '0.2.0',
                'configurations' => [[
                    'name' => 'Xdebug (' . $name . ')',
                    'type' => 'php',
                    'request' => 'launch',
                    'port' => 9003,
                    'hostname' => '0.0.0.0',
                    'pathMappings' => [$containerPath => '${workspaceFolder}'],
                ]],
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
        }

        if (!$this->git->tracks($name, '.vscode/settings.json')) {
            $this->files->write($directory . '/settings.json', json_encode([
                'search.exclude' => ['**/vendor' => true, '**/typo3temp' => true, '**/node_modules' => true],
                'terminal.integrated.env.linux' => [
                    'BRANCHERY_NAME' => $name,
                    'BRANCHERY_URL' => $url,
                    'PLAYWRIGHT_BASE_URL' => $url . 'typo3/',
                ],
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
        }
    }
}
