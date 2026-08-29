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

#[AsCommand('worktree:discard', 'Put a branch back on its remote, dropping what it carried alone')]
final class DiscardCommand extends AbstractWorktreeCommand
{
    public function __construct(JobRunner $jobs, WebContainer $web, private readonly WorktreeManager $manager)
    {
        parent::__construct($jobs, $web);
    }

    protected function perform(InputInterface $input, OutputInterface $output, StepReporter $reporter): int
    {
        $this->manager->discardUnpushed($this->name($input), $reporter);

        return Command::SUCCESS;
    }
}
