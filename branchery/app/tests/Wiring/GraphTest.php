<?php

declare(strict_types=1);

namespace App\Tests\Wiring;

use App\Wiring\Container;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * That the graph this application actually runs on can be built.
 *
 * Everything else here wires its own -- see App\Tests\Fake\Wiring, which says of
 * itself that if the two ever disagree, it is wired wrongly. Nothing checked
 * that they agree, and nothing went through the real one at all: a container
 * that could not build a thing would have been found by whoever started the
 * application, which is a developer and not a run of this suite.
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
            'docs', 'database', 'databaseOperations', 'worktrees', 'usage', 'installation', 'ports',
            'exposure', 'locks', 'surroundings', 'describe', 'recipes', 'jobs', 'contexts', 'carried',
            'preflight', 'provisioning', 'removal', 'branchMoves', 'dataTransfer', 'manager', 'state',
            'starting', 'commitPages', 'api', 'router', 'snapshot',
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
}
