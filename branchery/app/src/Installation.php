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
 */
final class Installation
{
    /** What a tag may be made of -- everything a registry accepts as one. */
    private const TAG = '#ddev-branchery:(?<tag>[A-Za-z0-9._-]+)#';

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
