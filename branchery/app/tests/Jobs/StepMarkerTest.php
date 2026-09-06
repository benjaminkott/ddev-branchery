<?php

declare(strict_types=1);

namespace App\Tests\Jobs;

use App\Jobs\StepMarker;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * The format an operation writes its steps in, sent through both halves of
 * itself.
 *
 * It is a protocol between two processes, and the two halves used to stand in
 * two files with nothing between them: what the writer spelled and what the
 * reader matched were the same string twice, and neither was held to the other.
 */
#[CoversClass(StepMarker::class)]
final class StepMarkerTest extends TestCase
{
    /** The whole reason this is one class: what is written is what is read. */
    public function testWhatIsWrittenReadsBackAsWhatItWas(): void
    {
        $line = StepMarker::line(3, 7, 12, 'Installing dependencies');

        self::assertSame(
            ['no' => 3, 'total' => 7, 'seconds' => 12, 'label' => 'Installing dependencies'],
            StepMarker::read($line),
        );
    }

    /** A line one of the tools wrote is not one of these. */
    public function testAnythingElseIsNotAMarker(): void
    {
        self::assertNull(StepMarker::read('Installing dependencies'));
        self::assertNull(StepMarker::read('→ Branched from main at 9b31d02fa1c.'));
        self::assertNull(StepMarker::read('## STEP 1/2 +0s Nearly'));
    }

    /**
     * Every project has one operation from before the seconds were written down,
     * and its log is read by the version that came after.
     */
    public function testAMarkerFromBeforeTheSecondsWereCountedStillReads(): void
    {
        self::assertSame(
            ['no' => 1, 'total' => 2, 'seconds' => 0, 'label' => 'Reading what the branch needs'],
            StepMarker::read('##STEP 1/2 Reading what the branch needs'),
        );
    }

    /**
     * The step being worked on is the last marker in the file: what stands between
     * two of them is whatever the tools wrote.
     */
    public function testTheStepBeingWorkedOnIsTheLastMarkerInTheLog(): void
    {
        $log = "##STEP 1/2 +0s Reading\nread it\n##STEP 2/2 +2s Installing\ninstalling\n";

        self::assertSame(
            ['no' => 2, 'total' => 2, 'seconds' => 2, 'label' => 'Installing'],
            StepMarker::last($log),
        );
        self::assertNull(StepMarker::last("nothing of ours\nin here\n"));
    }

    /**
     * What a reader sees. The markers become the step they announce and every
     * other line is left exactly as the tool wrote it.
     */
    public function testTheMarkersBecomeWhatTheySay(): void
    {
        self::assertSame(
            "[1/2] Reading\nread it\n[2/2] Installing\n",
            StepMarker::readable("##STEP 1/2 +0s Reading\nread it\n##STEP 2/2 +2s Installing\n"),
        );
    }
}
