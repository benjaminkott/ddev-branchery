<?php

declare(strict_types=1);

namespace App\Database;

use App\Web\WebContainer;

/**
 * The project's database server -- the only one there is. DDEV configures one
 * for the project and every worktree gets a database of its own on it, which is
 * the point: phpMyAdmin lists them beside the project's own, and "ddev
 * export-db --database=branchery_my_fix" writes a dump of one.
 *
 * Which server it is -- MariaDB, MySQL or PostgreSQL -- is nothing to configure
 * here: DDEV puts it into the web container's environment.
 */
final class ProjectDatabase
{
    /** The database DDEV creates for the project itself. */
    public const string PROJECT_DATABASE = 'db';

    /** What every database of a worktree is called first, and nothing else is. */
    public const string PREFIX = 'branchery_';

    /**
     * Not the server's limit -- MySQL allows 64 characters, PostgreSQL 63 -- but
     * TYPO3's: its install tool refuses anything longer than fifty, drops the name
     * from the configuration it writes and fails several steps later with a
     * Doctrine error about a missing database.
     */
    private const int MAX_LENGTH = 50;

    /** "mysql" or "postgres" -- MariaDB and MySQL are the same to talk to. */
    private ?string $kind = null;

    public function __construct(private readonly WebContainer $web)
    {
    }

    /**
     * It decides how databases are created, copied and dropped. DDEV names the
     * family in DDEV_DATABASE_FAMILY and older versions at least the type in
     * DDEV_DATABASE; neither being there means the DDEV default, MariaDB.
     */
    public function kind(): string
    {
        if ($this->kind !== null) {
            return $this->kind;
        }

        $answer = $this->web->run(['bash', '-c', 'printf %s "${DDEV_DATABASE_FAMILY:-${DDEV_DATABASE%%:*}}"'])->output;

        return $this->kind = str_contains($answer, 'postgres') ? 'postgres' : 'mysql';
    }

    /** The host name of the server inside the project's network. */
    public function host(): string
    {
        return 'db';
    }

    public function port(): int
    {
        return $this->kind() === 'postgres' ? 5432 : 3306;
    }

    /** The account an application connects with; DDEV grants it every database. */
    public function user(): string
    {
        return 'db';
    }

    public function password(): string
    {
        return 'db';
    }

    /** The account that may create and drop databases. */
    public function rootUser(): string
    {
        return $this->kind() === 'postgres' ? 'db' : 'root';
    }

    public function rootPassword(): string
    {
        return $this->kind() === 'postgres' ? 'db' : 'root';
    }

    /** The Doctrine driver an application is configured with. */
    public function driver(): string
    {
        return $this->kind() === 'postgres' ? 'pdo_pgsql' : 'mysqli';
    }

    /**
     * As a URL, which is how a good many frameworks take it -- Symfony's
     * DATABASE_URL, Doctrine's, and everything that reads a DSN.
     */
    public function url(string $database): string
    {
        return sprintf(
            '%s://%s:%s@%s:%d/%s',
            $this->kind() === 'postgres' ? 'postgresql' : 'mysql',
            $this->user(),
            $this->password(),
            $this->host(),
            $this->port(),
            $database,
        );
    }

    /**
     * The prefix is what makes it recognisable in a list of databases: everything
     * of Branchery's stands together, apart from the project's own "db".
     */
    public function nameFor(string $worktree): string
    {
        $name = self::PREFIX . str_replace('-', '_', $worktree);
        if (strlen($name) <= self::MAX_LENGTH) {
            return $name;
        }

        // Cut, with a digest of the whole name where the cut was: what is left
        // still says which worktree this is, and two long branch names that begin
        // alike cannot end up on the same database.
        return substr($name, 0, self::MAX_LENGTH - 7) . '_' . substr(md5($worktree), 0, 6);
    }
}
