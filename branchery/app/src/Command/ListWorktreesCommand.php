<?php

declare(strict_types=1);

namespace App\Command;

use App\Model\Worktree;
use App\Text;
use App\Worktree\WorktreeRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * The worktrees, as a table for a person and as JSON for a program. The JSON is
 * the same shape the interface reads from /api/worktrees, so a program has one
 * answer to read wherever it asks.
 */
#[AsCommand('worktree:list', 'List the worktrees and what each one runs on')]
final class ListWorktreesCommand extends Command
{
    public function __construct(private readonly WorktreeRepository $worktrees)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('format', null, InputOption::VALUE_REQUIRED, 'How to write the answer: "table" or "json"', 'table');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        // The list before the project's row it is printed under: in that order the
        // second question is answered out of the first -- see Git::distances().
        $worktrees = $this->worktrees->all();
        $entries = [$this->worktrees->project(), ...$worktrees];

        if (Format::of($input) === Format::JSON) {
            $output->writeln(Format::json($entries));

            return Command::SUCCESS;
        }

        $style = new SymfonyStyle($input, $output);
        $rows = array_map(
            static fn (Worktree $worktree): array => [
                $worktree->name . ($worktree->isProject ? ' *' : ''),
                $worktree->branch,
                $worktree->php,
                $worktree->database,
                $worktree->url,
                implode(', ', self::stateOf($worktree)),
            ],
            $entries,
        );

        $style->table(['Worktree', 'Branch', 'PHP', 'Database', 'Address', 'State'], $rows);
        $style->writeln(' * the project checkout');

        return Command::SUCCESS;
    }

    /**
     * In the words the interface uses for the same facts.
     *
     * @return list<string>
     */
    public static function stateOf(Worktree $worktree): array
    {
        $state = [];
        // Where it was cut from, first: it is what places the row among the
        // others, and the rest is what is true of the row alone.
        if ($worktree->base !== null) {
            $state[] = sprintf('off %s +%d', $worktree->base['branch'], $worktree->base['own']);
            if ($worktree->base['moved'] > 0) {
                $state[] = sprintf('%s moved on by %d', $worktree->base['branch'], $worktree->base['moved']);
            }
        }
        if (!$worktree->ready && !$worktree->isProject) {
            $state[] = 'not built';
        }
        // Said even where the dependencies are there, because that is the case
        // it exists for: a build that got through composer and died in the
        // step after it leaves a worktree nothing else tells apart from a
        // finished one.
        if ($worktree->incomplete && !$worktree->isProject) {
            $state[] = 'build unfinished';
        }
        if ($worktree->stale) {
            $state[] = 'dependencies changed since the build';
        }
        if ($worktree->changes > 0) {
            $state[] = Text::count($worktree->changes, 'change') . ' uncommitted';
        }
        if ($worktree->ahead !== null && $worktree->ahead > 0) {
            $state[] = Text::count($worktree->ahead, 'commit') . ' unpushed';
        }
        if ($worktree->behind !== null && $worktree->behind > 0) {
            $state[] = Text::count($worktree->behind, 'commit') . ' behind';
        }
        if ($worktree->ahead === null && !$worktree->isProject) {
            $state[] = 'on no remote';
        }

        return $state;
    }
}
