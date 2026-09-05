<?php

declare(strict_types=1);

namespace App\Tests\Web;

use App\Project;
use App\Tests\Fake\Ports;
use App\Web\DockerPorts;
use App\Web\Exposure;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * That the one premise this application's safety rests on is read correctly.
 *
 * "DDEV puts it on a port of the developer's own machine" is the whole of the
 * argument for an API that asks nobody who they are. Getting this wrong in the
 * quiet direction -- saying nothing about a port that is on the office network
 * -- is the failure that matters, so both ways it happens are walked: the
 * router bound to everything, and a project without a router publishing for
 * itself.
 */
#[CoversClass(Exposure::class)]
#[CoversClass(DockerPorts::class)]
final class ExposureTest extends TestCase
{
    private const string CONTAINER = 'ddev-blog-branchery';
    private const string ROUTER = 'ddev-router';

    /**
     * @param array<string, list<string>> $published
     */
    #[DataProvider('bindings')]
    public function testWhatPutsThisOnTheNetworkIsNamed(array $published, ?string $expected): void
    {
        $exposure = new Exposure(self::project(), new Ports($published));

        self::assertSame($expected, $exposure->beyondThisMachine());
    }

    /** @return iterable<string, array{array<string, list<string>>, ?string}> */
    public static function bindings(): iterable
    {
        // The ordinary shape: nothing published here, the router on loopback.
        yield 'behind the router, on this machine' => [[self::ROUTER => ['127.0.0.1']], null];
        yield 'nothing published at all' => [[], null];
        yield 'the router bound to everything' => [[self::ROUTER => ['0.0.0.0']], 'router'];
        yield 'the router on IPv6 everywhere' => [[self::ROUTER => ['::']], 'router'];
        // A project that omits the router maps the port straight out of here,
        // and a compose file's "8041:80" binds to every address there is.
        yield 'no router, published from here' => [[self::CONTAINER => ['0.0.0.0']], 'container'];
        // Both at once is still the nearer of the two: it is what is undone first.
        yield 'both' => [[self::CONTAINER => ['0.0.0.0'], self::ROUTER => ['0.0.0.0']], 'container'];
        // Several bindings on one container, one of them everywhere.
        yield 'one of several' => [[self::ROUTER => ['127.0.0.1', '0.0.0.0']], 'router'];
        // A machine with two addresses of its own is still that machine.
        yield 'a named address is one address' => [[self::ROUTER => ['192.168.1.10']], 'router'];
    }

    /**
     * What docker actually answers, read the way this reads it. The shape is
     * nested twice and carries a null for a port nothing is bound to, which is
     * the entry that looks like a binding and is not.
     */
    public function testTheAddressesAreReadOutOfWhatDockerAnswers(): void
    {
        $said = '{"80/tcp":[{"HostIp":"127.0.0.1","HostPort":"8041"},{"HostIp":"::1","HostPort":"8041"}],"443/tcp":null}';

        self::assertSame(['127.0.0.1', '::1'], DockerPorts::addressesIn($said));
    }

    /** A container that publishes nothing, and one docker knows nothing about. */
    public function testNothingPublishedIsNoAddresses(): void
    {
        self::assertSame([], DockerPorts::addressesIn('{}'));
        self::assertSame([], DockerPorts::addressesIn('null'));
        self::assertSame([], DockerPorts::addressesIn(''));
    }

    private static function project(): Project
    {
        return new Project(
            projectRoot: '/var/www/html',
            hostProjectRoot: '/home/dev/blog',
            projectName: 'blog',
            worktrees: '.worktrees',
            domain: 'ddev.site',
        );
    }
}
