<?php

declare(strict_types=1);

namespace App\Config;

/**
 * A version a project asks for: the one written down, or where in the checkout
 * it stands.
 *
 * One thing and not two, although the file offers a choice, because a recipe
 * laid over another has to carry the answer whole. Kept apart, a project writing
 * `php: "8.3"` over a profile that points at a file keeps the pointer as well,
 * and the interface goes on naming a file nothing is read from.
 */
final readonly class Version
{
    /**
     * A file holding nothing but the version, as `.nvmrc` and `.node-version`
     * do: the first line that is neither blank nor a remark, without the "v"
     * such a file may or may not carry.
     */
    private const WRITTEN_PLAIN = '/^\s*(?:#[^\n]*\n)*\s*v?([^\s#]+)/';

    private function __construct(
        public ?string $number,
        /** The file it stands in. */
        public ?string $read,
        /**
         * How to find it in there. Null where the file holds the version and
         * nothing else, which is what every file made for the purpose does.
         */
        public ?string $match,
    ) {
    }

    public static function of(string $number): self
    {
        return new self($number, null, null);
    }

    public static function readFrom(string $read, ?string $match = null): self
    {
        return new self(null, $read, $match);
    }

    /** Whether a pattern is one this can read at all. */
    public static function isReadable(string $match): bool
    {
        return @preg_match(self::patternOf($match), '') !== false;
    }

    /**
     * What the file says, or null where it says nothing this can read. The
     * pattern where the project wrote one; the plain form otherwise, which is
     * what a file made to hold a version holds.
     *
     * A word rather than a number is left as it stands -- "lts/iron" is what
     * `n` is handed and what it understands.
     */
    public function in(string $contents): ?string
    {
        $pattern = $this->match === null ? self::WRITTEN_PLAIN : self::patternOf($this->match);

        return preg_match($pattern, $contents, $hit) === 1 ? ($hit[1] ?? $hit[0]) : null;
    }

    /** The pattern as written, made into one preg reads -- slashes and all. */
    private static function patternOf(string $match): string
    {
        return '/' . str_replace('/', '\\/', $match) . '/';
    }
}
