<?php

declare(strict_types=1);

namespace App\Tests\Http;

use App\Http\Parameters;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * What a request is allowed to have brought along.
 *
 * These are the rules that stand between whatever a caller wrote and the tools:
 * a branch name reaches git, a worktree name becomes a directory, a hostname
 * and a database name, and a page offset is handed to the log. Every one of
 * them used to be written out at the door that needed it, which is one place
 * each to be forgotten -- and the reading that forgot `is_scalar` looked a
 * worktree called "Array" up on disk.
 */
#[CoversClass(Parameters::class)]
final class ParametersTest extends TestCase
{
    public function testTextIsWhatWasWrittenAndNothingElse(): void
    {
        $asked = Parameters::of(['name' => '  demo  ', 'count' => 12, 'nothing' => null]);

        self::assertSame('demo', $asked->text('name'), 'the space around a pasted value is the paste, not the value');
        self::assertSame('12', $asked->text('count'));
        self::assertSame('', $asked->text('nothing'));
        self::assertSame('', $asked->text('never mentioned'));
    }

    /**
     * A list where a name was expected is a malformed request, not a worktree
     * called "Array" -- which is a name this would otherwise go and look up.
     */
    public function testSomethingThatIsNotAWordIsNoWord(): void
    {
        self::assertSame('', Parameters::of(['name' => ['a', 'b']])->text('name'));
        self::assertSame('', Parameters::of(['name' => ['deep' => ['er']]])->text('name'));
    }

    /**
     * Said and meant. The interface sends a boolean; anything else is a caller
     * whose intent cannot be read, and dropping a database is not a thing to do
     * on a guess.
     */
    public function testOnlyTrueAsksForSomething(): void
    {
        self::assertTrue(Parameters::of(['fresh' => true])->flag('fresh'));
        self::assertFalse(Parameters::of(['fresh' => 'true'])->flag('fresh'));
        self::assertFalse(Parameters::of(['fresh' => 1])->flag('fresh'));
        self::assertFalse(Parameters::of([])->flag('fresh'));
    }

    public function testWhatWasMentionedAtAllIsToldFromWhatWasNot(): void
    {
        self::assertTrue(Parameters::of(['php' => '8.4'])->has('php'));
        // Said as nothing is not said: the door reads this as "change nothing".
        self::assertFalse(Parameters::of(['php' => null])->has('php'));
        self::assertFalse(Parameters::of([])->has('php'));
    }

    /**
     * Never backwards: a negative offset is a caller reading a number out of
     * their own arithmetic, and git takes a leading dash for an option.
     */
    public function testAnOffsetCountsForwardOrNotAtAll(): void
    {
        self::assertSame(10, Parameters::of(['skip' => '10'])->number('skip'));
        self::assertSame(0, Parameters::of(['skip' => '-40'])->number('skip'));
        self::assertSame(0, Parameters::of(['skip' => 'a page please'])->number('skip'));
        self::assertSame(0, Parameters::of([])->number('skip'));
    }

    /**
     * @return list<array{string}>
     */
    public static function branchNames(): array
    {
        return [['main'], ['feature/x'], ['bugfix/81291-one'], ['v13.4'], ['release_2'], ['a']];
    }

    #[DataProvider('branchNames')]
    public function testABranchNameIsTakenAsGitWouldTakeOne(string $name): void
    {
        self::assertSame($name, Parameters::of(['branch' => $name])->branch());
    }

    /**
     * The one that matters: git reads a leading dash as an option, and
     * "--upload-pack" is a command it would then run.
     *
     * @return list<array{string}>
     */
    public static function refusedBranchNames(): array
    {
        return [
            ['-- --upload-pack=touch'],
            ['--upload-pack=touch /tmp/pwned'],
            ['-x'],
            ['.hidden'],
            [''],
            ['   '],
            ['has space'],
            ['semi;colon'],
            ['back\\slash'],
            [str_repeat('a', 101)],
        ];
    }

    #[DataProvider('refusedBranchNames')]
    public function testAnythingElseIsNotABranchName(string $name): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid branch name.');

        Parameters::of(['branch' => $name])->branch();
    }

    /**
     * A hundred characters is where a branch name stops being one, and a name
     * that long is a caller building one rather than naming a branch.
     */
    public function testABranchNameStopsSomewhere(): void
    {
        self::assertSame(str_repeat('a', 100), Parameters::of(['branch' => str_repeat('a', 100)])->branch());
    }

    /** No name is a name the operation derives, which is not this one's to refuse. */
    public function testAWorktreeMayBeLeftUnnamed(): void
    {
        self::assertNull(Parameters::of([])->name());
        self::assertNull(Parameters::of(['name' => ''])->name());
        self::assertNull(Parameters::of(['name' => '   '])->name());
    }

    /**
     * @return list<array{string}>
     */
    public static function refusedWorktreeNames(): array
    {
        return [['Demo'], ['with_underscore'], ['with.dot'], ['with/slash'], ['-leading'], ['../up']];
    }

    #[DataProvider('refusedWorktreeNames')]
    public function testAWorktreeNameIsWhatADirectoryAndAHostnameBothTake(string $name): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('lowercase letters');

        Parameters::of(['name' => $name])->name();
    }

    public function testANameThatIsOneComesBackAsItStands(): void
    {
        self::assertSame('feature-x', Parameters::of(['name' => 'feature-x'])->name());
        self::assertSame('v13-4', Parameters::of(['name' => ' v13-4 '])->name());
    }
}
