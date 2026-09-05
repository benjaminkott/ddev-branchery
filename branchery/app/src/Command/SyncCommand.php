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

#[AsCommand('database:sync', 'Fetch the data of the project checkout into a worktree again')]
final class SyncCommand extends AbstractWorktreeCommand
{
    public function __construct(JobRunner $jobs, WebContainer $web, private readonly WorktreeManager $manager)
    {
        parent::__construct($jobs, $web);
    }

    protected function configure(): void
    {
        parent::configure();
        $this->addOption('from', null, InputOption::VALUE_REQUIRED, 'Worktree to take the data from; the project checkout if omitted');
    }

    protected function perform(InputInterface $input, OutputInterface $output, StepReporter $reporter): int
    {
        $this->manager->syncDatabase(
            $this->name($input),
            $input->getOption('from') !== null ? (string) $input->getOption('from') : null,
            $reporter,
        );

        return Command::SUCCESS;
    }
}
