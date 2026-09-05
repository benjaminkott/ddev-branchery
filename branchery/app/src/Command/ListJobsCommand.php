<?php

declare(strict_types=1);

namespace App\Command;

use App\Jobs\JobRunner;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * What is being worked on right now.
 *
 * The other half of `--detach`: work handed to the background is asked after,
 * and until this existed the only way to ask was to find the log file and read
 * it. There can be several -- one operation per worktree -- which is why this
 * is a list and not a question about one thing.
 */
#[AsCommand('jobs:list', 'List the operations that are running')]
final class ListJobsCommand extends Command
{
    public function __construct(private readonly JobRunner $jobs)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('format', null, InputOption::VALUE_REQUIRED, 'How to write the answer: "table" or "json"', 'table');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $running = $this->jobs->running();

        if (Format::of($input) === Format::JSON) {
            $output->writeln(Format::json($running));

            return Command::SUCCESS;
        }

        $style = new SymfonyStyle($input, $output);
        if ($running === []) {
            $style->writeln('Nothing is running.');

            return Command::SUCCESS;
        }

        $style->table(
            ['Operation', 'Command', 'Worktree', 'Step'],
            array_map(static fn (array $job): array => [
                $job['id'],
                $job['command'],
                $job['subject'],
                $job['step'] === null
                    ? ''
                    : sprintf('%d/%d %s', $job['step']['no'], $job['step']['total'], $job['step']['label']),
            ], $running),
        );

        return Command::SUCCESS;
    }
}
