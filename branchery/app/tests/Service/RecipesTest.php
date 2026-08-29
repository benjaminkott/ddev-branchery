<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\Recipe;
use App\Service\Recipes;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Filesystem\Filesystem;

/**
 * How a checkout is built, and where that answer comes from. Nothing is
 * detected: a project that has written nothing gets a worktree and no more, and
 * one that named a shipped configuration gets that with its own lines over it.
 */
final class RecipesTest extends TestCase
{
    private string $project;

    private string $defaults;

    protected function setUp(): void
    {
        $root = sys_get_temp_dir() . '/branchery-recipes-' . bin2hex(random_bytes(4));
        $this->project = $root . '/project';
        $this->defaults = $root . '/defaults';
        (new Filesystem())->mkdir([$this->project . '/.ddev', $this->defaults]);
        file_put_contents($this->defaults . '/demo.yaml', <<<'YAML'
            docroot: public
            bin: vendor/bin
            data:
              from: source
              bring: [config/sites]
              addresses: [config/sites]
            carry:
              except: [var]
            install:
              - composer install
            flush:
              - console cache:clear
            YAML);
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove(\dirname($this->project));
    }

    /** The whole point: without a file, nothing is built. */
    public function testAProjectThatSaysNothingBuildsNothing(): void
    {
        $build = $this->recipes()->for($this->project);

        self::assertTrue($build->isEmpty());
        self::assertNull($build->name());
        self::assertSame('', $build->docroot());
        foreach (Recipe::MOMENTS as $moment) {
            self::assertFalse($build->does($moment), $moment . ' should do nothing');
        }
    }

    public function testWhatIsNamedIsWhatIsBuiltOn(): void
    {
        $this->write("profile: demo\n");
        $build = $this->recipes()->for($this->project);

        self::assertSame('demo', $build->name());
        self::assertSame('public', $build->docroot());
        self::assertTrue($build->does('install'));
        self::assertSame(['from' => 'source', 'bring' => ['config/sites'], 'addresses' => ['config/sites']], $build->data());
        self::assertSame(['var'], $build->carryExcept());
    }

    /** The one line most projects write: the shipped one, with a change. */
    public function testWhatTheProjectSaysStandsOverIt(): void
    {
        $this->write(<<<'YAML'
            profile: demo
            docroot: .build/public
            install:
              after:
                - npm ci
            flush: []
            YAML);
        $build = $this->recipes()->for($this->project);

        self::assertSame('.build/public', $build->docroot());
        // What it is built on still installs, and the project's line follows.
        self::assertTrue($build->does('install'));
        // A moment written as an empty list is a moment that does nothing --
        // which is how a project takes something away.
        self::assertFalse($build->does('flush'));
    }

    /**
     * A checkout that carries no file of its own is built by the project's, which is
     * nearly every worktree: the file is written once, in the checkout DDEV is
     * configured in, and every branch cut from it inherits it.
     */
    public function testACheckoutWithoutAFileIsBuiltByTheProjects(): void
    {
        $this->write("profile: demo\ndocroot: web\n");

        self::assertSame('web', $this->recipes()->for($this->worktree())->docroot());
    }

    /**
     * And one that carries its own is built by that, so a branch which builds
     * differently carries the difference in its own commit.
     */
    public function testACheckoutsOwnFileStandsOverTheProjects(): void
    {
        $this->write("profile: demo\ndocroot: web\n");
        file_put_contents($this->worktree() . '/' . Recipe::FILE, "docroot: .build/public\n");

        self::assertSame('.build/public', $this->recipes()->for($this->worktree())->docroot());
    }

    /**
     * A file with a typo in it refuses every time it is asked about, however many
     * checkouts fall back to it: it is read once and the refusal is remembered.
     */
    public function testAFileThatCannotBeReadRefusesEveryCheckoutThatFallsBackToIt(): void
    {
        $this->write("install: 5\n");
        $recipes = $this->recipes();

        self::assertNotNull($recipes->problem());
        self::assertTrue($recipes->quietly($this->worktree())->isEmpty());
        self::assertNotNull($recipes->problem());
    }

    public function testANameThatIsNotShippedIsRefusedAndSaysWhatThereIs(): void
    {
        $this->write("profile: typo4\n");

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/"typo4".*demo/');

        $this->recipes()->for($this->project);
    }

    /** A name and not a path: nothing outside the shipped directory is read. */
    public function testANameThatIsAPathIsRefused(): void
    {
        $this->write("profile: ../../etc/passwd\n");

        $this->expectException(\RuntimeException::class);

        $this->recipes()->for($this->project);
    }

    /**
     * The reading side must not fall over what the operations refuse: a file with a
     * typo in it costs the operation, not the page.
     */
    public function testAFileThatCannotBeReadIsAProblemAndNotAnException(): void
    {
        $this->write("install: 5\n");

        self::assertTrue($this->recipes()->quietly($this->project)->isEmpty());
        self::assertNotNull($this->recipes()->problem());
    }

    private function recipes(): Recipes
    {
        return new Recipes($this->project, $this->defaults);
    }

    private function write(string $yaml): void
    {
        file_put_contents($this->project . '/' . Recipe::FILE, $yaml);
    }

    /** A checkout beside the project, as an operation makes one. */
    private function worktree(): string
    {
        $directory = $this->project . '/.worktrees/demo';
        (new Filesystem())->mkdir($directory . '/.ddev');

        return $directory;
    }
}
