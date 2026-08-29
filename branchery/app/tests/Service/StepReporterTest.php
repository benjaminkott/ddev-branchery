<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\StepReporter;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Formatter\OutputFormatter;

/** The markers an operation writes, as the interface reads them back. */
#[CoversClass(StepReporter::class)]
final class StepReporterTest extends TestCase
{
    /** @var list<string> */
    private array $lines = [];

    /** @var list<string> */
    private array $shown = [];

    private function reporter(): StepReporter
    {
        $this->lines = [];
        $this->shown = [];

        return new StepReporter(function (string $line, string $shown): void {
            $this->lines[] = $line;
            $this->shown[] = $shown;
        });
    }

    /**
     * Both forms, every time. Which of them a terminal shows is the writer's
     * decision; made here, a run from a terminal had no markers left for the page.
     */
    public function testEveryLineComesInBothForms(): void
    {
        $reporter = $this->reporter();
        $reporter->expect(1);
        $reporter->step('First');
        $reporter->note('A word');
        $reporter->finish();

        self::assertSame('##STEP 1/1 +0s First', $this->lines[0]);
        self::assertSame('<fg=cyan;options=bold>[1/1]</> <options=bold>First</>', $this->shown[0]);
        self::assertSame('→ A word', $this->lines[1]);
        self::assertSame('<fg=cyan>→</> A word', $this->shown[1]);
        self::assertSame('<fg=green;options=bold>✓ Done</>', $this->shown[2]);
    }

    public function testEveryStepSaysWhichOfHowMany(): void
    {
        $reporter = $this->reporter();
        $reporter->expect(2);
        $reporter->step('First');
        $reporter->step('Second');
        $reporter->finish();

        self::assertSame('##STEP 1/2 +0s First', $this->lines[0]);
        self::assertSame('##STEP 2/2 +0s Second', $this->lines[1]);
        self::assertSame('##STEP 2/2 +0s Done', $this->lines[2]);
    }

    /**
     * What an operation did it to, entry by entry, is for the reader who asked for
     * every line. Everybody else gets the note that sums it up.
     */
    public function testADetailIsOnlySaidToWhoeverAskedForIt(): void
    {
        $quiet = $this->reporter();
        $quiet->note('3 entries: vendor, .env, Build/… (1 entry)');
        $quiet->detail('vendor');

        self::assertSame(['→ 3 entries: vendor, .env, Build/… (1 entry)'], $this->lines);

        $this->lines = [];
        $verbose = new StepReporter(function (string $line): void {
            $this->lines[] = $line;
        }, true);
        $verbose->note('3 entries: vendor, .env, Build/… (1 entry)');
        $verbose->detail('vendor');

        self::assertSame(['→ 3 entries: vendor, .env, Build/… (1 entry)', '  vendor'], $this->lines);
    }

    /**
     * An operation that ends early has fewer steps than it announced, and its
     * closing marker closes the step it is on -- a marker for the third of three
     * would be read as a step of its own.
     */
    public function testEndingEarlyClosesTheStepItIsOn(): void
    {
        $reporter = $this->reporter();
        $reporter->expect(3);
        $reporter->step('Going back');
        $reporter->finish();

        self::assertSame('##STEP 1/1 +0s Done', $this->lines[1]);
    }

    /**
     * What the operation could not do, kept, and the ending drawn in the colour of
     * it: a green tick over a step it could not take is the ending nobody looks
     * behind, while the note saying so is fifty lines up.
     */
    public function testAnOperationThatCouldNotDoSomethingDoesNotCloseAsIfItHad(): void
    {
        $reporter = $this->reporter();
        $reporter->expect(1);
        $reporter->step('Choosing the versions');
        $reporter->warn('The checkout asks for PHP 7.2, which the web image has no pool for.');
        $reporter->finish();

        self::assertSame(['The checkout asks for PHP 7.2, which the web image has no pool for.'], $reporter->concerns());
        self::assertSame('⚠ The checkout asks for PHP 7.2, which the web image has no pool for.', $this->lines[1]);
        self::assertStringStartsWith('<fg=yellow;options=bold>⚠ Done', $this->shown[2]);
    }

    public function testAnOperationWithNothingToSayAgainstItselfClosesGreen(): void
    {
        $reporter = $this->reporter();
        $reporter->expect(1);
        $reporter->step('Choosing the versions');
        $reporter->finish();

        self::assertSame([], $reporter->concerns());
        self::assertSame('<fg=green;options=bold>✓ Done</>', $this->shown[1]);
    }

    /**
     * Said by the operation that knows there is something to come back to, read by
     * whoever ends up reporting the failure.
     */
    public function testWhatWouldTakeAStoppedOperationFurtherIsCarriedWithIt(): void
    {
        $reporter = $this->reporter();
        self::assertNull($reporter->resume());

        $reporter->resumeWith('ddev branchery worktree:provision 11-5');
        self::assertSame('ddev branchery worktree:provision 11-5', $reporter->resume());
    }

    /**
     * What a tool writes is read as words and not as markup, and comes back as the
     * words it was once the console has resolved the line.
     */
    public function testWhatTheToolsWriteIsNotMarkup(): void
    {
        $reporter = $this->reporter();
        $reporter->output('expected <5 seconds, got <info>7</info>');

        self::assertStringNotContainsString('<info>', $this->lines[0]);
        self::assertSame('expected <5 seconds, got <info>7</info>', (new OutputFormatter(false))->format($this->lines[0]));
    }
}
