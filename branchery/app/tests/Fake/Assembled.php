<?php

declare(strict_types=1);

namespace App\Tests\Fake;

use App\Git\Facts;
use App\Git\Git;
use App\Git\History;
use App\Git\Repository;
use App\Git\Runner;
use App\Git\WorkingCopy;
use App\Jobs\Locks;
use App\Project;
use App\Web\WebContainer;

/**
 * The pieces of git put together the one way they go together.
 *
 * Here rather than in each test that wants a Git: they all want the same graph,
 * and one Runner for the whole of it is not an option -- it is what tells Facts
 * that a command wrote, and a second one tells nobody.
 */
final class Assembled
{
    public static function git(Project $project, WebContainer $web, Locks $locks): Git
    {
        $runner = new Runner($project, $web);

        return new Git(
            $runner,
            new Facts($project, $runner),
            new History($runner),
            new WorkingCopy($runner),
            new Repository($project, $runner, $locks),
        );
    }
}
