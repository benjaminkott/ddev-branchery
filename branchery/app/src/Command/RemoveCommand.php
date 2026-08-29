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

#[AsCommand('worktree:remove', 'Remove a worktree, its branch and its database')]
final class RemoveCommand extends AbstractWorktreeCommand
{
    public function __construct(JobRunner $jobs, WebContainer $web, private readonly WorktreeManager $manager)
    {
        parent::__construct($jobs, $web);
    }

    protected function perform(InputInterface $input, OutputInterface $output, StepReporter $reporter): int
    {
        $name = $this->name($input);
        $this->manager->remove($name, $reporter);
        $this->report($output, $reporter, sprintf('Worktree %s removed.', $name));

        return Command::SUCCESS;
    }
}
