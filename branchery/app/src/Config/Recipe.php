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
 *
 * One rule holds the whole of it together, and `over()` is where it is written
 * down: null is "the file did not say", and nothing else means that. A list
 * written empty is an answer -- it is how a project takes away what the
 * configuration it names would have done.
 */
final readonly class Recipe
{
    public const FILE = '.ddev/branchery.yaml';

    /**
     * The moments a recipe may speak about, in the order a build asks for them.
     * "setup" and "migrate" are the two halves of one question and never both:
     * a worktree with no data to inherit is set up, one that has data is fitted
     * to it. "finish" is asked for at the end of every operation that touches a
     * worktree, a version switch and a bare reconfiguration included.
     *
     * "account" is the one no build asks for: it is what a reader presses, on a
     * worktree that inherited a database and with it accounts nobody here knows
     * the password of.
     */
    public const MOMENTS = ['install', 'configure', 'setup', 'migrate', 'account', 'finish'];

    /**
     * What never travels into a worktree, whatever a project says: the repository's
     * bookkeeping, the management with its record of every job, and the other
     * worktrees -- which carried over would be every worktree inside this one.
     */
    private const NEVER = ['.git', '.ddev'];

    private const SETTINGS = ['profile', 'docroot', 'php', 'node', 'bin', 'password'];

    private const INHERIT_KEY = 'inherit';

    private const INHERIT_VALUE = 'profile';

    /**
     * The one entry in a moment that is not a line to run: where what this is
     * built on does its own work. A task and not a word, so no line a project
     * writes can be taken for it.
     */
    public const INHERITED = self::INHERIT_KEY . ': ' . self::INHERIT_VALUE;

    /** The review a checkout belongs to, the issue it closes, and the commit itself. */
    private const LINKS = ['review', 'issue', 'commit'];

    /** What each of those addresses has to say where the number goes. */
    private const PLACEHOLDERS = ['review' => '{change}', 'issue' => '{issue}', 'commit' => '{commit}'];

    /** Where a worktree's data may come from. */
    private const SOURCES = ['source', 'none'];

    private const NOTHING_SAID = [
        'links' => ['review' => null, 'issue' => null, 'commit' => null],
        'data' => ['from' => null, 'needs' => null, 'addresses' => null],
        'copy' => ['only' => null, 'except' => null],
    ];

    /**
     * The three mappings are held as they are written, key by key, because that is
     * how they are laid over one another: a project that only says where its issues
     * are tracked keeps the review address of what it is built on.
     *
     * @param ?list<array{name: string, path: string}>                             $entrypoints
     * @param array{review: ?string, issue: ?string, commit: ?string}              $links
     * @param array{from: ?string, needs: ?list<string>, addresses: ?list<string>} $data
     * @param array{only: ?list<string>, except: ?list<string>}                    $copy
     * @param array<string, list<?RecipeCommand>>                                  $moments
     */
    private function __construct(
        /**
         * The shipped configuration this one is built on, by name -- the shortcut
         * for "the TYPO3 one, with these two lines changed". The file it names is
         * written in the same grammar.
         */
        public ?string $profile,
        public ?string $docroot,
        public ?Version $php,
        /**
         * Nothing is served with it -- node is a build tool here -- so this is
         * what `npm` in a recipe line runs under, and no more.
         */
        public ?Version $node,
        /**
         * The pages worth opening, in the order they are offered -- an editing
         * interface, a component library, a profiler. A list because a project has
         * as many as it has, and an empty one says it has none although the
         * configuration it is built on has.
         */
        public ?array $entrypoints,
        /**
         * What opens a checkout on the machine reading the page, by name and by
         * the address that opens it -- "{path}" where the worktree's own goes.
         * Written, these stand instead of the ones Branchery knows; an empty list
         * says this project offers none at all.
         *
         * @var ?list<array{name: string, open: string}>
         */
        public ?array $editors,
        /** Where the project's own binaries are -- composer's bin-dir. */
        public ?string $bin,
        /**
         * What the account of a worktree is made with. A project whose application
         * refuses the shipped one -- a policy asking for more characters, or fewer
         * -- says its own here rather than writing the whole moment again.
         */
        public ?string $password,
        public array $links,
        public array $data,
        /**
         * "only" is what travels instead of everything git ignores; "except" is
         * what is taken out of whichever of the two travels.
         */
        public array $copy,
        private array $moments,
    ) {
    }

    /** A project that says nothing: a worktree is a checkout and no more. */
    public static function none(): self
    {
        return new self(
            profile: null,
            docroot: null,
            php: null,
            node: null,
            entrypoints: null,
            editors: null,
            bin: null,
            password: null,
            links: self::NOTHING_SAID['links'],
            data: self::NOTHING_SAID['data'],
            copy: self::NOTHING_SAID['copy'],
            moments: [],
        );
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

    /**
     * Every key this file knows. Said out loud rather than kept inside the reader,
     * because it is what a refusal names and what tests/Config/everything.yaml is
     * held to.
     *
     * @return list<string>
     */
    public static function keys(): array
    {
        return [...self::SETTINGS, 'entrypoints', 'editors', 'links', 'copy', 'data', ...self::MOMENTS];
    }

    /** @param array<mixed> $data */
    public static function fromArray(array $data): self
    {
        $known = self::keys();
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

        return new self(
            profile: self::readSetting($data, 'profile'),
            docroot: self::readDocroot($data),
            php: self::readVersion($data['php'] ?? null, 'php'),
            node: self::readVersion($data['node'] ?? null, 'node'),
            entrypoints: self::readEntrypoints($data['entrypoints'] ?? null),
            editors: self::readEditors($data['editors'] ?? null),
            bin: self::readSetting($data, 'bin'),
            password: self::readSetting($data, 'password'),
            links: self::readLinks($data['links'] ?? null),
            data: self::readData($data['data'] ?? null),
            copy: self::readCopy($data['copy'] ?? null),
            moments: $moments,
        );
    }

    /**
     * This file over the one it is built on. The whole of the arrangement, so
     * that a key added to the constructor is a key added here and nowhere else.
     *
     * A setting stands whole where it was said and is the base's where it was
     * not. A mapping is laid key by key, because its keys are said one at a time.
     * A moment is the base's work with what this file put around it, or this
     * file's alone where it wrote a list.
     */
    public function over(self $base): self
    {
        return new self(
            profile: $this->profile ?? $base->profile,
            docroot: $this->docroot ?? $base->docroot,
            php: $this->php ?? $base->php,
            node: $this->node ?? $base->node,
            entrypoints: $this->entrypoints ?? $base->entrypoints,
            editors: $this->editors ?? $base->editors,
            bin: $this->bin ?? $base->bin,
            password: $this->password ?? $base->password,
            links: [
                'review' => $this->links['review'] ?? $base->links['review'],
                'issue' => $this->links['issue'] ?? $base->links['issue'],
                'commit' => $this->links['commit'] ?? $base->links['commit'],
            ],
            data: [
                'from' => $this->data['from'] ?? $base->data['from'],
                'needs' => $this->data['needs'] ?? $base->data['needs'],
                'addresses' => $this->data['addresses'] ?? $base->data['addresses'],
            ],
            copy: [
                'only' => $this->copy['only'] ?? $base->copy['only'],
                'except' => $this->copy['except'] ?? $base->copy['except'],
            ],
            moments: $this->momentsOver($base),
        );
    }

    /** Nothing was said at all -- not a setting, not a mapping, not a moment. */
    public function isEmpty(): bool
    {
        return $this->said() === [];
    }

    /**
     * The lines of a moment as they will run. A recipe laid over another has no
     * gaps left in it; one standing on its own drops the slot where what it is
     * built on would have done its work, which is what a shipped file alone means.
     *
     * @return list<RecipeCommand>
     */
    public function lines(string $moment): array
    {
        return array_values(array_filter(
            $this->plan($moment),
            static fn (?RecipeCommand $command): bool => $command !== null,
        ));
    }

    /**
     * The order is the whole of what a recipe does, and it is worth being able to
     * read back without running anything: null is where the shipped configuration
     * does its own work, a command a line the project wrote.
     *
     * A moment nobody wrote about is that work alone.
     *
     * @return list<?RecipeCommand>
     */
    public function plan(string $moment): array
    {
        return $this->moments[$moment] ?? [null];
    }

    /**
     * Whether any moment leaves a place for the work of what this is built on. A
     * file that does and names no profile has written a line about nothing.
     */
    public function wantsTheProfile(): bool
    {
        foreach ($this->moments as $plan) {
            if (in_array(null, $plan, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Every key this file wrote, by name. The one rule read off in one place: a
     * mapping that said nothing under any of its keys said nothing.
     *
     * @return array<string, mixed>
     */
    private function said(): array
    {
        $said = [
            'profile' => $this->profile,
            'docroot' => $this->docroot,
            'php' => $this->php,
            'node' => $this->node,
            'entrypoints' => $this->entrypoints,
            'bin' => $this->bin,
            'links' => self::spoken($this->links),
            'data' => self::spoken($this->data),
            'copy' => self::spoken($this->copy),
            'moments' => $this->moments === [] ? null : $this->moments,
        ];

        return array_filter($said, static fn (mixed $value): bool => $value !== null);
    }

    /**
     * @param array<string, mixed> $mapping
     *
     * @return ?array<string, mixed>
     */
    private static function spoken(array $mapping): ?array
    {
        $said = array_filter($mapping, static fn (mixed $value): bool => $value !== null);

        return $said === [] ? null : $said;
    }

    /**
     * With the inherited slot filled in. A moment this file wrote about is kept
     * even where nothing is left to run: "finish: []" is how a project switches one
     * off, and dropping it would read as a project that never mentioned it.
     *
     * @return array<string, list<?RecipeCommand>>
     */
    private function momentsOver(self $base): array
    {
        $moments = [];
        foreach (self::MOMENTS as $moment) {
            $lines = [];
            foreach ($this->plan($moment) as $command) {
                if ($command !== null) {
                    $lines[] = $command;

                    continue;
                }
                $lines = [...$lines, ...$base->lines($moment)];
            }
            if ($lines !== [] || $this->speaksOf($moment) || $base->speaksOf($moment)) {
                $moments[$moment] = $lines;
            }
        }

        return $moments;
    }

    private function speaksOf(string $moment): bool
    {
        return array_key_exists($moment, $this->moments);
    }

    /**
     * The one written here, or the file in the checkout it stands in. The second
     * form is what a repository whose branches build against their own versions
     * needs -- the TYPO3 core says its PHP in the test runner and its Node in
     * `Build/.nvmrc`.
     *
     * "match" is only for a file that holds more than the version: a file made to
     * hold one, as `.nvmrc` is, is read without being told how.
     */
    private static function readVersion(mixed $value, string $key): ?Version
    {
        if ($value === null) {
            return null;
        }
        // A version written without quotes arrives as a number, and 8.30 is not
        // what anybody meant to write -- but 8.3 is, so it is taken.
        if (is_string($value) || is_int($value) || is_float($value)) {
            $version = trim((string) $value);
            if ($version === '') {
                throw new \RuntimeException(sprintf('%s: "%s" has to be a value, and not an empty one.', self::FILE, $key));
            }

            return Version::of($version);
        }
        if (!is_array($value) || array_is_list($value)) {
            throw new \RuntimeException(sprintf('%s: "%s" is a version, or "read" saying which file in the checkout holds it.', self::FILE, $key));
        }
        foreach (array_keys($value) as $under) {
            if (!in_array($under, ['read', 'match'], true)) {
                throw new \RuntimeException(sprintf('%s: "%s" under "%s" is not "read" or "match".', self::FILE, (string) $under, $key));
            }
        }
        if (!isset($value['read']) || !is_string($value['read']) || trim($value['read']) === '') {
            throw new \RuntimeException(sprintf('%s: "%s.read" has to be a value, and not an empty one.', self::FILE, $key));
        }
        if (!array_key_exists('match', $value)) {
            return Version::readFrom(trim($value['read']));
        }
        if (!is_string($value['match']) || trim($value['match']) === '') {
            throw new \RuntimeException(sprintf('%s: "%s.match" has to be a value, and not an empty one. Leave it out where the file holds the version and nothing else.', self::FILE, $key));
        }
        if (!Version::isReadable(trim($value['match']))) {
            // Said now: a pattern that cannot be read would otherwise be a version
            // nobody finds, in an operation that reports success.
            throw new \RuntimeException(sprintf('%s: "%s.match" is not a pattern this can read.', self::FILE, $key));
        }

        return Version::readFrom(trim($value['read']), trim($value['match']));
    }

    /**
     * A database on its own is not readable: a site points at its root page by uid,
     * and the application reading those uids has to be installed at all -- which is
     * a settings file, not a schema. Both are paths in the checkout, so the project
     * names them rather than Branchery knowing them.
     *
     * @return array{from: ?string, needs: ?list<string>, addresses: ?list<string>}
     */
    private static function readData(mixed $value): array
    {
        if ($value === null) {
            return self::NOTHING_SAID['data'];
        }
        if (!is_array($value) || array_is_list($value)) {
            throw new \RuntimeException(sprintf('%s: "data" has to be a mapping of from, needs and addresses.', self::FILE));
        }

        $from = null;
        $paths = ['needs' => null, 'addresses' => null];
        foreach ($value as $key => $said) {
            switch ($key) {
                case 'from':
                    if (!is_string($said) || !in_array($said, self::SOURCES, true)) {
                        throw new \RuntimeException(sprintf('%s: "data.from" is %s.', self::FILE, implode(' or ', self::SOURCES)));
                    }
                    $from = $said;
                    break;
                case 'needs':
                case 'addresses':
                    if (!is_array($said) || !array_is_list($said)) {
                        throw new \RuntimeException(sprintf('%s: "data.%s" has to be a list of paths.', self::FILE, (string) $key));
                    }
                    $paths[$key] = self::readPaths($said, 'data.' . (string) $key);
                    break;
                default:
                    throw new \RuntimeException(sprintf('%s: "%s" under "data" is not one of from, needs, addresses.', self::FILE, (string) $key));
            }
        }

        return ['from' => $from, 'needs' => $paths['needs'], 'addresses' => $paths['addresses']];
    }

    /**
     * The pages worth opening, each written as the word it is offered under and
     * the path it stands at -- the same one-key shape a recipe line is written in.
     * A path and not an address: the worktree's own is put in front of it, and a
     * whole one would be the same page for every branch.
     *
     * @return ?list<array{name: string, path: string}>
     */
    private static function readEntrypoints(mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }
        if (!is_array($value) || !array_is_list($value)) {
            throw new \RuntimeException(sprintf('%s: "entrypoints" has to be a list of what a worktree is opened at, each written as "Name: /path".', self::FILE));
        }

        $read = [];
        foreach ($value as $entry) {
            if (!is_array($entry) || count($entry) !== 1) {
                throw new \RuntimeException(sprintf('%s: every entry under "entrypoints" is one name and one path, written as "Name: /path".', self::FILE));
            }
            $name = trim((string) array_key_first($entry));
            $path = reset($entry);
            if ($name === '') {
                throw new \RuntimeException(sprintf('%s: an entry under "entrypoints" has no name to offer it under.', self::FILE));
            }
            if (!is_string($path) || trim($path) === '') {
                throw new \RuntimeException(sprintf('%s: "%s" under "entrypoints" needs a path to open.', self::FILE, $name));
            }
            $path = '/' . trim(trim($path), '/');
            $read[] = ['name' => $name, 'path' => $path === '/' ? '' : $path];
        }

        return $read;
    }

    /**
     * The same grammar as the entrypoints above, because it is the same kind of
     * thing: a name and somewhere it leads. The address is written whole, with
     * "{path}" where the worktree's own directory goes -- see App\Worktree\Editors
     * for what else may stand in one.
     *
     * A project that writes this at all has said which editors it offers, so
     * nothing is looked for in the checkout any more: saying so is the evidence.
     *
     * @return ?list<array{name: string, open: string}>
     */
    private static function readEditors(mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }
        if (!is_array($value) || !array_is_list($value)) {
            throw new \RuntimeException(sprintf('%s: "editors" has to be a list of what opens a worktree, each written as "Name: address".', self::FILE));
        }

        $read = [];
        foreach ($value as $entry) {
            if (!is_array($entry) || count($entry) !== 1) {
                throw new \RuntimeException(sprintf('%s: every entry under "editors" is one name and one address, written as "Name: address".', self::FILE));
            }
            $name = trim((string) array_key_first($entry));
            $open = reset($entry);
            if ($name === '') {
                throw new \RuntimeException(sprintf('%s: an entry under "editors" has no name to offer it under.', self::FILE));
            }
            if (!is_string($open) || trim($open) === '') {
                throw new \RuntimeException(sprintf('%s: "%s" under "editors" needs an address that opens it.', self::FILE, $name));
            }
            $read[] = ['name' => $name, 'open' => trim($open)];
        }

        return $read;
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
        $links = self::NOTHING_SAID['links'];
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
     * A fork copies over what git ignores, which is what makes it run without a
     * build -- and also how a cache built for other code gets copied into a
     * checkout it is wrong for. A list is what travels; a mapping amends what
     * would have travelled, and an empty one takes back what the configuration
     * this is built on kept out.
     *
     * @return array{only: ?list<string>, except: ?list<string>}
     */
    private static function readCopy(mixed $value): array
    {
        if ($value === null) {
            return self::NOTHING_SAID['copy'];
        }
        if (is_array($value) && array_is_list($value)) {
            return ['only' => self::readPaths($value, 'copy'), 'except' => null];
        }
        if (!is_array($value)) {
            throw new \RuntimeException(sprintf('%s: "copy" has to be a list of what travels, or "except" with a list of what does not.', self::FILE));
        }

        foreach (array_keys($value) as $key) {
            if ($key !== 'except') {
                throw new \RuntimeException(sprintf('%s: "%s" under "copy" is not "except".', self::FILE, (string) $key));
            }
        }
        if (!is_array($value['except']) || !array_is_list($value['except'])) {
            throw new \RuntimeException(sprintf('%s: "copy.except" has to be a list of what does not travel.', self::FILE));
        }

        return ['only' => null, 'except' => self::readPaths($value['except'], 'copy.except')];
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

    /**
     * A moment is the lines it runs, in order, and one of them may be
     * "inherit: profile" -- the place where what this is built on does its own
     * work. Left out, this moment is what the project wrote and no more.
     *
     * @return list<?RecipeCommand>
     */
    private static function readMoment(string $moment, mixed $value): array
    {
        if (!is_array($value) || !array_is_list($value)) {
            throw new \RuntimeException(sprintf('%s: "%s" has to be a list of what it runs, in order, with "%s" where what this is built on does its own work.', self::FILE, $moment, self::INHERITED));
        }

        return self::readCommands($moment, $value);
    }

    /**
     * A line is either what to run, or a task written the way DDEV writes a hook
     * task -- "exec:" and "composer:" -- so a developer who has written hooks in
     * .ddev/config.yaml is writing the same thing here. Such a task may add
     * "optional: true". "inherit: profile" is no line at all.
     *
     * @param list<mixed> $commands
     *
     * @return list<?RecipeCommand>
     */
    private static function readCommands(string $moment, array $commands): array
    {
        $read = [];

        foreach ($commands as $entry) {
            if (is_string($entry)) {
                if (trim($entry) === '') {
                    throw new \RuntimeException(sprintf('%s: "%s" holds a command with nothing in it.', self::FILE, $moment));
                }
                $read[] = new RecipeCommand('exec', trim($entry));
                continue;
            }

            if (!is_array($entry) || $entry === []) {
                throw new \RuntimeException(sprintf('%s: every entry under "%s" is a line to run, "%s", or one of %s.', self::FILE, $moment, self::INHERITED, implode(', ', array_map(static fn (string $kind): string => $kind . ':', RecipeCommand::KINDS))));
            }

            if (array_key_exists(self::INHERIT_KEY, $entry)) {
                if (count($entry) !== 1 || $entry[self::INHERIT_KEY] !== self::INHERIT_VALUE) {
                    throw new \RuntimeException(sprintf('%s: what a moment inherits is the profile, written "%s".', self::FILE, self::INHERITED));
                }
                $read[] = null;
                continue;
            }

            $optional = self::readOptional($moment, $entry);
            // Whatever is left once "optional" is taken out is the task itself, and
            // there is exactly one: two kinds under one entry is a line whose order
            // nobody can read off the file.
            unset($entry['optional']);
            if (count($entry) !== 1) {
                throw new \RuntimeException(sprintf('%s: every entry under "%s" is a line to run, "%s", or one of %s.', self::FILE, $moment, self::INHERITED, implode(', ', array_map(static fn (string $kind): string => $kind . ':', RecipeCommand::KINDS))));
            }

            $kind = (string) array_key_first($entry);
            $line = reset($entry);
            if (!in_array($kind, RecipeCommand::KINDS, true)) {
                // The likeliest cause is not a kind spelt wrong but a line holding
                // a colon, which YAML reads as a task before this ever sees it.
                throw new \RuntimeException(sprintf('%s: "%s" under "%s" is not one of %s. A line holding ": " is read as one of these -- put such a line in quotes.', self::FILE, $kind, $moment, implode(', ', RecipeCommand::KINDS)));
            }
            if (!is_string($line) || trim($line) === '') {
                throw new \RuntimeException(sprintf('%s: "%s:" under "%s" needs something to run.', self::FILE, $kind, $moment));
            }

            $read[] = new RecipeCommand($kind, trim($line), $optional);
        }

        // Twice, and the second is the same work a second time -- which nobody
        // means, and which an operation would do without a word.
        if (count(array_filter($read, static fn (?RecipeCommand $c): bool => $c === null)) > 1) {
            throw new \RuntimeException(sprintf('%s: "%s" says "%s" more than once, and what it is built on does its work once.', self::FILE, $moment, self::INHERITED));
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
    private static function readOptional(string $moment, array $entry): bool
    {
        if (!array_key_exists('optional', $entry)) {
            return false;
        }
        if (!is_bool($entry['optional'])) {
            throw new \RuntimeException(sprintf('%s: "optional" under "%s" is true or false.', self::FILE, $moment));
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
