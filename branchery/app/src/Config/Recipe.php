<?php

declare(strict_types=1);

namespace App\Config;

use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Yaml;

/**
 * What a project says about how its branches are built. All of it.
 *
 * Nothing about a checkout is guessed: an operation makes a worktree, and
 * everything beyond that is a line in this file or does not happen. Read out of
 * the worktree first, so a branch that builds differently carries the
 * difference in its own commit.
 *
 * Anything it does not understand is refused rather than ignored: a typed key
 * that silently does nothing leaves a worktree missing exactly the step the
 * file was written for.
 */
final readonly class Recipe
{
    public const FILE = '.ddev/branchery.yaml';

    /** The moments a recipe may speak about, in the order they happen. */
    public const MOMENTS = ['install', 'setup', 'migrate', 'configure', 'flush'];

    /**
     * What never travels into a worktree, whatever a project says: the repository's
     * bookkeeping, the management with its record of every job, and the other
     * worktrees -- which carried over would be every worktree inside this one.
     */
    private const NEVER = ['.git', '.ddev'];

    private const SETTINGS = ['profile', 'docroot', 'php', 'node', 'backend', 'bin'];

    /** The review a checkout belongs to, the issue it closes, and the commit itself. */
    private const LINKS = ['review', 'issue', 'commit'];

    /** What each of those addresses has to say where the number goes. */
    private const PLACEHOLDERS = ['review' => '{change}', 'issue' => '{issue}', 'commit' => '{commit}'];

    /** Where a worktree's data may come from. */
    private const SOURCES = ['source', 'none'];

    /** What a project that says nothing about its data says. */
    private const NO_DATA = ['from' => null, 'bring' => [], 'addresses' => []];

    /**
     * @param array<string, array{before: list<RecipeCommand>, run: ?list<RecipeCommand>, after: list<RecipeCommand>}> $moments
     * @param array{review: ?string, issue: ?string, commit: ?string}                                                  $links
     */
    private function __construct(
        /**
         * The shipped configuration this one is built on, by name -- the shortcut
         * for "the TYPO3 one, with these two lines changed". The file it names is
         * written in the same grammar.
         */
        public ?string $profile,
        public ?string $docroot,
        public ?string $php,
        /**
         * Where the version is written down in the checkout, for a project whose
         * branches do not all want the same one.
         *
         * @var ?array{read: string, match: string}
         */
        public ?array $phpRead,
        /**
         * Nothing is served with it -- node is a build tool here -- so this is
         * what `npm` in a recipe line runs under, and no more.
         */
        public ?string $node,
        /**
         * Where that version is written down, for a project that keeps it
         * somewhere `.nvmrc` is not.
         *
         * @var ?array{read: string, match: string}
         */
        public ?array $nodeRead,
        public ?string $backend,
        /** Where the project's own binaries are -- composer's bin-dir. */
        public ?string $bin,
        public array $links,
        /**
         * @var array{from: ?string, bring: list<string>, addresses: list<string>}
         */
        public array $data,
        /**
         * Instead of everything git ignores. Null where the project did not
         * say, which is the ordinary answer: whatever is not in the repository
         * is what a fork needs in order to run without a build.
         *
         * @var ?list<string>
         */
        public ?array $carry,
        /**
         * On top of what never does.
         *
         * @var list<string>
         */
        public array $carryExcept,
        private array $moments,
    ) {
    }

    /** A project that says nothing: a worktree is a checkout and no more. */
    public static function none(): self
    {
        return new self(null, null, null, null, null, null, null, null, ['review' => null, 'issue' => null, 'commit' => null], self::NO_DATA, null, [], []);
    }

    /** Out of a file that is not on disk here -- a branch's own. */
    public static function fromString(string $yaml): self
    {
        try {
            return self::fromParsed(Yaml::parse($yaml));
        } catch (ParseException $exception) {
            throw new \RuntimeException(sprintf('%s cannot be read: %s', self::FILE, $exception->getMessage()), 0, $exception);
        }
    }

    public static function fromFile(string $file): self
    {
        try {
            return self::fromParsed(Yaml::parseFile($file));
        } catch (ParseException $exception) {
            throw new \RuntimeException(sprintf('%s cannot be read: %s', self::FILE, $exception->getMessage()), 0, $exception);
        }
    }

    private static function fromParsed(mixed $data): self
    {
        // An empty file is one somebody started and did not finish; taking it as
        // "nothing to add" is the reading that surprises nobody.
        if ($data === null) {
            return self::none();
        }
        if (!is_array($data)) {
            throw new \RuntimeException(sprintf('%s has to be a mapping of settings, not a single value.', self::FILE));
        }

        return self::fromArray($data);
    }

    /** @param array<mixed> $data */
    public static function fromArray(array $data): self
    {
        $known = [...self::SETTINGS, 'links', 'carry', 'data', ...self::MOMENTS];
        foreach (array_keys($data) as $key) {
            if (!in_array($key, $known, true)) {
                throw new \RuntimeException(sprintf('%s: "%s" is not something this understands. It knows %s.', self::FILE, (string) $key, implode(', ', $known)));
            }
        }

        $moments = [];
        foreach (self::MOMENTS as $moment) {
            if (array_key_exists($moment, $data)) {
                $moments[$moment] = self::readMoment($moment, $data[$moment]);
            }
        }

        $carry = self::readCarry($data['carry'] ?? null);
        $php = self::readVersion($data['php'] ?? null, 'php');
        $node = self::readVersion($data['node'] ?? null, 'node');

        return new self(
            self::readSetting($data, 'profile'),
            self::readDocroot($data),
            $php['version'],
            $php['read'],
            $node['version'],
            $node['read'],
            self::readSetting($data, 'backend'),
            self::readSetting($data, 'bin'),
            self::readLinks($data['links'] ?? null),
            self::readData($data['data'] ?? null),
            $carry['only'],
            $carry['except'],
            $moments,
        );
    }

    public function isEmpty(): bool
    {
        return $this->moments === []
            && $this->profile === null
            && $this->docroot === null
            && $this->php === null
            && $this->phpRead === null
            && $this->node === null
            && $this->nodeRead === null
            && $this->backend === null
            && $this->bin === null
            && $this->carry === null
            && $this->carryExcept === []
            && $this->data === self::NO_DATA
            && $this->links === ['review' => null, 'issue' => null, 'commit' => null];
    }

    /**
     * The one written here, or where in the checkout it is written down. The second
     * form is what a repository whose branches build against their own versions
     * needs -- the TYPO3 core says its PHP in the test runner and its Node in
     * `Build/.nvmrc`.
     *
     * @return array{version: ?string, read: ?array{read: string, match: string}}
     */
    private static function readVersion(mixed $value, string $key): array
    {
        if ($value === null) {
            return ['version' => null, 'read' => null];
        }
        // A version written without quotes arrives as a number, and 8.30 is not
        // what anybody meant to write -- but 8.3 is, so it is taken.
        if (is_string($value) || is_int($value) || is_float($value)) {
            $version = trim((string) $value);
            if ($version === '') {
                throw new \RuntimeException(sprintf('%s: "%s" has to be a value, and not an empty one.', self::FILE, $key));
            }

            return ['version' => $version, 'read' => null];
        }
        if (!is_array($value) || array_is_list($value)) {
            throw new \RuntimeException(sprintf('%s: "%s" is a version, or "read" and "match" saying where in the checkout it stands.', self::FILE, $key));
        }
        foreach (array_keys($value) as $under) {
            if (!in_array($under, ['read', 'match'], true)) {
                throw new \RuntimeException(sprintf('%s: "%s" under "%s" is not "read" or "match".', self::FILE, (string) $under, $key));
            }
        }
        foreach (['read', 'match'] as $needed) {
            if (!isset($value[$needed]) || !is_string($value[$needed]) || trim($value[$needed]) === '') {
                throw new \RuntimeException(sprintf('%s: "%s.%s" has to be a value, and not an empty one.', self::FILE, $key, $needed));
            }
        }
        if (@preg_match(self::patternOf(trim($value['match'])), '') === false) {
            // Said now: a pattern that cannot be read would otherwise be a version
            // nobody finds, in an operation that reports success.
            throw new \RuntimeException(sprintf('%s: "%s.match" is not a pattern this can read.', self::FILE, $key));
        }

        return ['version' => null, 'read' => ['read' => trim($value['read']), 'match' => trim($value['match'])]];
    }

    /**
     * The first group where the pattern has one, the whole match where it has not.
     * Null where the pattern matches nothing.
     */
    public static function versionIn(string $contents, string $match): ?string
    {
        return preg_match(self::patternOf($match), $contents, $hit) === 1 ? ($hit[1] ?? $hit[0]) : null;
    }

    /** The pattern as written, made into one preg reads -- slashes and all. */
    private static function patternOf(string $match): string
    {
        return '/' . str_replace('/', '\\/', $match) . '/';
    }

    /**
     * A database on its own is not readable: a site points at its root page by uid,
     * and the application reading those uids has to be installed at all -- which is
     * a settings file, not a schema. Both are paths in the checkout, so the project
     * names them rather than Branchery knowing them.
     *
     * @return array{from: ?string, bring: list<string>, addresses: list<string>}
     */
    private static function readData(mixed $value): array
    {
        if ($value === null) {
            return self::NO_DATA;
        }
        if (!is_array($value) || array_is_list($value)) {
            throw new \RuntimeException(sprintf('%s: "data" has to be a mapping of from, bring and addresses.', self::FILE));
        }

        $from = null;
        $paths = ['bring' => [], 'addresses' => []];
        foreach ($value as $key => $said) {
            switch ($key) {
                case 'from':
                    if (!is_string($said) || !in_array($said, self::SOURCES, true)) {
                        throw new \RuntimeException(sprintf('%s: "data.from" is %s.', self::FILE, implode(' or ', self::SOURCES)));
                    }
                    $from = $said;
                    break;
                case 'bring':
                case 'addresses':
                    if (!is_array($said) || !array_is_list($said)) {
                        throw new \RuntimeException(sprintf('%s: "data.%s" has to be a list of paths.', self::FILE, (string) $key));
                    }
                    $paths[$key] = self::readPaths($said, 'data.' . (string) $key);
                    break;
                default:
                    throw new \RuntimeException(sprintf('%s: "%s" under "data" is not one of from, bring, addresses.', self::FILE, (string) $key));
            }
        }

        return ['from' => $from, 'bring' => $paths['bring'], 'addresses' => $paths['addresses']];
    }

    /**
     * Written as the whole address with "{change}" or "{issue}" where the number
     * goes, rather than as a host to append to: every tracker puts it somewhere
     * else, and a project that says it in full never has to be taught about.
     *
     * @return array{review: ?string, issue: ?string, commit: ?string}
     */
    private static function readLinks(mixed $value): array
    {
        $links = ['review' => null, 'issue' => null, 'commit' => null];
        if ($value === null) {
            return $links;
        }
        if (!is_array($value)) {
            throw new \RuntimeException(sprintf('%s: "links" has to be a mapping of %s.', self::FILE, implode(' and ', self::LINKS)));
        }

        foreach ($value as $kind => $address) {
            if (!in_array($kind, self::LINKS, true)) {
                throw new \RuntimeException(sprintf('%s: "%s" under "links" is not one of %s.', self::FILE, (string) $kind, implode(', ', self::LINKS)));
            }
            if (!is_string($address) || trim($address) === '') {
                throw new \RuntimeException(sprintf('%s: "links.%s" has to be an address.', self::FILE, (string) $kind));
            }
            $placeholder = self::PLACEHOLDERS[$kind];
            if (!str_contains($address, $placeholder)) {
                // Said now rather than as a link to the front page of a tracker: the
                // number is the whole point of the address.
                throw new \RuntimeException(sprintf('%s: "links.%s" has to say where the number goes, with %s in it.', self::FILE, (string) $kind, $placeholder));
            }
            $links[$kind] = trim($address);
        }

        return $links;
    }

    /**
     * A fork carries over what git ignores, which is what makes it run without a
     * build -- and also how a cache built for other code gets carried into a
     * checkout it is wrong for. A list is what travels; a mapping amends what
     * would have travelled.
     *
     * @return array{only: ?list<string>, except: list<string>}
     */
    private static function readCarry(mixed $value): array
    {
        if ($value === null) {
            return ['only' => null, 'except' => []];
        }
        if (is_array($value) && array_is_list($value)) {
            return ['only' => self::readPaths($value, 'carry'), 'except' => []];
        }
        if (!is_array($value)) {
            throw new \RuntimeException(sprintf('%s: "carry" has to be a list of what travels, or "except" with a list of what does not.', self::FILE));
        }

        foreach (array_keys($value) as $key) {
            if ($key !== 'except') {
                throw new \RuntimeException(sprintf('%s: "%s" under "carry" is not "except".', self::FILE, (string) $key));
            }
        }
        if (!is_array($value['except']) || !array_is_list($value['except'])) {
            throw new \RuntimeException(sprintf('%s: "carry.except" has to be a list of what does not travel.', self::FILE));
        }

        return ['only' => null, 'except' => self::readPaths($value['except'], 'carry.except')];
    }

    /**
     * Relative to the checkout, and none of them ours.
     *
     * @param list<mixed> $paths
     *
     * @return list<string>
     */
    private static function readPaths(array $paths, string $where): array
    {
        $read = [];
        foreach ($paths as $path) {
            if (!is_string($path) || trim($path) === '') {
                throw new \RuntimeException(sprintf('%s: "%s" holds an entry with nothing in it.', self::FILE, $where));
            }
            $path = trim(trim($path), '/');
            if ($path === '' || in_array('..', explode('/', $path), true)) {
                throw new \RuntimeException(sprintf('%s: "%s" is a path inside the checkout, and "%s" leads out of it.', self::FILE, $where, $path));
            }
            foreach (self::NEVER as $ours) {
                if ($path === $ours || str_starts_with($path, $ours . '/')) {
                    // Said rather than dropped: a project that wrote this expects it to
                    // happen, and it never will.
                    throw new \RuntimeException(sprintf('%s: "%s" under "%s" is the project\'s own and never travels into a worktree.', self::FILE, $path, $where));
                }
            }
            $read[] = $path;
        }

        return $read;
    }

    /** Whether the profile's own work at that moment is replaced. */
    public function replaces(string $moment): bool
    {
        return ($this->moments[$moment]['run'] ?? null) !== null;
    }

    /** @return list<RecipeCommand> */
    public function commands(string $moment, string $when): array
    {
        return $this->moments[$moment][$when] ?? [];
    }

    /**
     * The order is the whole of what a recipe does, and it is worth being able to
     * read back without running anything: null stands for the profile doing its own
     * work, a command for a line the project wrote.
     *
     * @return list<?RecipeCommand>
     */
    public function plan(string $moment): array
    {
        $plan = [];
        foreach ($this->commands($moment, 'before') as $line) {
            $plan[] = $line;
        }
        if ($this->replaces($moment)) {
            foreach ($this->commands($moment, 'run') as $line) {
                $plan[] = $line;
            }
        } else {
            $plan[] = null;
        }
        foreach ($this->commands($moment, 'after') as $line) {
            $plan[] = $line;
        }

        return $plan;
    }

    /** @return array{before: list<RecipeCommand>, run: ?list<RecipeCommand>, after: list<RecipeCommand>} */
    private static function readMoment(string $moment, mixed $value): array
    {
        if (!is_array($value)) {
            throw new \RuntimeException(sprintf('%s: "%s" has to be a list of commands, or before/run/after.', self::FILE, $moment));
        }

        // The short form says what the moment is: "installing is these commands".
        if (array_is_list($value)) {
            return ['before' => [], 'run' => self::readCommands($moment, 'run', $value), 'after' => []];
        }

        $step = ['before' => [], 'run' => null, 'after' => []];
        foreach ($value as $when => $commands) {
            if (!in_array($when, ['before', 'run', 'after'], true)) {
                throw new \RuntimeException(sprintf('%s: "%s" under "%s" is not one of before, run, after.', self::FILE, (string) $when, $moment));
            }
            if (!is_array($commands) || !array_is_list($commands)) {
                throw new \RuntimeException(sprintf('%s: "%s.%s" has to be a list of commands.', self::FILE, $moment, (string) $when));
            }
            $step[$when] = self::readCommands($moment, (string) $when, $commands);
        }

        return $step;
    }

    /**
     * A line is either what to run, or a task written the way DDEV writes a hook
     * task -- "exec:" and "composer:" -- so a developer who has written hooks in
     * .ddev/config.yaml is writing the same thing here. Such a task may add
     * "optional: true".
     *
     * @param list<mixed> $commands
     *
     * @return list<RecipeCommand>
     */
    private static function readCommands(string $moment, string $when, array $commands): array
    {
        $where = $moment . ($when === 'run' ? '' : '.' . $when);
        $read = [];

        foreach ($commands as $entry) {
            if (is_string($entry)) {
                if (trim($entry) === '') {
                    throw new \RuntimeException(sprintf('%s: "%s" holds a command with nothing in it.', self::FILE, $where));
                }
                $read[] = new RecipeCommand('exec', trim($entry));
                continue;
            }

            if (!is_array($entry) || $entry === []) {
                throw new \RuntimeException(sprintf('%s: every command under "%s" is a line to run, or one of %s.', self::FILE, $where, implode(', ', array_map(static fn (string $kind): string => $kind . ':', RecipeCommand::KINDS))));
            }

            $optional = self::readOptional($where, $entry);
            // Whatever is left once "optional" is taken out is the task itself, and
            // there is exactly one: two kinds under one entry is a line whose order
            // nobody can read off the file.
            unset($entry['optional']);
            if (count($entry) !== 1) {
                throw new \RuntimeException(sprintf('%s: every command under "%s" is a line to run, or one of %s.', self::FILE, $where, implode(', ', array_map(static fn (string $kind): string => $kind . ':', RecipeCommand::KINDS))));
            }

            $kind = (string) array_key_first($entry);
            $line = reset($entry);
            if (!in_array($kind, RecipeCommand::KINDS, true)) {
                throw new \RuntimeException(sprintf('%s: "%s" under "%s" is not one of %s.', self::FILE, $kind, $where, implode(', ', RecipeCommand::KINDS)));
            }
            if (!is_string($line) || trim($line) === '') {
                throw new \RuntimeException(sprintf('%s: "%s:" under "%s" needs something to run.', self::FILE, $kind, $where));
            }

            $read[] = new RecipeCommand($kind, trim($line), $optional);
        }

        return $read;
    }

    /**
     * Refused where it is written as anything but yes or no: "optional: maybe"
     * would be read as no, and a line meant to be allowed to fail would take the
     * whole build with it on the day it does.
     *
     * @param array<mixed> $entry
     */
    private static function readOptional(string $where, array $entry): bool
    {
        if (!array_key_exists('optional', $entry)) {
            return false;
        }
        if (!is_bool($entry['optional'])) {
            throw new \RuntimeException(sprintf('%s: "optional" under "%s" is true or false.', self::FILE, $where));
        }

        return $entry['optional'];
    }

    /**
     * The one setting whose empty value means something: `docroot: ""` is the TYPO3
     * core, and every other repository served as it lies.
     *
     * @param array<mixed> $data
     */
    private static function readDocroot(array $data): ?string
    {
        if (!array_key_exists('docroot', $data)) {
            return null;
        }
        $value = $data['docroot'];
        if (!is_string($value)) {
            throw new \RuntimeException(sprintf('%s: "docroot" has to be a path, or "" for the checkout itself.', self::FILE));
        }
        $docroot = trim(trim($value), '/');
        // The same rule every other path in this file is held to. It is the one
        // the web server is pointed at, so a path leading out of the checkout is a
        // worktree quietly serving something that is not it -- and this file can
        // arrive with a branch, committed by somebody else.
        if (in_array('..', explode('/', $docroot), true)) {
            throw new \RuntimeException(sprintf('%s: "docroot" is a path inside the checkout, and "%s" leads out of it.', self::FILE, $docroot));
        }

        return $docroot;
    }

    /** @param array<mixed> $data */
    private static function readSetting(array $data, string $key): ?string
    {
        if (!array_key_exists($key, $data)) {
            return null;
        }
        $value = $data[$key];
        // A value written without quotes may arrive as a number -- a profile
        // called "13", say -- and is taken as the word it was meant to be.
        if (is_int($value) || is_float($value)) {
            $value = (string) $value;
        }
        if (!is_string($value) || trim($value) === '') {
            throw new \RuntimeException(sprintf('%s: "%s" has to be a value, and not an empty one.', self::FILE, $key));
        }

        return trim($value);
    }
}
