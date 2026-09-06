<?php

declare(strict_types=1);

namespace App\Worktree;

use App\Jobs\Locks;
use App\Project;
use App\Web\Runtimes;
use App\Web\WebContainer;

/**
 * PHP versions of the worktrees. For every version that deviates from the
 * project default, an FPM pool of its own runs in the web container and a
 * <Directory> block points the handler there per worktree.
 */
final class PhpVersions
{
    public function __construct(
        private readonly Project $project,
        private readonly WebContainer $web,
        /** Which worktree is served with which version -- see VersionMap. */
        private readonly VersionMap $assignments,
        /** What the container itself runs on, asked once -- see Runtimes. */
        private readonly Runtimes $runtimes,
        private readonly Locks $locks,
    ) {
    }

    /** @return list<string> */
    public function available(): array
    {
        return $this->runtimes->phpPools();
    }

    public function projectVersion(): string
    {
        return $this->runtimes->php();
    }

    /** The version a worktree was given a pool of its own for, where it was. */
    public function assignedTo(string $name): ?string
    {
        return $this->assignments->of($name);
    }

    public function forWorktree(string $name): string
    {
        return $this->assignedTo($name) ?? $this->projectVersion();
    }

    /** The command line invocation; for the project default "php" is enough. */
    public function binaryFor(string $name): string
    {
        $version = $this->forWorktree($name);

        return $version === $this->projectVersion() ? 'php' : 'php' . $version;
    }

    /**
     * Applied even where the map already said this: a build is the moment to be
     * sure the pool this worktree is served through is actually listening.
     */
    public function assign(string $name, string $version): void
    {
        // Held across both: the script reads the map back and puts up pools for
        // what it finds, and two of it at once write the same server configuration
        // -- see Locks::VERSIONS.
        $held = $this->locks->hold(Locks::VERSIONS);
        try {
            $this->assignments->assign($name, $version);
            $this->apply();
        } finally {
            $held->release();
        }
    }

    /**
     * Only where something was assigned: without that there is no pool to take down
     * and no server to reload, and most worktrees are served with the project's own.
     */
    public function forget(string $name): void
    {
        $held = $this->locks->hold(Locks::VERSIONS);
        try {
            if ($this->assignments->forget($name)) {
                $this->apply();
            }
        } finally {
            $held->release();
        }
    }

    /**
     * What counts is the platform_check.php Composer generates -- that is exactly
     * what aborts at runtime. Running "composer install" again changes nothing.
     */
    public function minimumFor(string $name, string $vendorDir = 'vendor'): ?string
    {
        $base = $name === ''
            ? $this->project->root()
            : $this->project->worktreeDirectory($name);
        $file = sprintf('%s/%s/composer/platform_check.php', $base, $vendorDir);
        if (!is_file($file) || !preg_match('/PHP_VERSION_ID >= (\d+)/', (string) file_get_contents($file), $hit)) {
            return null;
        }
        $id = (int) $hit[1];

        return intdiv($id, 10000) . '.' . (intdiv($id, 100) % 100);
    }

    public function isAllowed(string $version, ?string $minimum): bool
    {
        return $minimum === null || version_compare($version, $minimum, '>=');
    }

    /** Start pools and reload Apache -- only the web container can do that. */
    private function apply(): void
    {
        $result = $this->web->run(['sudo', 'bash', $this->project->scriptsDirectory() . '/apply-php-versions.sh']);
        // Said rather than passed over: a pool that did not start leaves the
        // worktree served by the wrong version while the list says otherwise.
        if (!$result->isSuccessful()) {
            throw new \RuntimeException(sprintf('Applying the PHP versions: %s', $result->message()));
        }
    }
}
