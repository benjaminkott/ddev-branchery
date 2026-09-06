<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Whether a request came from somewhere else's page.
 *
 * This API asks nobody who they are, and that is safe for one reason: DDEV puts
 * it on a port of the developer's own machine, next to a shell that could do
 * all of it anyway. The reason holds for where the port is; it does not hold
 * for who may address it. Any page open in the same browser can send a request
 * to a port on localhost -- and a project that turned DDEV's own
 * "bind_all_interfaces" on is reachable from everything on the network beside
 * it.
 *
 * So a request the browser marks as coming from another site is refused. That
 * is the whole of it: it is a bolt on the door and not a lock, and the network
 * boundary is still what keeps this safe -- see the manual.
 *
 * Nothing here refuses a request that carries no mark at all. curl carries
 * none, the console carries none, and neither is what this guards against.
 */
final readonly class Origin
{
    /**
     * @param array<string, mixed> $server what the server said about the request
     */
    public static function isForeign(array $server): bool
    {
        // What the browser itself says the request is, which it sends on every
        // one and which a page cannot write for itself. "none" is the address bar.
        $site = self::header($server, 'HTTP_SEC_FETCH_SITE');
        if ($site !== '' && $site !== 'same-origin' && $site !== 'none') {
            return true;
        }

        // And the older mark, for a browser that sends no Sec-Fetch-Site. Absent
        // on a same-origin GET, which is why its absence says nothing.
        $origin = self::header($server, 'HTTP_ORIGIN');
        if ($origin === '') {
            return false;
        }

        $host = self::header($server, 'HTTP_HOST');

        return $host === '' || parse_url($origin, PHP_URL_HOST) . self::port($origin) !== $host;
    }

    /** The port as a host header carries it: written out, or not there at all. */
    private static function port(string $origin): string
    {
        $port = parse_url($origin, PHP_URL_PORT);
        if ($port === null || $port === false) {
            return '';
        }
        $scheme = parse_url($origin, PHP_URL_SCHEME);

        return ($scheme === 'https' && $port === 443) || ($scheme === 'http' && $port === 80)
            ? ''
            : ':' . $port;
    }

    /** @param array<string, mixed> $server */
    private static function header(array $server, string $name): string
    {
        $value = $server[$name] ?? '';

        return is_string($value) ? strtolower(trim($value)) : '';
    }
}
