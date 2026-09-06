<?php

declare(strict_types=1);

namespace App;

final readonly class CommandResult
{
    public function __construct(
        public int $exitCode,
        public string $output,
        public string $errorOutput = '',
    ) {
    }

    public function isSuccessful(): bool
    {
        return $this->exitCode === 0;
    }

    /**
     * The output as lines, without blank lines.
     *
     * @return list<string>
     */
    public function lines(): array
    {
        return array_values(array_filter(
            array_map('trim', explode("\n", $this->output)),
            static fn (string $line): bool => $line !== '',
        ));
    }

    public function message(): string
    {
        return $this->errorOutput !== '' ? $this->errorOutput : $this->output;
    }
}
