<?php

declare(strict_types=1);

namespace App\Web;

/**
 * The project's database server -- the only one there is. DDEV configures one
 * for the project and every worktree gets a database of its own on it, which is
 * the point: phpMyAdmin lists them beside the project's own, and "ddev
 * export-db --database=branchery_my_fix" writes a dump of one.
 *
 * Which server it is -- MariaDB, MySQL or PostgreSQL -- is nothing to configure
 * here: DDEV puts it into the web container's environment.
 */
final class DatabaseServer
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
     * The client for one database, as a line a recipe pipes a statement into.
     * Both clients read from standard input, which is what lets this be one
     * string rather than a flag every line would have to choose between.
     *
     * The account an application connects with, not the one that creates
     * databases: a recipe speaks about the data of its own worktree.
     *
     * Nothing here is quoted, and it may not be: a shell splits the value of a
     * variable into words but performs no quote removal on it, so a quoted host
     * arrives as part of the argument -- "Unknown server host ''db''". What goes
     * in is DDEV's own naming and a database named by Project::assertName, and
     * there is no space in any of it.
     */
    public function client(string $database): string
    {
        if ($this->kind() === 'postgres') {
            return sprintf(
                'PGPASSWORD=%s psql -h %s -p %d -U %s -d %s',
                $this->password(),
                $this->host(),
                $this->port(),
                $this->user(),
                $database,
            );
        }

        return sprintf(
            'mysql -h %s -P %d -u %s -p%s %s',
            $this->host(),
            $this->port(),
            $this->user(),
            $this->password(),
            $database,
        );
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
