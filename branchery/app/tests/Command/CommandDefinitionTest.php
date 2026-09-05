<?php

declare(strict_types=1);

namespace App\Tests\Command;

use App\Container;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Application;

/**
 * A command that defines one of the application's own global options again
 * cannot start at all: merging the two definitions throws, and only once the
 * command is actually invoked.
 */
final class CommandDefinitionTest extends TestCase
{
    public function testCommandDefinitionsDoNotCollideWithGlobalOptions(): void
    {
        // The container's own commands and not a filter over the application: a
        // filter written by name would quietly test nothing the day a namespace is
        // added. Added to an application, which is what gives them the global
        // options this is about.
        $commands = (new Container([]))->commands();
        self::assertNotEmpty($commands, 'No command is registered.');
        (new Application('Branchery'))->addCommands($commands);

        foreach ($commands as $command) {
            $name = (string) $command->getName();
            $own = array_keys($command->getDefinition()->getOptions());

            $command->mergeApplicationDefinition();

            self::assertSame(
                $own,
                array_values(array_intersect(array_keys($command->getDefinition()->getOptions()), $own)),
                sprintf('%s lost its own options while merging.', $name),
            );
        }
    }
}
