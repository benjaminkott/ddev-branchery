<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\JobRunner;
use App\Service\Project;
use App\Service\StepReporter;
use App\Service\WebContainer;
use App\Service\WorktreeManager;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand('worktree:fork', 'Branch off, carrying code and database over')]
final class ForkCommand extends AbstractJobCommand
{
    public function __construct(JobRunner $jobs, WebContainer $web, private readonly WorktreeManager $manager)
    {
        parent::__construct($jobs, $web);
    }

    protected function configure(): void
    {
        parent::configure();
        $this->addArgument('branch', InputArgument::REQUIRED, 'Name of the new branch')
            ->addOption('from', null, InputOption::VALUE_REQUIRED, 'Worktree to use as the source; the project checkout if omitted')
            ->addOption('name', null, InputOption::VALUE_REQUIRED, 'Different directory name');
    }

    /** The worktree it will make: the name that was asked for, or the branch's. */
    protected function subject(InputInterface $input): string
    {
        $name = $input->getOption('name');

        return is_string($name) && $name !== '' ? $name : Project::slug((string) $input->getArgument('branch'));
    }

    protected function perform(InputInterface $input, OutputInterface $output, StepReporter $reporter): int
    {
        $worktree = $this->manager->fork(
            (string) $input->getArgument('branch'),
            $input->getOption('from') !== null ? (string) $input->getOption('from') : null,
            $input->getOption('name') !== null ? (string) $input->getOption('name') : null,
            $reporter,
        );
        $this->report($output, $reporter, sprintf('%s  (%s)', $worktree->url, $worktree->branch), $worktree);

        return Command::SUCCESS;
    }
}
