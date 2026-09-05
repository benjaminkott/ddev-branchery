<?php

declare(strict_types=1);

namespace App\Tests\Fake;

use App\Service\PublishedPorts;

/** Containers that publish what a test says they publish, and nothing else. */
final class Ports implements PublishedPorts
{
    /** @param array<string, list<string>> $published */
    public function __construct(private readonly array $published = [])
    {
    }

    /** @return list<string> */
    public function of(string $container): array
    {
        return $this->published[$container] ?? [];
    }
}
