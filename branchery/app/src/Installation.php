<?php

declare(strict_types=1);

namespace App;

/**
 * Whether what is running is what the project asks for. The application is an
 * image and the project names the version it wants in its compose file; until
 * the project is restarted the container goes on serving the version it was
 * made from, and nothing about it looks any different -- which is the worst
 * shape an update can take.
 *
 * Two names, not two copies of the code: the tag is the version now.
 *
 * A third name is the newest version there is, which no project can work out
 * for itself: it is fetched once per container start and left in the state
 * directory, and read here as a file like any other.
 */
final class Installation
{
    /** What a tag may be made of -- everything a registry accepts as one. */
    private const TAG = '#ddev-branchery:(?<tag>[A-Za-z0-9._-]+)#';

    /** Where the startup check leaves what it found. */
    public const string NOTED = 'latest-release';

    private ?bool $behind = null;

    /**
     * @param string $version what this image is, or "dev" for one built from a
     *                        working copy -- see the VERSION file the build writes
     */
    public function __construct(
        private readonly Project $project,
        private readonly string $version,
    ) {
    }

    /** What this image is, so a page can tell it was served by another one. */
    public function version(): string
    {
        return $this->version;
    }

    /**
     * False wherever it cannot be told: an image built from a working copy has
     * nothing to compare against, and a project whose compose file says nothing is
     * not one to nag. Saying "an update is waiting" where none is teaches the
     * reader to ignore the one time it is true.
     */
    public function updateWaiting(): bool
    {
        if ($this->behind !== null) {
            return $this->behind;
        }

        $wanted = $this->wanted();

        return $this->behind = $wanted !== null && $this->released() !== null && $wanted !== $this->version;
    }

    /**
     * A version newer than the one this project asks for, where one has been
     * released; null otherwise.
     *
     * Compared against what the project wants and not against what runs, so that
     * a project already updated and waiting for its restart is told that once,
     * by updateWaiting(), rather than twice in two different words.
     */
    public function updateAvailable(): ?string
    {
        $wanted = $this->wanted();
        $latest = $this->noted();
        if ($wanted === null || $latest === null || $this->released() === null) {
            return null;
        }

        // Tags carry a "v" that means nothing to a version comparison, and one
        // that is not a version at all -- "main" -- must not read as newer.
        return version_compare(ltrim($latest, 'v'), ltrim($wanted, 'v'), '>') ? $latest : null;
    }

    /** What the startup check last found, if it has ever run and got an answer. */
    private function noted(): ?string
    {
        $file = $this->project->stateDirectory() . '/' . self::NOTED;
        if (!is_file($file)) {
            return null;
        }
        $tag = trim((string) file_get_contents($file));

        return $tag === '' ? null : $tag;
    }

    /** The version this is, unless it is not a released one. */
    private function released(): ?string
    {
        $version = trim($this->version);

        return $version === '' || $version === 'dev' ? null : $version;
    }

    /**
     * The image it would start, not the one the install wrote down: the compose
     * file names a default and ".ddev/.env.branchery" overrides it. Reading only
     * the default would call every pinned image an update that is waiting, and no
     * restart would ever clear it.
     */
    private function wanted(): ?string
    {
        // An override names the image that starts, whatever it is called. One from
        // another registry carries no tag of ours to read, and falling through to
        // the compose file's default would compare against an image nothing runs.
        $override = self::override($this->project->environmentFile());
        if ($override !== null) {
            return preg_match(self::TAG, $override, $hit) === 1 ? $hit['tag'] : null;
        }

        $compose = $this->project->composeFile();
        if (is_file($compose) && preg_match(self::TAG, (string) file_get_contents($compose), $hit) === 1) {
            return $hit['tag'];
        }

        return null;
    }

    /** The image ".ddev/.env.branchery" names, as "ddev dotenv set" writes it. */
    private static function override(string $file): ?string
    {
        if (!is_file($file) || preg_match('/^\s*(?:export\s+)?BRANCHERY_DOCKER_IMAGE=(.*)$/m', (string) file_get_contents($file), $hit) !== 1) {
            return null;
        }
        $image = trim(trim($hit[1]), '"\'');

        return $image === '' ? null : $image;
    }
}
