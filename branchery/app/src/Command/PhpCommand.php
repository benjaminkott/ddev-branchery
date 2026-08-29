<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\PhpVersions;
use App\Service\WorktreeManager;
use App\Service\WorktreeRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand('worktree:php', 'Show or set the PHP version of a worktree')]
final class PhpCommand extends Command
{
    public function __construct(
        private readonly WorktreeManager $manager,
        private readonly WorktreeRepository $worktrees,
        private readonly PhpVersions $php,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('name', InputArgument::REQUIRED, 'Worktree')
            ->addArgument('version', InputArgument::OPTIONAL, 'Desired version')
            ->addOption('format', null, InputOption::VALUE_REQUIRED, 'How to write the answer: "table" or "json"', 'table');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $name = (string) $input->getArgument('name');
        $version = $input->getArgument('version');

        if ($version === null) {
            $worktree = $this->worktrees->get($name);
            if ($worktree === null) {
                $output->writeln(sprintf('<fg=red;options=bold>✗</> <fg=red>Worktree "%s" does not exist.</>', $name));

                return Command::FAILURE;
            }
            if (Format::of($input) === Format::JSON) {
                $output->writeln(Format::json([
                    'name' => $name,
                    'php' => $this->php->forWorktree($name),
                    'minPhp' => $worktree->minPhp,
                    'available' => $this->php->available(),
                ]));

                return Command::SUCCESS;
            }
            $output->writeln(sprintf(
                '%s: PHP %s%s',
                $name,
                $this->php->forWorktree($name),
                $worktree->minPhp !== null ? sprintf(' (at least %s)', $worktree->minPhp) : '',
            ));

            return Command::SUCCESS;
        }

        try {
            $this->manager->setPhpVersion($name, (string) $version);
        } catch (\InvalidArgumentException $exception) {
            $output->writeln('<fg=red;options=bold>✗</> <fg=red>' . $exception->getMessage() . '</>');

            return Command::FAILURE;
        }
        $output->writeln(sprintf('<fg=green;options=bold>✓</> %s now runs with PHP %s.', $name, $version));

        return Command::SUCCESS;
    }
}
