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
    private function __construct(
        public ?string $number,
        /** The file it stands in, and the pattern that finds it there. */
        public ?string $read,
        public ?string $match,
    ) {
    }

    public static function of(string $number): self
    {
        return new self($number, null, null);
    }

    public static function readFrom(string $read, string $match): self
    {
        return new self(null, $read, $match);
    }

    /** @return ?array{read: string, match: string} */
    public function where(): ?array
    {
        return $this->read === null || $this->match === null
            ? null
            : ['read' => $this->read, 'match' => $this->match];
    }
}
