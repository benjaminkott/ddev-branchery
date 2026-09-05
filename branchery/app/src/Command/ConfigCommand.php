<?php

declare(strict_types=1);

namespace App\Command;

use App\Operation\WorktreeManager;
use App\Worktree\DescribeInfo;
use App\Worktree\WorktreeRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand('worktree:config', 'Write the generated configuration again')]
final class ConfigCommand extends Command
{
    public function __construct(
        private readonly WorktreeManager $manager,
        private readonly WorktreeRepository $worktrees,
        private readonly DescribeInfo $describe,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('name', InputArgument::OPTIONAL, 'Worktree; all of them if omitted');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $name = $input->getArgument('name');
        // The cheap question: which worktrees there are, and not what each of
        // them is. Building them asks git about branches, distances and what
        // is merged -- none of which decides anything here, and all of which
        // is a container call.
        $names = $name !== null ? [(string) $name] : $this->worktrees->names();

        foreach ($names as $current) {
            try {
                $this->manager->reconfigure($current);
            } catch (\InvalidArgumentException $exception) {
                $output->writeln('<fg=red;options=bold>✗</> <fg=red>' . $exception->getMessage() . '</>');

                return Command::FAILURE;
            }
            $output->writeln('<fg=green;options=bold>✓</> ' . $current);
        }

        // Also without a worktree to reconfigure: what "ddev describe" shows is
        // generated configuration too, and this is the command that refreshes it.
        $this->describe->refresh();

        return Command::SUCCESS;
    }
}
