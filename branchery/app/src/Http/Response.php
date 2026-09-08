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

    /** An answer that was written a moment ago, handed out again -- see Snapshot. */
    public static function kept(string $body): self
    {
        return new self(200, $body, ['Content-Type' => 'application/json']);
    }

    /**
     * A file handed over as itself -- an image beside the change in it. What git
     * holds at an object cannot change and is kept for good; the file in a
     * checkout is whatever it is this second.
     */
    public static function file(string $bytes, string $mediaType, bool $unchanging): self
    {
        return new self(200, $bytes, [
            'Content-Type' => $mediaType,
            'Cache-Control' => $unchanging ? 'private, max-age=31536000, immutable' : 'no-store',
            // The bytes are whatever a repository holds, and the type is read off
            // the name of the file: the browser is told not to decide otherwise.
            'X-Content-Type-Options' => 'nosniff',
        ]);
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
