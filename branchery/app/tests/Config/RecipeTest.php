<?php

declare(strict_types=1);

namespace App\Tests\Config;

use App\Config\Recipe;
use App\Config\RecipeCommand;
use App\Config\Version;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Yaml\Yaml;

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
    public function testTheOrderOfAMomentIsTheOrderItIsWrittenIn(): void
    {
        $recipe = Recipe::fromArray(['setup' => ['./bin/pre.sh', ['inherit' => 'profile'], './bin/post.sh', 'npm run build']]);

        self::assertSame(['./bin/pre.sh', null, './bin/post.sh', 'npm run build'], self::lines($recipe->plan('setup')));
    }

    /** Left out, this moment is what the project wrote and no more. */
    public function testAMomentWithoutThePlaceForItLeavesWhatItIsBuiltOnOut(): void
    {
        $recipe = Recipe::fromArray(['setup' => ['a', 'b', 'c']]);

        self::assertSame(['a', 'b', 'c'], self::lines($recipe->plan('setup')));
        self::assertFalse($recipe->wantsTheProfile());
    }

    /** A moment nobody wrote about is that work alone. */
    public function testAMomentWithoutARecipeIsWhatItIsBuiltOnAlone(): void
    {
        self::assertSame([null], self::lines(Recipe::none()->plan('setup')));
    }

    /** An empty list is a moment the project has switched off. */
    public function testAMomentSetToNothingDoesNothing(): void
    {
        self::assertSame([], Recipe::fromArray(['finish' => []])->plan('finish'));
    }

    public function testAProjectThatSaysNothingChangesNothing(): void
    {
        self::assertTrue(Recipe::none()->isEmpty());
        self::assertTrue(Recipe::fromArray([])->isEmpty());
    }

    /**
     * A task and not a word, so nothing a project writes as a line can be taken
     * for the one entry that is not a line.
     */
    public function testALineIsALineWhateverItSays(): void
    {
        $recipe = Recipe::fromArray(['setup' => ['profile', 'inherit', ['inherit' => 'profile']]]);
        $plan = $recipe->plan('setup');

        self::assertSame('profile', $plan[0]?->line);
        self::assertSame('inherit', $plan[1]?->line);
        self::assertNull($plan[2]);
    }

    /** There is one thing to inherit, and it is said one way. */
    public function testInheritingAnythingElseIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/inherits is the profile/');

        Recipe::fromArray(['setup' => [['inherit' => 'everything']]]);
    }

    /** Once, because what it is built on does its work once. */
    public function testTheSamePlaceTwiceIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/more than once/');

        Recipe::fromArray(['setup' => [['inherit' => 'profile'], 'a', ['inherit' => 'profile']]]);
    }

    /**
     * A moment written around work that is not there is a line the developer
     * expects to happen, so it is said rather than passed over.
     */
    public function testAPlaceForAProfileThatIsNotNamedIsRefused(): void
    {
        self::assertTrue(Recipe::fromArray(['setup' => [['inherit' => 'profile'], 'a']])->wantsTheProfile());
    }

    /** A version written without quotes is a number in YAML, and 8.3 is meant. */
    public function testAVersionThatArrivesAsANumberIsStillAVersion(): void
    {
        self::assertSame('8.3', Recipe::fromArray(['php' => 8.3])->php?->number);
        self::assertSame('8', Recipe::fromArray(['php' => 8])->php?->number);
    }

    /**
     * In both spellings, and the same grammar as the PHP one: a project should not
     * have to learn a second way of saying the same thing.
     */
    public function testTheNodeVersionIsAVersionOrWhereItStands(): void
    {
        self::assertSame('22', Recipe::fromArray(['node' => 22])->node?->number);
        self::assertSame('20.11.1', Recipe::fromArray(['node' => '20.11.1'])->node?->number);

        $pointed = Recipe::fromArray(['node' => ['read' => 'Build/.nvmrc']])->node;

        self::assertNotNull($pointed);
        self::assertNull($pointed->number);
        self::assertSame('Build/.nvmrc', $pointed->read);
        self::assertNull($pointed->match);
    }

    /**
     * A file made to hold a version holds one line and says nothing about how to
     * read it, so a project that names such a file says only that. A pattern is
     * for a file that holds more -- the core's test runner.
     */
    public function testAFileMadeToHoldAVersionIsReadWithoutBeingToldHow(): void
    {
        $nvmrc = Version::readFrom('Build/.nvmrc');

        self::assertSame('22.11.0', $nvmrc->in("v22.11.0\n"));
        self::assertSame('20.11.1', $nvmrc->in('20.11.1'));
        self::assertSame('22', $nvmrc->in("# the version the assets build with\nv22\n"));
        // A word rather than a number: n understands it and it is handed on whole.
        self::assertSame('lts/iron', $nvmrc->in("lts/iron\n"));
        self::assertNull($nvmrc->in("\n\n"));
    }

    /** What is refused about the PHP version is refused about this one. */
    public function testANodeVersionWithAnEmptyPatternIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"node\.match".*holds the version and nothing else/s');

        Recipe::fromArray(['node' => ['read' => 'Build/.nvmrc', 'match' => '  ']]);
    }

    public function testAVersionPointedAtNoFileIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"node\.read"/');

        Recipe::fromArray(['node' => ['match' => 'v?(\\d+)']]);
    }

    public function testASettingIsTakenAsWritten(): void
    {
        $recipe = Recipe::fromArray(['profile' => 'typo3-app', 'docroot' => 'web', 'bin' => '.build/bin']);

        self::assertSame('typo3-app', $recipe->profile);
        self::assertSame('web', $recipe->docroot);
        self::assertSame('.build/bin', $recipe->bin);
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
                Recipe::fromArray(['copy' => ['except' => [$path]]]);
                self::fail(sprintf('"%s" was taken for a path inside the checkout.', $path));
            } catch (\RuntimeException $refusal) {
                self::assertStringContainsString('leads out of it', $refusal->getMessage(), $path);
            }
        }

        self::assertSame(['config/sites'], Recipe::fromArray(['copy' => ['except' => ['config/sites/']]])->copy['except']);
    }

    /**
     * The core's test runner is the case this exists for; what the pattern does not
     * find is null and not the whole line.
     */
    public function testTheVersionIsReadOutOfTheFileByThePattern(): void
    {
        $runner = "#!/usr/bin/env bash\nPHP_VERSION=\"8.4\"\nCONTAINER=podman\n";

        self::assertSame('8.4', Version::readFrom('runTests.sh', 'PHP_VERSION="(\d+\.\d+)"')->in($runner));
        self::assertSame('8.4', Version::readFrom('runTests.sh', '\d+\.\d+')->in($runner));
        self::assertNull(Version::readFrom('runTests.sh', 'PHP_MINOR="(\d+)"')->in($runner));
        self::assertSame('7.4', Version::readFrom('any', 'php: (\d+\.\d+)/fpm')->in('php: 7.4/fpm'));
    }

    public function testAKeyItDoesNotKnowIsRefusedAndSaysWhatItKnows(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"instal".*install/s');

        Recipe::fromArray(['instal' => ['composer install']]);
    }

    public function testAMomentThatIsNotAListOfCommandsIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/list of what it runs.*inherit: profile/s');

        Recipe::fromArray(['install' => 'composer install']);
    }

    /**
     * A moment used to be a mapping of before, run and after. The order is now
     * the order it is written in, so a mapping earns the same refusal as anything
     * else that is not a list.
     */
    public function testAMomentWrittenAsAMappingIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/list of what it runs/');

        Recipe::fromArray(['install' => ['after' => ['npm ci']]]);
    }

    public function testACommandThatIsNeitherALineNorATaskIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/install.*exec:.*composer:/s');

        Recipe::fromArray(['install' => [['composer', 'install']]]);
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

    /**
     * A shell line is written as it is typed, and YAML reads a colon in one as
     * the start of a task -- so the refusal says what to do about it rather than
     * talking about kinds the developer never meant to write.
     */
    public function testALineHoldingAColonSaysToQuoteIt(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"echo building".*in quotes/s');

        Recipe::fromString("install:\n  - echo building: now\n");
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

        Recipe::fromArray(['install' => ['  ']]);
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
        $recipe = Recipe::fromArray(['configure' => [['inherit' => 'profile'], './bin/extra-config.sh']]);

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
     * A project has as many pages worth opening as it has, and each is offered
     * under the word the project writes -- the same one-key shape a recipe line
     * uses, so nothing new has to be learned for it.
     */
    public function testThePagesWorthOpeningAreReadInTheOrderTheyAreOffered(): void
    {
        $recipe = Recipe::fromArray(['entrypoints' => [['Backend' => '/typo3'], ['Storybook' => 'storybook/']]]);

        self::assertSame(
            [['name' => 'Backend', 'path' => '/typo3'], ['name' => 'Storybook', 'path' => '/storybook']],
            $recipe->entrypoints,
        );
    }

    /** How a project says it has none although what it is built on has. */
    public function testAnEmptyListOfPagesIsSaidAndNotUnsaid(): void
    {
        $laid = Recipe::fromArray(['entrypoints' => []])
            ->over(Recipe::fromArray(['entrypoints' => [['Backend' => '/typo3']]]));

        self::assertSame([], $laid->entrypoints);
    }

    public function testAPageWithoutAPathIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"Backend".*path/');

        Recipe::fromArray(['entrypoints' => [['Backend' => '']]]);
    }

    /**
     * Two under one entry is an offer whose word nobody can read off the file --
     * the same refusal a recipe line earns for the same reason.
     */
    public function testAPageThatIsNotOneNameAndOnePathIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/one name and one path/');

        Recipe::fromArray(['entrypoints' => [['Backend' => '/typo3', 'Storybook' => '/storybook']]]);
    }

    /**
     * A list is the whole answer -- these and nothing else -- and a mapping amends
     * the answer that needs no writing down: everything git ignores.
     */
    public function testAListIsWhatTravels(): void
    {
        $recipe = Recipe::fromArray(['copy' => ['.build', 'config/']]);

        self::assertSame(['.build', 'config'], $recipe->copy['only']);
        self::assertNull($recipe->copy['except']);
    }

    public function testWhatIsExceptedLeavesTheRestTravelling(): void
    {
        $recipe = Recipe::fromArray(['copy' => ['except' => ['node_modules']]]);

        self::assertNull($recipe->copy['only']);
        self::assertSame(['node_modules'], $recipe->copy['except']);
    }

    /** A project that says nothing about it carries what it always carried. */
    public function testWithoutTheKeyNothingIsSaidAboutWhatTravels(): void
    {
        $recipe = Recipe::fromArray(['php' => '8.3']);

        self::assertNull($recipe->copy['only']);
        self::assertNull($recipe->copy['except']);
    }

    /**
     * Null is "did not say" and an empty list is an answer, which is what lets a
     * project take back what the configuration it names keeps out. Read as the same
     * thing, "except: []" would be the one spelling in this file that is accepted
     * and does nothing.
     */
    public function testAnEmptyListIsSaidAndNotUnsaid(): void
    {
        self::assertSame([], Recipe::fromArray(['copy' => ['except' => []]])->copy['except']);
        self::assertSame([], Recipe::fromArray(['data' => ['needs' => []]])->data['needs']);
        self::assertNull(Recipe::fromArray(['data' => ['from' => 'none']])->data['needs']);
    }

    public function testAWordUnderCopyThatIsNotExceptIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"only".*except/');

        Recipe::fromArray(['copy' => ['only' => ['.build']]]);
    }

    /**
     * The management's own is refused rather than dropped: a project that wrote it
     * expects it to happen, and it never will.
     */
    public function testCarryingWhatIsOursIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/\.ddev\/branchery.*never travels/');

        Recipe::fromArray(['copy' => ['.build', '.ddev/branchery']]);
    }

    public function testAPathThatLeadsOutOfTheCheckoutIsRefused(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/inside the checkout/');

        Recipe::fromArray(['copy' => ['../elsewhere']]);
    }

    /**
     * The guard under the arrangement: a key added to the constructor and
     * forgotten in `over()` is a key a project may write, which the file accepts
     * and which then quietly does nothing -- the one failure the whole of this
     * class is written against. Both directions, because forgetting it drops
     * either what the project said or what it is built on.
     */
    public function testEveryKeyIsCarriedAcrossTheArrangement(): void
    {
        $read = self::everything();

        // Read from outside, so this is every public key and not the moments --
        // those are laid differently by design, the slot for the base's own work
        // being filled in, and the tests above hold them. Everything else has to
        // come across exactly as the file wrote it, from either side.
        self::assertEquals(get_object_vars($read), get_object_vars($read->over(Recipe::none())));
        self::assertEquals(get_object_vars($read), get_object_vars(Recipe::none()->over($read)));
    }

    /**
     * And that the file is what its name says. A key the reader knows and the
     * file does not is a key nobody reviews and the guard above never sees.
     */
    public function testTheFileThatSaysEverythingLeavesNothingOut(): void
    {
        $said = Yaml::parseFile(self::EVERYTHING);
        self::assertIsArray($said);

        self::assertSame([], array_values(array_diff(Recipe::keys(), array_keys($said))));
    }

    /** The other spelling of "copy", which the one above cannot hold at once. */
    public function testWhatTravelsIsCarriedAcrossToo(): void
    {
        $listed = Recipe::fromArray(['copy' => ['.build']]);

        self::assertSame(['.build'], $listed->over(Recipe::none())->copy['only']);
        self::assertSame(['.build'], Recipe::none()->over($listed)->copy['only']);
    }

    /**
     * A setting stands whole and a mapping is laid key by key, because its keys are
     * written one at a time: a site built with TYPO3 may track its issues in its
     * own tracker while its patches go to Gerrit.
     */
    public function testAMappingIsLaidOverKeyByKeyAndASettingWhole(): void
    {
        $own = Recipe::fromArray([
            'docroot' => 'web',
            'links' => ['issue' => 'https://tracker.example.org/{issue}'],
        ]);
        $laid = $own->over(self::everything());

        self::assertSame('web', $laid->docroot);
        self::assertSame('https://tracker.example.org/{issue}', $laid->links['issue']);
        self::assertSame('https://review.typo3.org/q/{change}', $laid->links['review']);
        self::assertSame('8.4', $laid->php?->number);
    }

    /**
     * The one thing a version may not become: both at once. Written out over a
     * configuration that points at a file, the pointer goes with it -- or the
     * interface goes on naming a file nothing is read from.
     */
    public function testAVersionWrittenOutLeavesNoPointerBehind(): void
    {
        $laid = Recipe::fromArray(['php' => '8.3'])
            ->over(Recipe::fromArray(['php' => ['read' => 'Build/Scripts/runTests.sh', 'match' => 'PHP="(\d+\.\d+)"']]));

        self::assertNotNull($laid->php);
        self::assertSame('8.3', $laid->php->number);
        self::assertNull($laid->php->read);
        self::assertNull($laid->php->match);
    }

    /** Every key this file knows, written out where a person can review it. */
    private const EVERYTHING = __DIR__ . '/everything.yaml';

    private static function everything(): Recipe
    {
        return Recipe::fromFile(self::EVERYTHING);
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
