<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\WorktreeManager;
use App\Text;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Databases whose worktree is gone.
 *
 * It lists by default and removes only when told to: this runs without a
 * terminal to ask back through, and dropping a database because a command was
 * typed once is not something to find out about afterwards.
 */
#[AsCommand('database:prune', 'List databases whose worktree is gone, and remove them')]
final class PruneCommand extends Command
{
    public function __construct(private readonly WorktreeManager $manager)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('drop', null, InputOption::VALUE_NONE, 'Remove what is listed')
            ->addOption('format', null, InputOption::VALUE_REQUIRED, 'How to write the list: "table" or "json"', 'table');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $style = new SymfonyStyle($input, $output);
        $orphans = $this->manager->orphanedDatabases();

        if (!$input->getOption('drop') && Format::of($input) === Format::JSON) {
            $output->writeln(Format::json(array_map(
                static fn (string $name, int $tables): array => ['database' => $name, 'tables' => $tables],
                array_keys($orphans),
                $orphans,
            )));

            return Command::SUCCESS;
        }

        if ($orphans === []) {
            $style->writeln('Every database here belongs to a worktree.');

            return Command::SUCCESS;
        }

        if (!$input->getOption('drop')) {
            $style->table(
                ['Database', 'Tables'],
                array_map(static fn (string $name, int $tables): array => [$name, $tables], array_keys($orphans), $orphans),
            );
            $style->writeln(sprintf(
                ' %s without a worktree. "ddev branchery database:prune --drop" removes what is listed here; the data goes with it.',
                Text::count(\count($orphans), 'database'),
            ));

            return Command::SUCCESS;
        }

        foreach ($orphans as $database => $tables) {
            $this->manager->dropDatabase($database);
            $style->writeln(sprintf('<fg=green;options=bold>✓</> %s dropped (%s)', $database, Text::count($tables, 'table')));
        }

        return Command::SUCCESS;
    }
}
