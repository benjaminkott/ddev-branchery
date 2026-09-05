<?php

declare(strict_types=1);

namespace App\Config;

use App\CommandResult;
use App\Database\ProjectDatabase;
use App\ManagedFiles;
use App\Web\WebContainer;

/** Everything a profile needs in order to work. */
final readonly class WorktreeContext
{
    public function __construct(
        public string $name,
        public string $branch,
        public string $url,
        public string $directory,
        public string $hostDirectory,
        public string $phpBinary,
        /** Where the project's own binaries are, as its configuration says. */
        public string $binDirectory,
        /** What is served out of the worktree, as its configuration says. */
        public string $docroot,
        public ProjectDatabase $database,
        /** This worktree's own database on that server. */
        public string $databaseName,
        public WebContainer $web,
        public ManagedFiles $files,
        public string $tld,
        /**
         * Null where the container's own applies -- that one is on the path
         * already.
         */
        public ?string $nodeDirectory = null,
        public string $adminUser = 'admin',
        public string $adminPassword = 'Password1!',
        public string $adminEmail = 'admin@example.com',
    ) {
    }

    /** Run a command inside the worktree; what it says goes into the log. */
    public function run(string ...$command): CommandResult
    {
        return $this->web->run(array_values($command), $this->hostDirectory, true, $this->environment());
    }

    /**
     * A project's own recipe is the reason these exist: a line that has to point a
     * site or name a dump needs the address and the database of the worktree it is
     * building, and the only other way to them is to guess from the directory. The
     * names are the ones the editor's terminal already carries.
     *
     * @return array<string, string>
     */
    public function environment(): array
    {
        $database = $this->database;

        return [
            'BRANCHERY_NAME' => $this->name,
            'BRANCHERY_BRANCH' => $this->branch,
            'BRANCHERY_URL' => $this->url,
            'BRANCHERY_HOST' => self::hostOf($this->url),
            'BRANCHERY_TLD' => $this->tld,
            // The tld as a pattern, because every application that is told which hosts
            // to trust wants it that way, and escaping dots in a shell is how a
            // configuration file ends up with none.
            'BRANCHERY_HOSTS_PATTERN' => '.*\\.' . str_replace('.', '\\.', $this->tld),
            'BRANCHERY_PHP' => $this->phpBinary,
            // Both, because a recipe line names either: a script is run with node,
            // everything else with npm. With the container's own version these are the
            // plain names, which is what a line would have written anyway.
            'BRANCHERY_NODE' => $this->nodeDirectory === null ? 'node' : $this->nodeDirectory . '/node',
            'BRANCHERY_NPM' => $this->nodeDirectory === null ? 'npm' : $this->nodeDirectory . '/npm',
            'BRANCHERY_BIN' => $this->binDirectory,
            'BRANCHERY_DOCROOT' => $this->docroot,
            'BRANCHERY_DATABASE' => $this->databaseName,
            'BRANCHERY_DB_DRIVER' => $database->driver(),
            'BRANCHERY_DB_HOST' => $database->host(),
            'BRANCHERY_DB_PORT' => (string) $database->port(),
            'BRANCHERY_DB_USER' => $database->user(),
            'BRANCHERY_DB_PASSWORD' => $database->password(),
            // The same connection as one string, for what wants a URL.
            'BRANCHERY_DB_URL' => $database->url($this->databaseName),
            'BRANCHERY_ADMIN_USER' => $this->adminUser,
            'BRANCHERY_ADMIN_PASSWORD' => $this->adminPassword,
            'BRANCHERY_ADMIN_EMAIL' => $this->adminEmail,
        ];
    }

    /** The address without its scheme or its path -- what a site is found by. */
    public static function hostOf(string $url): string
    {
        return (string) (parse_url($url, PHP_URL_HOST) ?: '');
    }

    /**
     * Written by a person as they would type it, so it goes through a shell: pipes,
     * redirections and "&&" are what the line will contain. A failure stops the
     * operation -- the line is in the recipe because the worktree is not finished
     * without it.
     */
    public function shell(string $line): CommandResult
    {
        $result = $this->web->run(['bash', '-lc', $this->withNode($line)], $this->hostDirectory, true, $this->environment());
        if (!$result->isSuccessful()) {
            throw new \RuntimeException(self::failed($line, $result));
        }

        return $result;
    }

    /**
     * The line and its exit status, and not what it wrote: that went into the log
     * line by line while it ran, and carrying it again made the reason the
     * interface shows the first, harmless line of a screenful.
     *
     * Nor does it say where what was written is: that depends on who is reading,
     * and each of those surfaces says it itself.
     */
    public static function failed(string $line, CommandResult $result): string
    {
        return sprintf('%s failed with exit status %d.', $line, $result->exitCode);
    }

    /**
     * Written into the line rather than handed over as PATH: the login shell reads
     * the profile first and the profile writes the path rather than adding to it,
     * so anything passed through docker exec is gone by the time `npm` is looked
     * up. This runs afterwards, and wins.
     */
    private function withNode(string $line): string
    {
        return $this->nodeDirectory === null
            ? $line
            : sprintf('export PATH=%s:"$PATH"; %s', escapeshellarg($this->nodeDirectory), $line);
    }

    /**
     * A failure here leaves the worktree without dependencies -- and thus without a
     * docroot to serve -- so it aborts the whole operation instead of being passed
     * on as a return value nobody looks at.
     */
    public function composer(string ...$arguments): CommandResult
    {
        $result = $this->run($this->phpBinary, '/usr/local/bin/composer', ...$arguments);
        if (!$result->isSuccessful()) {
            throw new \RuntimeException(self::failed('composer ' . implode(' ', $arguments), $result));
        }

        return $result;
    }
}
