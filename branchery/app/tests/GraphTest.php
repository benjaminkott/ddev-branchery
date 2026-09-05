<?php

declare(strict_types=1);

namespace App\Tests;

use App\Container;
use App\Project;
use App\Tests\Fake\Ports;
use App\Tests\Fake\RecordingContainer;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * That the graph this application actually runs on can be built.
 *
 * It is the only graph there is: App\Tests\Fake\Wiring asks for this one around
 * a project of its own, so what an operation is walked through here is what a
 * developer gets. Before that it was a second wiring standing beside this file,
 * and a container that could not build a thing would have been found by whoever
 * started the application rather than by a run of this suite.
 *
 * Building is free of side effects -- every constructor here stores what it was
 * given -- so the whole graph can be asked for without a project, a container or
 * a docker socket anywhere near it.
 */
#[CoversClass(Container::class)]
final class GraphTest extends TestCase
{
    /**
     * Every door of the container, named rather than discovered: a method that
     * stops being reachable should fail here rather than quietly stop being asked.
     *
     * @return list<array{string}>
     */
    public static function services(): array
    {
        $names = [
            'project', 'web', 'files', 'gitRunner', 'gitFacts', 'git', 'ssh', 'runtimes', 'php', 'node',
            'docs', 'databaseServer', 'databases', 'worktrees', 'usage', 'installation', 'ports',
            'exposure', 'locks', 'surroundings', 'describe', 'recipes', 'jobs', 'places', 'carried',
            'checks', 'provisioning', 'removal', 'branchMoves', 'dataTransfer', 'manager', 'state',
            'operations', 'commitPages', 'api', 'router', 'snapshot',
        ];

        return array_map(static fn (string $name): array => [$name], $names);
    }

    #[DataProvider('services')]
    public function testEveryThingTheApplicationIsMadeOfCanBeBuilt(string $service): void
    {
        self::assertIsObject(Container::fromEnvironment()->{$service}());
    }

    /** And the console, which is a list of them rather than one. */
    public function testEveryCommandCanBeBuilt(): void
    {
        self::assertNotSame([], Container::fromEnvironment()->commands());
    }

    /**
     * One of each for the whole graph, which is not a saving: a second Runner
     * tells none of the first one's listeners that a command wrote, and a second
     * Locks blocks against the first from inside the very process that holds it.
     *
     * @return list<array{string}>
     */
    public static function sharedServices(): array
    {
        return array_map(
            static fn (string $name): array => [$name],
            ['project', 'web', 'files', 'gitRunner', 'git', 'locks', 'jobs', 'recipes', 'worktrees', 'manager'],
        );
    }

    #[DataProvider('sharedServices')]
    public function testWhatMustBeOneIsOne(string $service): void
    {
        $container = Container::fromEnvironment();

        self::assertSame(
            $container->{$service}(),
            $container->{$service}(),
            sprintf('%s() answers with a new one every time it is asked', $service),
        );
    }

    /**
     * The three a test hands in are the three it gets back.
     *
     * Asked here because of what a wrong answer does rather than because it is
     * likely: every test in this suite runs on this graph, and a container that
     * quietly handed back its own would put the whole suite on the docker socket
     * of whoever ran it -- running the tools against real projects, in a test
     * that says it is talking to nothing.
     */
    public function testTheGraphAroundSomethingIsBuiltAroundIt(): void
    {
        $project = new Project(
            projectRoot: '/tmp/nowhere',
            hostProjectRoot: '/tmp/nowhere',
            projectName: 'blog',
            worktrees: '.worktrees',
        );
        $web = new RecordingContainer();
        $ports = new Ports();

        $container = Container::around($project, $web, $ports);

        self::assertSame($project, $container->project());
        self::assertSame($web, $container->web());
        self::assertSame($ports, $container->ports());
    }
}
