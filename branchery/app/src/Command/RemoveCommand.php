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

#[AsCommand('worktree:remove', 'Remove a worktree, its database, and the branch it cut')]
final class RemoveCommand extends AbstractWorktreeCommand
{
    public function __construct(JobRunner $jobs, WebContainer $web, private readonly WorktreeManager $manager)
    {
        parent::__construct($jobs, $web);
    }

    protected function configure(): void
    {
        parent::configure();
        $this->addOption(
            'force',
            null,
            InputOption::VALUE_NONE,
            'Remove it even where uncommitted changes, or commits on its branch that are nowhere else, go with it',
        );
    }

    protected function perform(InputInterface $input, OutputInterface $output, StepReporter $reporter): int
    {
        $name = $this->name($input);
        $this->manager->remove($name, $reporter, (bool) $input->getOption('force'));
        $this->report($output, $reporter, sprintf('Worktree %s removed.', $name));

        return Command::SUCCESS;
    }
}
