<?php

declare(strict_types=1);

namespace App\Http;

/** What a route hands back: a status, the headers it needs, and a body. */
final readonly class Response
{
    /** @param array<string, string> $headers */
    public function __construct(
        public int $status,
        public string $body,
        public array $headers = [],
    ) {
    }

    /** @param array<string, string> $headers */
    public static function json(mixed $data, int $status = 200, array $headers = []): self
    {
        return new self(
            $status,
            // A log or a commit subject is whatever a tool or a developer wrote, and
            // one byte of it that is not UTF-8 would turn the whole answer into a 500.
            json_encode($data, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR),
            ['Content-Type' => 'application/json'] + $headers,
        );
    }

    public static function html(string $markup, int $status = 200): self
    {
        return new self($status, $markup, ['Content-Type' => 'text/html; charset=utf-8']);
    }

    public function send(): void
    {
        foreach ($this->headers as $name => $value) {
            header($name . ': ' . $value);
        }

        // The status comes after the headers, and that order is the point: PHP
        // turns a "Location" header into a 302 by itself unless a 201 or a 3xx is
        // already set, so a 202 pointing at the operation would reach the
        // interface as a redirect and fetch() would follow it.
        http_response_code($this->status);
        echo $this->body;
    }
}
