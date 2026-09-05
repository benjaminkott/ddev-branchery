<?php

declare(strict_types=1);

namespace App\Web;

/**
 * Which addresses a container's ports are published on.
 *
 * Stated as an interface for the reason WebContainer is: the answer comes from
 * the Docker daemon, and what is decided from it -- whether this interface is
 * reachable from the network beside the developer -- is a rule worth holding a
 * test to.
 */
interface PublishedPorts
{
    /**
     * The host addresses the container's published ports are bound to, without
     * repetition. Empty where the container publishes nothing at all, which is
     * the ordinary answer for one behind DDEV's router.
     *
     * @return list<string>
     */
    public function of(string $container): array;
}
