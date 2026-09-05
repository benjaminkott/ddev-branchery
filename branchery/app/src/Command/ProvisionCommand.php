<?php

declare(strict_types=1);

namespace App\Command;

use App\Jobs\JobRunner;
use App\Jobs\StepReporter;
use App\Operation\WorktreeManager;
use App\Web\WebContainer;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand('worktree:provision', 'Run the provisioning of a worktree again')]
final class ProvisionCommand extends AbstractWorktreeCommand
{
    public function __construct(JobRunner $jobs, WebContainer $web, private readonly WorktreeManager $manager)
    {
        parent::__construct($jobs, $web);
    }

    protected function configure(): void
    {
        parent::configure();
        $this->addOption(
            'fresh',
            null,
            InputOption::VALUE_NONE,
            'Drop the database and install the application anew -- everything in it goes',
        );
    }

    protected function perform(InputInterface $input, OutputInterface $output, StepReporter $reporter): int
    {
        $worktree = $this->manager->provision(
            $this->name($input),
            (bool) $input->getOption('fresh'),
            $reporter,
        );
        $this->report($output, $reporter, $worktree->url, $worktree);

        return Command::SUCCESS;
    }
}
