<?php

declare(strict_types=1);

namespace App\Http;

use App\Project;

/**
 * The parameters a request brought along -- a JSON body or a query string --
 * and what of them may be used.
 *
 * A body and a query string are both a map of whatever the caller wrote, which
 * is to say a map of anything at all: a list where a name was expected, a
 * branch name with an option in it, a page number that is a word. Reading one
 * safely is the same handful of rules every door needs, and written out at each
 * of them they were a rule apiece to forget -- the door that forgot `is_scalar`
 * looked up a worktree called "Array".
 *
 * A refusal here is an \InvalidArgumentException, which the router answers as a
 * 400 carrying its message: what the caller asked for cannot be done, and the
 * sentence says why.
 */
final readonly class Parameters
{
    /**
     * The only door a branch name reaches git through, so it is written where
     * every door reads one and nowhere else.
     */
    private const string BRANCH = '#^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$#';

    /** @param array<string, mixed> $fields */
    private function __construct(private array $fields)
    {
    }

    /** @param array<string, mixed> $fields what stood in the body or behind the question mark */
    public static function of(array $fields): self
    {
        return new self($fields);
    }

    /**
     * A list where a name was expected is a malformed request, not a worktree
     * called "Array".
     */
    public function text(string $field): string
    {
        $value = $this->fields[$field] ?? '';

        return is_scalar($value) ? trim((string) $value) : '';
    }

    /** Said and meant: anything short of true is the caller not asking for it. */
    public function flag(string $field): bool
    {
        return ($this->fields[$field] ?? false) === true;
    }

    /** Whether the caller said anything about it at all. */
    public function has(string $field): bool
    {
        return ($this->fields[$field] ?? null) !== null;
    }

    /**
     * How far into a list the caller already is, or how much of a log they
     * already have. Never backwards: a negative offset is a caller reading a
     * number out of their own arithmetic, and git would take it as an option.
     */
    public function number(string $field): int
    {
        return max(0, (int) $this->text($field));
    }

    /** A branch name as git would take one, or the refusal for anything else. */
    public function branch(string $field = 'branch'): string
    {
        $name = $this->text($field);
        if (preg_match(self::BRANCH, $name) !== 1) {
            throw new \InvalidArgumentException('Invalid branch name.');
        }

        return $name;
    }

    /**
     * The name the caller chose for a worktree, where they chose one. It becomes
     * a hostname, a directory and a database name, which is why the rule is the
     * one the operation holds it to and not a looser one.
     */
    public function name(string $field = 'name'): ?string
    {
        $name = $this->text($field);
        if ($name === '') {
            return null;
        }
        if (preg_match(Project::NAME_PATTERN, $name) !== 1) {
            throw new \InvalidArgumentException('The worktree name may only contain lowercase letters, digits and hyphens.');
        }

        return $name;
    }
}
