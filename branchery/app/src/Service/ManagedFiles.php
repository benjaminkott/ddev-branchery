<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\Filesystem\Filesystem;

/**
 * Writes files into the project directory. The management container works as
 * root and the project belongs to the user on the host, so every file that is
 * created gets their ownership -- otherwise neither the editor nor git could
 * work with it afterwards.
 */
final readonly class ManagedFiles
{
    private Filesystem $filesystem;

    public function __construct(
        private int $ownerUid,
        private int $ownerGid,
    ) {
        $this->filesystem = new Filesystem();
    }

    public function write(string $path, string $contents): void
    {
        $this->ensureDirectory(\dirname($path));
        $this->filesystem->dumpFile($path, $contents);
        $this->own($path);
    }

    /**
     * The levels are counted before they exist, because mkdir() makes the whole
     * chain in one go and only the last would be given away. A parent left with
     * root's name on it is not cosmetic: the web container works as the user, and
     * "typo3 setup" creating config/sites/ inside a config/ made here then fails.
     */
    public function ensureDirectory(string $path): void
    {
        if (is_dir($path)) {
            return;
        }

        $missing = [];
        for ($level = $path; !is_dir($level) && $level !== \dirname($level); $level = \dirname($level)) {
            $missing[] = $level;
        }

        $this->filesystem->mkdir($path, 0775);
        foreach ($missing as $level) {
            $this->own($level);
        }
    }

    /**
     * A directory that belongs to Branchery, not to the project it sits in. It gets
     * a .gitignore of its own covering itself, because these are created inside
     * checkouts the user works in. An existing one is left alone, being the
     * project's and not ours to overwrite.
     */
    public function ensureIgnoredDirectory(string $path): void
    {
        $this->ensureDirectory($path);

        $ignore = $path . '/.gitignore';
        if (file_exists($ignore)) {
            return;
        }

        $this->write($ignore, "# Created by Branchery. Generated state, not source.\n*\n");
    }

    public function symlink(string $link, string $target): void
    {
        $this->ensureDirectory(\dirname($link));
        if (is_link($link) || file_exists($link)) {
            $this->filesystem->remove($link);
        }
        $this->filesystem->symlink($target, $link);
    }

    public function remove(string ...$paths): void
    {
        $this->filesystem->remove($paths);
    }

    private function own(string $path): void
    {
        if ($this->ownerUid <= 0) {
            return;
        }
        @chown($path, $this->ownerUid);
        @chgrp($path, $this->ownerGid);
    }
}
