<?php

declare(strict_types=1);

namespace App;

/**
 * The key facts about the project the add-on is installed in. Work happens on
 * exactly one repository: the project's own, with the worktrees next to it.
 */
final class Project
{
    /**
     * @param string $worktrees what the directory of working copies is called,
     *                          handed in because it is a setting of this
     *                          application and the Container decides those
     */
    public function __construct(
        private readonly string $projectRoot,
        private readonly string $hostProjectRoot,
        private readonly string $projectName,
        private readonly string $worktrees,
        /** What DDEV puts every project under -- "ddev.site" unless it was told otherwise. */
        private readonly string $domain = 'ddev.site',
    ) {
    }

    public function name(): string
    {
        return $this->projectName;
    }

    public function root(): string
    {
        return $this->projectRoot;
    }

    /** The same place as seen from the host -- git writes absolute paths. */
    public function hostRoot(): string
    {
        return $this->hostProjectRoot;
    }

    /**
     * Every worktree is addressed twice -- as the container sees it and as the host
     * does, because git writes absolute paths into its bookkeeping. Both are asked
     * for here, so that neither is ever written out somewhere else.
     */
    public function worktreesDirectory(): string
    {
        return $this->projectRoot . '/' . $this->worktrees;
    }

    /** What that directory is called, for what has to recognise it by name. */
    public function worktreesName(): string
    {
        return $this->worktrees;
    }

    /** The same place, as the host sees it. */
    public function hostWorktreesDirectory(): string
    {
        return $this->hostProjectRoot . '/' . $this->worktrees;
    }

    /** One worktree, as the container sees it. */
    public function worktreeDirectory(string $name): string
    {
        return $this->worktreesDirectory() . '/' . $name;
    }

    /** One worktree, as the host sees it. */
    public function hostWorktreeDirectory(string $name): string
    {
        return $this->hostWorktreesDirectory() . '/' . $name;
    }

    /**
     * Relative, because the link is followed from inside a directory that has a
     * different absolute path in the two containers that read it.
     */
    public function docrootLinkTarget(string $name): string
    {
        $below = trim(substr($this->docrootsDirectory(), \strlen($this->projectRoot)), '/');

        return str_repeat('../', substr_count($below, '/') + 1) . $this->worktrees . '/' . $name;
    }

    /**
     * Branchery lives under .ddev/branchery, where DDEV copies it. Its state goes
     * into var/ underneath, so it stays separable from the shipped files.
     */
    public function addonDirectory(): string
    {
        return $this->projectRoot . '/.ddev/branchery';
    }

    public function stateDirectory(): string
    {
        return $this->addonDirectory() . '/var';
    }

    public function metadataDirectory(): string
    {
        return $this->stateDirectory() . '/metadata';
    }

    public function docrootsDirectory(): string
    {
        return $this->stateDirectory() . '/docroots';
    }

    public function jobsDirectory(): string
    {
        return $this->stateDirectory() . '/jobs';
    }

    public function locksDirectory(): string
    {
        return $this->stateDirectory() . '/locks';
    }

    /** What the install wrote: the service, and any override of its image. */
    public function composeFile(): string
    {
        return $this->projectRoot . '/.ddev/docker-compose.branchery.yaml';
    }

    public function environmentFile(): string
    {
        return $this->projectRoot . '/.ddev/.env.branchery';
    }

    /** DDEV's own assembled compose file, which is where it describes itself. */
    public function ddevComposeFile(): string
    {
        return $this->projectRoot . '/.ddev/.ddev-docker-compose-full.yaml';
    }

    /**
     * Not through this container at all: DDEV mounts .ddev into the web container
     * at a path of its own, and that is the only place those scripts exist for the
     * process that runs them.
     */
    public function scriptsDirectory(): string
    {
        return '/mnt/ddev_config/branchery/scripts';
    }

    /**
     * Under the project's own name, which is the one DDEV already routes and the
     * one nothing else on this machine can take.
     */
    public function tld(): string
    {
        return $this->projectName . '.' . $this->domain;
    }

    /**
     * Not written down here: a project set up under "ddev.local" answers there and
     * nowhere else, and an address built from the usual domain is one nothing serves.
     */
    public function domain(): string
    {
        return $this->domain;
    }

    /**
     * The name and not the branch, although the two are usually the same word. What
     * makes the difference is that the name stays: a worktree that switched branch
     * afterwards is served where it was linked, and an address built from the
     * branch of the moment is one the list shows and nothing answers.
     */
    public function urlFor(string $worktree): string
    {
        return sprintf('https://%s.%s/', self::slug($worktree), $this->tld());
    }

    /**
     * A hostname, a directory and a database name all at once, so nothing but what
     * all three take.
     */
    public const string NAME_PATTERN = '/^[a-z0-9][a-z0-9-]*$/';

    /**
     * Asked of every name that reaches an existing worktree, on both doors. The
     * name of a new one was always checked; an existing one was taken as it came,
     * and ".." is a directory too -- the project's own, which is where a removal
     * then went to work.
     */
    public static function assertName(string $name): string
    {
        if (preg_match(self::NAME_PATTERN, $name) !== 1) {
            throw new \InvalidArgumentException(sprintf('"%s" is not a name a worktree can have: lowercase letters, digits and hyphens only.', $name));
        }

        return $name;
    }

    /**
     * The project checkout stands in the list beside the worktrees and is reached
     * by its name at the same doors, so a worktree called the same would be found
     * second at every one of them. Refused where the name is decided, because
     * nothing downstream can tell the two apart once it exists.
     */
    public function assertNotItself(string $name): string
    {
        if ($name === $this->projectName) {
            throw new \InvalidArgumentException(sprintf('"%s" is the name of the project itself, and a worktree of that name would be taken for the project checkout at every door. Pick another name (--name).', $name));
        }

        return $name;
    }

    /** Hostnames only take [a-z0-9-]: "13.4" becomes "13-4". */
    public static function slug(string $value): string
    {
        return trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($value)) ?? '', '-');
    }
}
