<?php

declare(strict_types=1);

namespace App\Service;

/**
 * Whether the one thing this application's safety rests on is still true.
 *
 * The API asks nobody who they are, and that is right for exactly one reason:
 * DDEV puts it on a port of the developer's own machine, behind the router of
 * one project, next to a shell that could do all of it anyway. The reason is
 * about where the port is, and nothing here decides that -- a project that
 * turned DDEV's "bind_all_interfaces" on, or one without the router whose ports
 * are published straight out of the container, is reachable from everything on
 * the network beside it.
 *
 * So the premise is asked rather than assumed, and said where it does not hold.
 * That is the whole of it: this adds no lock and takes none away. What it takes
 * away is the silence -- a developer whose interface is on the office network
 * had no way of finding out from the interface itself.
 */
final readonly class Exposure
{
    /**
     * The addresses that are this machine and nothing else. Read as "everything
     * but these" rather than as a list of the ways it goes wrong: "0.0.0.0" is
     * the one DDEV produces, but a port bound to the machine's own address on the
     * office network is on the office network all the same -- and a rule that
     * lists the bad cases is a rule that goes quiet on the one it has not met.
     */
    private const string LOOPBACK = '/^(?:127\.\d+\.\d+\.\d+|::1|\[::1\]|localhost)$/';

    public function __construct(
        private Project $project,
        private PublishedPorts $ports,
    ) {
    }

    /**
     * Null while the premise holds. Otherwise which container puts it on the
     * network, because the two ways it happens are undone in different places:
     * the router is DDEV's own setting, and the container publishing for itself
     * is what a project without the router gets.
     */
    public function beyondThisMachine(): ?string
    {
        // Its own first: without the router the ports are mapped straight out of
        // here, and a compose file's "8041:80" binds to every address there is.
        if (self::beyondLoopback($this->ports->of($this->container()))) {
            return 'container';
        }

        // And through the router, which is where "bind_all_interfaces" lands.
        return self::beyondLoopback($this->ports->of(self::ROUTER)) ? 'router' : null;
    }

    /** DDEV names it the same in every project; there is one of it per machine. */
    private const string ROUTER = 'ddev-router';

    private function container(): string
    {
        return sprintf('ddev-%s-branchery', $this->project->name());
    }

    /**
     * @param list<string> $addresses
     */
    private static function beyondLoopback(array $addresses): bool
    {
        foreach ($addresses as $address) {
            if (preg_match(self::LOOPBACK, $address) !== 1) {
                return true;
            }
        }

        return false;
    }
}
