<?php

declare(strict_types=1);

namespace App\Model;

/**
 * A branch that has no worktree. What it offers a reader who is choosing one is
 * its name, when it last moved, and what the commit on top of it is about --
 * "review/95618" says nothing on its own.
 */
final readonly class Branch implements \JsonSerializable
{
    public function __construct(
        public string $name,
        /** Seconds since the epoch. */
        public int $when,
        /**
         * @var ?array{sha: string, subject: string}
         */
        public ?array $tip = null,
        /**
         * A branch the remote does not have is here and nowhere else, and
         * everything on it would be lost with this repository.
         */
        public bool $onRemote = true,
    ) {
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            'name' => $this->name,
            'when' => $this->when,
            'tip' => $this->tip,
            'onRemote' => $this->onRemote,
        ];
    }
}
