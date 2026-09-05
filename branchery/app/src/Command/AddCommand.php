<?php

declare(strict_types=1);

namespace App\Command;

use App\Jobs\JobRunner;
use App\Jobs\StepReporter;
use App\Operation\WorktreeManager;
use App\Project;
use App\Web\WebContainer;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand('worktree:add', 'Create and provision a worktree for an existing branch')]
final class AddCommand extends AbstractJobCommand
{
    public function __construct(JobRunner $jobs, WebContainer $web, private readonly WorktreeManager $manager)
    {
        parent::__construct($jobs, $web);
    }

    protected function configure(): void
    {
        parent::configure();
        // Nothing to force any more: how a checkout is built is what the
        // project's own file says, and a branch that builds differently says
        // so in its own commit.
        $this->addArgument('branch', InputArgument::REQUIRED, 'Branch to check out')
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
        $worktree = $this->manager->add(
            (string) $input->getArgument('branch'),
            $input->getOption('name') !== null ? (string) $input->getOption('name') : null,
            $reporter,
        );
        $this->report($output, $reporter, sprintf('%s  (%s)', $worktree->url, $worktree->branch), $worktree);

        return Command::SUCCESS;
    }
}
