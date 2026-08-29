<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\JobRunner;
use App\Service\StepReporter;
use App\Service\WebContainer;
use App\Service\WorktreeManager;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand('worktree:restore', 'Put a worktree back on the branch it was made for')]
final class RestoreCommand extends AbstractWorktreeCommand
{
    public function __construct(JobRunner $jobs, WebContainer $web, private readonly WorktreeManager $manager)
    {
        parent::__construct($jobs, $web);
    }

    protected function perform(InputInterface $input, OutputInterface $output, StepReporter $reporter): int
    {
        $this->manager->restoreBranch($this->name($input), $reporter);

        return Command::SUCCESS;
    }
}
