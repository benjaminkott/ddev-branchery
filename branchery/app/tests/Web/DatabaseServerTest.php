<?php

declare(strict_types=1);

namespace App\Tests\Web;

use App\Tests\Fake\RecordingContainer;
use App\Web\DatabaseServer;
use PHPUnit\Framework\TestCase;

/**
 * The name of a worktree's database. It is read by people -- in phpMyAdmin, in
 * "ddev export-db" -- so it says which worktree it belongs to; and it is
 * written by TYPO3's install tool, which refuses more than fifty characters.
 */
final class DatabaseServerTest extends TestCase
{
    public function testTheNameSaysWhichWorktreeItBelongsTo(): void
    {
        self::assertSame('branchery_my_fix', $this->database()->nameFor('my-fix'));
    }

    public function testALongNameIsCutToWhatTheInstallToolTakes(): void
    {
        $name = $this->database()->nameFor('bugfix-add-fallback-to-typoscript-settings');

        self::assertLessThanOrEqual(50, strlen($name));
        self::assertStringStartsWith('branchery_bugfix_add_fallback_to_typoscript', $name);
    }

    public function testTwoLongNamesThatBeginAlikeStayApart(): void
    {
        $database = $this->database();

        self::assertNotSame(
            $database->nameFor('bugfix-the-same-beginning-of-a-really-long-branch-one'),
            $database->nameFor('bugfix-the-same-beginning-of-a-really-long-branch-two'),
        );
    }

    public function testTheSameWorktreeAlwaysGetsTheSameName(): void
    {
        $database = $this->database();
        $long = 'bugfix-add-fallback-to-typoscript-settings';

        self::assertSame($database->nameFor($long), $this->database()->nameFor($long));
    }

    public function testTheConnectionIsAlsoAUrlForWhoeverWantsOne(): void
    {
        // Without a server to ask, the kind is what a DDEV project has by default
        // -- which is what this test is about, not the detection.
        self::assertSame(
            'mysql://db:db@db:3306/branchery_my_fix',
            $this->database()->url('branchery_my_fix'),
        );
    }

    /** The name needs no server; nothing here reaches the web container. */
    private function database(): DatabaseServer
    {
        return new DatabaseServer(new RecordingContainer());
    }
}
