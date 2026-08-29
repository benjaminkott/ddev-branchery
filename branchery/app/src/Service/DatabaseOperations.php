<?php

declare(strict_types=1);

namespace App\Service;

/**
 * Creating, copying and removing the databases of the worktrees, all on the
 * project's own server: the calls run in the web container because that is
 * where the clients are.
 *
 * Every statement goes through one of two clients, built in one place each --
 * ten copies of a password and a port are ten places for one to drift.
 */
final readonly class DatabaseOperations
{
    public function __construct(
        private WebContainer $web,
        private ProjectDatabase $database,
    ) {
    }

    /**
     * How many tables a database holds, and -1 where there is none of that name.
     * The difference matters: one that is not there is free to take, an empty one
     * can be used, and one with tables in it belongs to someone.
     */
    public function tables(string $database): int
    {
        return match ($this->database->kind()) {
            'postgres' => $this->postgresTables($database),
            default => $this->mysqlTables($database),
        };
    }

    /** The bytes occupied by one database, or zero where it is not there. */
    public function size(string $database): int
    {
        if ($this->database->kind() === 'postgres') {
            if (!$this->postgresExists($database)) {
                return 0;
            }
            $result = $this->psql('postgres', sprintf("SELECT pg_database_size('%s')", $database));
        } else {
            $result = $this->mysql(sprintf(
                "SELECT COALESCE(SUM(data_length + index_length), 0) FROM information_schema.tables WHERE table_schema = '%s';",
                $database,
            ));
        }
        $this->assert($result, sprintf('Measuring %s', $database));

        return max(0, (int) trim($result->output));
    }

    /**
     * The prefix is what makes this answerable: it says these are Branchery's, and
     * the worktrees say which are still in use. What is left over is what nobody
     * removed.
     *
     * @return list<string>
     */
    public function owned(): array
    {
        $pattern = ProjectDatabase::PREFIX . '%';

        $result = match ($this->database->kind()) {
            'postgres' => $this->psql('postgres', sprintf(
                "SELECT datname FROM pg_database WHERE datname LIKE '%s' ORDER BY datname",
                $pattern,
            )),
            default => $this->mysql(sprintf(
                "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '%s' ORDER BY schema_name;",
                $pattern,
            )),
        };
        $this->assert($result, 'Listing the databases');

        return $result->lines();
    }

    public function create(string $database): void
    {
        if ($this->database->kind() === 'postgres') {
            if (!$this->postgresExists($database)) {
                $this->assert($this->psql('postgres', sprintf(
                    'CREATE DATABASE "%s" OWNER "%s";',
                    $database,
                    $this->database->user(),
                ), true), sprintf('Creating %s', $database));
            }

            return;
        }

        $this->assert($this->mysql(sprintf(
            'CREATE DATABASE IF NOT EXISTS `%s`; GRANT ALL ON `%s`.* TO \'%s\'@\'%%\';',
            $database,
            $database,
            $this->database->user(),
        ), true), sprintf('Creating %s', $database));
    }

    public function drop(string $database): void
    {
        $result = match ($this->database->kind()) {
            'postgres' => $this->psql('postgres', sprintf('DROP DATABASE IF EXISTS "%s";', $database), true),
            default => $this->mysql(sprintf('DROP DATABASE IF EXISTS `%s`;', $database), true),
        };
        $this->assert($result, sprintf('Dropping %s', $database));
    }

    /**
     * "set -o pipefail" is the whole difference between a copy and a lie: a dump
     * that fails halfway leaves the client at the other end of the pipe with what
     * it got, and that one exits successfully.
     */
    public function copy(string $from, string $to): void
    {
        $script = match ($this->database->kind()) {
            'postgres' => sprintf(
                'pg_dump %1$s %2$s | psql -v ON_ERROR_STOP=1 %1$s -d %3$s',
                $this->postgresConnection(),
                escapeshellarg($from),
                escapeshellarg($to),
            ),
            default => sprintf(
                'mysqldump %1$s --single-transaction --routines --triggers %2$s | mysql %1$s %3$s',
                $this->mysqlConnection(),
                escapeshellarg($from),
                escapeshellarg($to),
            ),
        };

        $this->assert(
            $this->web->run(['bash', '-c', 'set -o pipefail; ' . $script], null, true, $this->postgresEnvironment()),
            sprintf('Copying %s into %s', $from, $to),
        );
    }

    /**
     * The dump is written out before anything is dropped, and only a dump that came
     * out whole is loaded: down a pipe, a source that failed halfway would leave
     * the worktree without its old data and without the new.
     */
    public function replace(string $from, string $to): void
    {
        $script = match ($this->database->kind()) {
            'postgres' => sprintf(
                'pg_dump %1$s %2$s > "$dump"; '
                . 'psql %1$s -d postgres -c \'DROP DATABASE IF EXISTS "%3$s";\'; '
                . 'psql %1$s -d postgres -c \'CREATE DATABASE "%3$s" OWNER "%4$s";\'; '
                . 'psql -v ON_ERROR_STOP=1 %1$s -d %3$s -f "$dump"',
                $this->postgresConnection(),
                escapeshellarg($from),
                $to,
                $this->database->user(),
            ),
            default => sprintf(
                'mysqldump %1$s --single-transaction --routines --triggers %2$s > "$dump"; '
                . 'mysql %1$s -e \'DROP DATABASE IF EXISTS `%3$s`; CREATE DATABASE `%3$s`; GRANT ALL ON `%3$s`.* TO "%4$s"@"%%";\'; '
                . 'mysql %1$s %3$s < "$dump"',
                $this->mysqlConnection(),
                escapeshellarg($from),
                $to,
                $this->database->user(),
            ),
        };

        $this->assert($this->web->run(['bash', '-c', sprintf(
            'set -eo pipefail; dump=$(mktemp); trap \'rm -f "$dump"\' EXIT; %s',
            $script,
        )], null, true, $this->postgresEnvironment()), sprintf('Replacing %s with the data of %s', $to, $from));
    }

    private function mysqlTables(string $database): int
    {
        $result = $this->mysql(sprintf(
            "SELECT (SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '%s'),"
            . " (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '%s');",
            $database,
            $database,
        ));
        // A server that cannot be reached answers nothing, and nothing reads as
        // "not there" -- the one answer that lets an operation build on top of
        // somebody's data, or install where it meant to copy.
        $this->assert($result, sprintf('Counting the tables of %s', $database));

        $answer = preg_split('/\s+/', trim($result->output)) ?: [];

        return ($answer[0] ?? '0') === '0' ? -1 : (int) ($answer[1] ?? 0);
    }

    private function postgresTables(string $database): int
    {
        if (!$this->postgresExists($database)) {
            return -1;
        }

        $tables = $this->psql($database, "SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema')");
        $this->assert($tables, sprintf('Counting the tables of %s', $database));

        return (int) trim($tables->output);
    }

    private function postgresExists(string $database): bool
    {
        $exists = $this->psql('postgres', sprintf("SELECT 1 FROM pg_database WHERE datname='%s'", $database));
        $this->assert($exists, sprintf('Looking for %s', $database));

        return trim($exists->output) === '1';
    }

    /** A step of this kind is nobody's to ignore: everything after it builds on it. */
    private function assert(CommandResult $result, string $what): void
    {
        if (!$result->isSuccessful()) {
            throw new \RuntimeException(sprintf('%s: %s', $what, $result->message()));
        }
    }

    /**
     * Streamed into the log where it does something, and read back where it answers
     * a question.
     */
    private function mysql(string $statement, bool $stream = false): CommandResult
    {
        $server = $this->database;

        return $this->web->run([
            'mysql', '-h', $server->host(), '-P', (string) $server->port(),
            '-u', $server->rootUser(), '-p' . $server->rootPassword(), '-N', '-B', '-e', $statement,
        ], null, $stream);
    }

    /**
     * No shell in between: the password travels as the environment the client reads
     * it from, and the statement is one argument however it is quoted inside.
     */
    private function psql(string $database, string $statement, bool $stream = false): CommandResult
    {
        $server = $this->database;

        return $this->web->run([
            'psql', '-h', $server->host(), '-p', (string) $server->port(), '-U', $server->rootUser(),
            '-d', $database, '-tAc', $statement,
        ], null, $stream, $this->postgresEnvironment());
    }

    /**
     * On mysql the password is an argument; here it is a variable, and one every
     * client of the family reads -- pg_dump as much as psql.
     *
     * @return array<string, string>
     */
    private function postgresEnvironment(): array
    {
        return ['PGPASSWORD' => $this->database->rootPassword()];
    }

    /** Where the server is and who is asking, as the shell scripts write it. */
    private function mysqlConnection(): string
    {
        $server = $this->database;

        return sprintf(
            '-h %s -P %d -u %s -p%s',
            escapeshellarg($server->host()),
            $server->port(),
            escapeshellarg($server->rootUser()),
            escapeshellarg($server->rootPassword()),
        );
    }

    private function postgresConnection(): string
    {
        $server = $this->database;

        return sprintf(
            '-h %s -p %d -U %s',
            escapeshellarg($server->host()),
            $server->port(),
            escapeshellarg($server->rootUser()),
        );
    }
}
