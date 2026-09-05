<?php

declare(strict_types=1);

namespace App\Tests\Config;

use App\Config\Recipe;
use App\Config\RecipeCommand;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * The recipe is a public contract: written by hand, in projects this add-on
 * never sees, and not correctable by an update. So what it does with a file
 * that is wrong matters as much as what it does with a right one.
 */
#[CoversClass(Recipe::class)]
final class RecipeTest extends TestCase
{
    /**
     * The order is what a recipe is for, so it is read back rather than trusted:
     * null is where what this is built on does its own work.
     */
    public function testTheOrderOfAMomentIsWhatItIsBuiltOnBetweenWhatWasAdded(): void
    {
        $recipe = Recipe::fromArray(['setup' => [
            'before' => ['./bin/pre.sh'],
            'after' => ['./bin/post.sh', 'npm run build'],
        ]]);

        self::assertSame(['./bin/pre.sh', null, './bin/post.sh', 'npm run build'], self::lines($recipe->plan('setup')));
    }

    public function testAReplacedMomentLeavesWhatItIsBuiltOnOut(): void
    {
        $recipe = Recipe::fromArray(['setup' => ['before' => ['a'], 'run' => ['b'], 'after' => ['c']]]);

        self::assertSame(['a', 'b', 'c'], self::lines($recipe->plan('setup')));
    }

    /** A moment nobody wrote about is whatever it is built on, alone. */
    public function testAMomentWithoutARecipeIsWhatItIsBuiltOnAlone(): void
    {
        self::assertSame([null], self::lines(Recipe::none()->plan('setup')));
    }

    /** "run" with nothing in it is a moment the project has switched off. */
    public function testAMomentSetToNothingDoesNothing(): void
    {
        self::assertSame([], Recipe::fromArray(['flush' => []])->plan('flush'));
    }

    public function testAProjectThatSaysNothingChangesNothing(): void
    {
        self::assertTrue(Recipe::none()->isEmpty());
        self::assertTrue(Recipe::fromArray([])->isEmpty());
    }

    public function testTheShortFormOfAMomentReplacesWhatItIsBuiltOnDoes(): void
    {
        $recipe = Recipe::fromArray(['install' => ['composer install', 'npm ci']]);

        self::assertTrue($recipe->replaces('install'));
        self::assertSame(['composer install', 'npm ci'], self::lines($recipe->commands('install', 'run')));
    }

    public function testWhatIsAddedLeavesWhatItIsBuiltOnDoingItsOwnWork(): void
    {
        $recipe = Recipe::fromArray(['install' => ['after' => ['npm run build']]]);

        self::assertFalse($recipe->replaces('install'));
        self::assertSame(['npm run build'], self::lines($recipe->commands('install', 'after')));
        self::assertSame([], $recipe->commands('install', 'before'));
    }

    public function testAMomentNobodyWroteAboutSaysNothing(): void
    {
        $recipe = Recipe::fromArray(['install' => ['composer install']]);

        self::assertFalse($recipe->replaces('setup'));
        self::assertSame([], $recipe->commands('setup', 'after'));
    }

    /** A version written without quotes is a number in YAML, and 8.3 is meant. */
    public function testAVersionThatArrivesAsANumberIsStillAVersion(): void
    {
        self::assertSame('8.3', Recipe::fromArray(['php' => 8.3])->php);
        self::assertSame('8', Recipe::fromArray(['php' => 8])->php);
    }

    /**
     * In both spellings, and the same grammar as the PHP one: a project should not
     * have to learn a second way of saying the same thing.
     */
    public function testTheNodeVersionIsAVersionOrWhereItStands(): void
    {
        self::assertSame('22', Recipe::fromArray(['node' => 22])->node);
        self::assertSame('20.11.1', Recipe::fromArray(['node' => '20.11.1'])->node);

        $pointed = Recipe::fromArray(['node' => ['read' => 'Build/.nvmrc', 'match' => 'v?(\d+)']]);

        self::assertNull($pointed->node);
        self::assertSame(['read' => 'Build/.nvmrc', 'match' => 'v?(\d+)'], $pointed->nodeRead);
        self::assertFalse($pointed->isEmpty());
    }

    /** What is refused about the PHP version is refused about this one. */
    public function testANodeVersionWithoutAValueIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"node\.match"/');

        Recipe::fromArray(['node' => ['read' => 'Build/.nvmrc', 'match' => '  ']]);
    }

    public function testASettingIsTakenAsWritten(): void
    {
        $recipe = Recipe::fromArray(['profile' => 'typo3-app', 'docroot' => 'web', 'backend' => '/typo3']);

        self::assertSame('typo3-app', $recipe->profile);
        self::assertSame('web', $recipe->docroot);
        self::assertSame('/typo3', $recipe->backend);
        self::assertFalse($recipe->isEmpty());
    }

    /**
     * The failure this guards against is the quiet one: a key spelled wrong does
     * nothing, the operation reports success, and the worktree is missing exactly
     * the step the file was written for.
     */
    /**
     * A path leads out of the checkout wherever the ".." stands in it, and what is
     * copied and removed by these paths must never be anything but the worktree's.
     */
    public function testAPathThatLeadsOutOfTheCheckoutAnywhereIsRefused(): void
    {
        foreach (['../config', '..', 'config/../../x', 'config/sites/..'] as $path) {
            try {
                Recipe::fromArray(['carry' => ['except' => [$path]]]);
                self::fail(sprintf('"%s" was taken for a path inside the checkout.', $path));
            } catch (\RuntimeException $refusal) {
                self::assertStringContainsString('leads out of it', $refusal->getMessage(), $path);
            }
        }

        self::assertSame(['config/sites'], Recipe::fromArray(['carry' => ['except' => ['config/sites/']]])->carryExcept);
    }

    /**
     * The core's test runner is the case this exists for; what the pattern does not
     * find is null and not the whole line.
     */
    public function testTheVersionIsReadOutOfTheFileByThePattern(): void
    {
        $runner = "#!/usr/bin/env bash\nPHP_VERSION=\"8.4\"\nCONTAINER=podman\n";

        self::assertSame('8.4', Recipe::versionIn($runner, 'PHP_VERSION="(\d+\.\d+)"'));
        self::assertSame('8.4', Recipe::versionIn($runner, '\d+\.\d+'));
        self::assertNull(Recipe::versionIn($runner, 'PHP_MINOR="(\d+)"'));
        self::assertSame('7.4', Recipe::versionIn('php: 7.4/fpm', 'php: (\d+\.\d+)/fpm'));
    }

    public function testAKeyItDoesNotKnowIsRefusedAndSaysWhatItKnows(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"instal".*install/s');

        Recipe::fromArray(['instal' => ['composer install']]);
    }

    public function testAMomentThatIsNotCommandsIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/before\/run\/after/');

        Recipe::fromArray(['install' => 'composer install']);
    }

    public function testAMomentWithAWordItDoesNotKnowIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"durin".*before, run, after/');

        Recipe::fromArray(['install' => ['durin' => ['composer install']]]);
    }

    public function testACommandThatIsNeitherALineNorATaskIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/install\.after.*exec:.*composer:/s');

        Recipe::fromArray(['install' => ['after' => [['composer', 'install']]]]);
    }

    /**
     * The vocabulary is DDEV's, so a developer who has written hooks in
     * .ddev/config.yaml is writing the same thing here.
     */
    public function testATaskIsWrittenTheWayDdevWritesAHookTask(): void
    {
        $recipe = Recipe::fromArray(['install' => [
            ['composer' => 'install --no-dev'],
            ['exec' => 'npm ci'],
            'npm run build',
        ]]);

        $plan = $recipe->plan('install');
        self::assertSame(['composer', 'exec', 'exec'], array_map(static fn (?RecipeCommand $c): string => $c === null ? '-' : $c->kind, $plan));
        self::assertSame(['install', '--no-dev'], $plan[0]?->arguments());
    }

    /**
     * A line the build survives, and one it does not. Every line is the second kind
     * unless it says otherwise, because a recipe holds what a worktree is not
     * finished without.
     */
    public function testATaskCanSayTheBuildSurvivesItsFailure(): void
    {
        $recipe = Recipe::fromArray(['install' => [
            ['composer' => 'install'],
            ['exec' => 'cd Build && npm ci', 'optional' => true],
            ['exec' => 'npm run build', 'optional' => false],
        ]]);

        self::assertSame(
            [false, true, false],
            array_map(static fn (?RecipeCommand $c): bool => $c !== null && $c->optional, $recipe->plan('install')),
        );
    }

    /**
     * Anything but yes or no. Read as "no" it would be the one mistake this setting
     * can make that costs a whole build, on the day the line fails.
     */
    public function testATaskThatIsOptionalInSomeOtherWayIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"optional".*true or false/');

        Recipe::fromArray(['install' => [['exec' => 'npm ci', 'optional' => 'maybe']]]);
    }

    public function testATaskItDoesNotKnowIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"drush".*exec, composer/');

        Recipe::fromArray(['install' => [['drush' => 'cr']]]);
    }

    public function testATaskWithNothingToRunIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"exec:"/');

        Recipe::fromArray(['install' => [['exec' => '']]]);
    }

    public function testAnEmptyCommandIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);

        Recipe::fromArray(['install' => ['after' => ['  ']]]);
    }

    public function testASettingWithoutAValueIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"php"/');

        Recipe::fromArray(['php' => '']);
    }

    /**
     * The one setting whose empty value says something: a checkout served from its
     * own root, which is what the TYPO3 core is.
     */
    public function testADocrootThatIsNothingIsTheCheckoutItself(): void
    {
        self::assertSame('', Recipe::fromArray(['docroot' => ''])->docroot);
        self::assertSame('public', Recipe::fromArray(['docroot' => '/public/'])->docroot);
    }

    /**
     * The web server is pointed at it, and this file can arrive with a branch
     * somebody else committed: a docroot leading out of the checkout is a worktree
     * that quietly serves something which is not it.
     */
    public function testADocrootThatLeadsOutOfTheCheckoutIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/leads out of it/');

        Recipe::fromArray(['docroot' => '../../etc']);
    }

    /** A dot in a name is not a way out: only the segment that is one. */
    public function testADocrootMayHoldADotInAName(): void
    {
        self::assertSame('.Build/Web', Recipe::fromArray(['docroot' => '.Build/Web'])->docroot);
    }

    public function testAFileThatIsNotYamlSaysSoAndNamesTheFile(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'recipe');
        self::assertIsString($file);
        file_put_contents($file, "install:\n  - one\n - two\n");

        try {
            $this->expectException(\RuntimeException::class);
            $this->expectExceptionMessageMatches('/branchery\.yaml cannot be read/');
            Recipe::fromFile($file);
        } finally {
            unlink($file);
        }
    }

    /** A file somebody started and did not finish is not a reason to refuse. */
    public function testAnEmptyFileIsAProjectThatSaysNothing(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'recipe');
        self::assertIsString($file);
        file_put_contents($file, "# nothing yet\n");

        try {
            self::assertTrue(Recipe::fromFile($file)->isEmpty());
        } finally {
            unlink($file);
        }
    }

    public function testConfiguringMayStillBeAddedTo(): void
    {
        $recipe = Recipe::fromArray(['configure' => ['after' => ['./bin/extra-config.sh']]]);

        self::assertSame([null, './bin/extra-config.sh'], self::lines($recipe->plan('configure')));
    }

    public function testAProjectSaysWhereItsWorkIsReviewedAndTracked(): void
    {
        $recipe = Recipe::fromArray(['links' => [
            'review' => 'https://review.example.org/q/{change}',
            'issue' => 'https://tracker.example.org/browse/{issue}',
        ]]);

        self::assertSame('https://review.example.org/q/{change}', $recipe->links['review']);
        self::assertSame('https://tracker.example.org/browse/{issue}', $recipe->links['issue']);
        self::assertFalse($recipe->isEmpty());
    }

    /** One may be said without the other. */
    public function testOnlyTheReviewIsAnAnswerToo(): void
    {
        $recipe = Recipe::fromArray(['links' => ['review' => 'https://review.example.org/q/{change}']]);

        self::assertNotNull($recipe->links['review']);
        self::assertNull($recipe->links['issue']);
    }

    /**
     * An address without the number in it leads to the front page of a tracker,
     * which is not where anybody was going.
     */
    public function testAnAddressWithNowhereToPutTheNumberIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/\{issue\}/');

        Recipe::fromArray(['links' => ['issue' => 'https://forge.typo3.org/issues']]);
    }

    /** Where a commit of this project is read, which no remote can be asked. */
    public function testACommitIsAddressedTheWayTheProjectSaysItIs(): void
    {
        $recipe = Recipe::fromArray(['links' => ['commit' => 'https://github.com/typo3/typo3/commit/{commit}']]);

        self::assertSame('https://github.com/typo3/typo3/commit/{commit}', $recipe->links['commit']);
    }

    public function testACommitAddressWithoutItsPlaceholderIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/\{commit\}/');

        Recipe::fromArray(['links' => ['commit' => 'https://github.com/typo3/typo3/commits']]);
    }

    public function testALinkItDoesNotKnowIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"wiki".*review, issue, commit/');

        Recipe::fromArray(['links' => ['wiki' => 'https://example.org/{change}']]);
    }

    /**
     * A list is the whole answer -- these and nothing else -- and a mapping amends
     * the answer that needs no writing down: everything git ignores.
     */
    public function testAListIsWhatTravels(): void
    {
        $recipe = Recipe::fromArray(['carry' => ['.build', 'config/']]);

        self::assertSame(['.build', 'config'], $recipe->carry);
        self::assertSame([], $recipe->carryExcept);
    }

    public function testWhatIsExceptedLeavesTheRestTravelling(): void
    {
        $recipe = Recipe::fromArray(['carry' => ['except' => ['node_modules']]]);

        self::assertNull($recipe->carry);
        self::assertSame(['node_modules'], $recipe->carryExcept);
    }

    /** A project that says nothing about it carries what it always carried. */
    public function testWithoutTheKeyNothingIsSaidAboutWhatTravels(): void
    {
        $recipe = Recipe::fromArray(['php' => '8.3']);

        self::assertNull($recipe->carry);
        self::assertSame([], $recipe->carryExcept);
    }

    public function testAWordUnderCarryThatIsNotExceptIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"only".*except/');

        Recipe::fromArray(['carry' => ['only' => ['.build']]]);
    }

    /**
     * The management's own is refused rather than dropped: a project that wrote it
     * expects it to happen, and it never will.
     */
    public function testCarryingWhatIsOursIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/\.ddev\/branchery.*never travels/');

        Recipe::fromArray(['carry' => ['.build', '.ddev/branchery']]);
    }

    public function testAPathThatLeadsOutOfTheCheckoutIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/inside the checkout/');

        Recipe::fromArray(['carry' => ['../elsewhere']]);
    }

    /**
     * @param list<?RecipeCommand> $commands
     *
     * @return list<?string>
     */
    private static function lines(array $commands): array
    {
        return array_map(static fn (?RecipeCommand $command): ?string => $command?->line, $commands);
    }
}
