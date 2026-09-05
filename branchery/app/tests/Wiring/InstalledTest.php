<?php

declare(strict_types=1);

namespace App\Tests\Wiring;

use App\Wiring\Container;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * That the application can find what ships beside it.
 *
 * Four things stand next to the code and are reached by asking the code where
 * it is: the shipped configurations, the manual, the version the image was
 * built as, and the console every background operation starts. All four are
 * built from one answer, which is why one of them is enough to ask about -- a
 * root that is wrong is wrong for all of them.
 *
 * The configurations are the one to ask, because they are the only one of the
 * four that stands beside the application in a working copy as well. The manual
 * is put there by the image build, the version is written by it, and the console
 * is what a background operation starts rather than something this can look at.
 *
 * Nothing else here would say so. The paths are strings the analyser has no
 * opinion about, every other test wires its graph by hand rather than through
 * the container, and the mocked API is not this language -- so the first thing
 * to notice was a project whose worktrees would not build, because "profile:
 * typo3-app" named a file that could no longer be found and every operation
 * started a console that was not there.
 */
#[CoversClass(Container::class)]
final class InstalledTest extends TestCase
{
    private function container(): Container
    {
        return Container::fromEnvironment();
    }

    /**
     * The shipped configurations are what "profile:" reaches, and a project that
     * names one gets a refusal naming the list -- which read "There is ." for as
     * long as the directory was looked for in the wrong place.
     */
    public function testTheShippedConfigurationsAreThere(): void
    {
        $names = $this->container()->recipes()->names();

        self::assertNotSame([], $names, 'no shipped configuration was found beside the application');
        self::assertContains('typo3-app', $names);
    }
}
