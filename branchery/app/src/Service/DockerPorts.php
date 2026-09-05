<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\Process\Process;

/**
 * What the Docker daemon says a container publishes, asked through the socket
 * this container already has.
 *
 * A container that is not there answers with nothing rather than an error: the
 * router is absent in a project that omits it, and that is a shape of project
 * and not a fault.
 */
final class DockerPorts implements PublishedPorts
{
    /** @var array<string, list<string>> asked once per container: a binding is fixed for its life */
    private array $asked = [];

    /**
     * @return list<string>
     */
    public function of(string $container): array
    {
        if (isset($this->asked[$container])) {
            return $this->asked[$container];
        }

        $process = new Process(['docker', 'inspect', '--format', '{{json .NetworkSettings.Ports}}', $container]);
        $process->setTimeout(10);
        $process->run();
        if (!$process->isSuccessful()) {
            return $this->asked[$container] = [];
        }

        return $this->asked[$container] = self::addressesIn(trim($process->getOutput()));
    }

    /**
     * The shape docker answers with: every port of the container, each with the
     * host bindings it has -- or null where it has none.
     *
     * @return list<string>
     */
    public static function addressesIn(string $json): array
    {
        $ports = json_decode($json, true);
        if (!\is_array($ports)) {
            return [];
        }

        $addresses = [];
        foreach ($ports as $bindings) {
            if (!\is_array($bindings)) {
                continue;
            }
            foreach ($bindings as $binding) {
                $address = \is_array($binding) ? $binding['HostIp'] ?? null : null;
                if (\is_string($address)) {
                    // An empty one is how docker says "every interface"; left out,
                    // the very case this is here to find would read as no binding.
                    $addresses[$address === '' ? '0.0.0.0' : $address] = true;
                }
            }
        }

        return array_keys($addresses);
    }
}
