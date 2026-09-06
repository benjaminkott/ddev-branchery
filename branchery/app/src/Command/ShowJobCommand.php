<?php

declare(strict_types=1);

namespace App\Command;

use App\Jobs\JobRunner;
use App\Model\JobState;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Formatter\OutputFormatter;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * How one operation stands, and what it wrote -- the same document the
 * interface reads from /api/jobs/<id>, so a shell and a page are told one
 * thing. It answers about an operation that is over as readily as one running.
 *
 * With "--wait" it answers only when the work is over and its exit code is the
 * answer. That is the way to wait and not a loop around this command: DDEV
 * hands one exit code back for every failure, so a code meaning "still working"
 * would arrive as the code meaning "it failed".
 */
#[AsCommand('jobs:show', 'Show how an operation stands and what it wrote')]
final class ShowJobCommand extends Command
{
    public function __construct(private readonly JobRunner $jobs)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('id', InputArgument::REQUIRED, 'Operation, as "jobs:list" and "--detach" name it')
            ->addOption('wait', null, InputOption::VALUE_NONE, 'Answer only once the operation is over, and fail if it failed')
            ->addOption('log', null, InputOption::VALUE_NONE, 'Print everything the operation wrote, not only where it stands')
            ->addOption('format', null, InputOption::VALUE_REQUIRED, 'How to write the answer: "table" or "json"', 'table');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $id = (string) $input->getArgument('id');
        $state = $this->jobs->state($id);
        // Never on an id nothing is on record for: that one is answered below, and
        // waiting for it would be waiting for good.
        if ((bool) $input->getOption('wait') && $state->status === 'running') {
            $state = $this->await($id);
        }

        // Nothing was ever written under that id. Said, rather than answered with a
        // document full of empty fields that reads like a job which did nothing.
        if ($state->status === 'unknown') {
            $message = sprintf('No operation called "%s" is on record.', (string) $input->getArgument('id'));
            $output->writeln(Format::of($input) === Format::JSON
                ? Format::json(['ok' => false, 'error' => $message])
                : '<fg=red;options=bold>✗</> <fg=red>' . $message . '</>');

            return Command::FAILURE;
        }

        if (Format::of($input) === Format::JSON) {
            $output->writeln(Format::json($state));

            return $this->codeFor($input, $state->status);
        }

        $output->writeln(sprintf(
            '%s  %s%s  %ds',
            $state->status,
            $state->command,
            $state->subject !== '' ? '  ' . $state->subject : '',
            $state->elapsed,
        ));
        foreach ($state->steps as $step) {
            $output->writeln(sprintf('  [%s] %d %s (%ds)', $step['state'], $step['no'], $step['label'], $step['seconds']));
        }
        if ($state->interrupted) {
            $output->writeln('  It did not end; it stopped -- the process is gone without an exit code.');
        }
        // The line the operation stopped on, which is the one thing worth reading
        // before the rows: one refused before its first step has no row to put it
        // in at all, and answered as "failed, 0s" it said nothing about why.
        if ($state->status === 'failed' && !$state->interrupted && ($reason = self::reason($state->log)) !== '') {
            $output->writeln('  <fg=red>' . OutputFormatter::escape($reason) . '</>');
        }
        if ((bool) $input->getOption('log')) {
            $output->writeln($state->log);
        }

        return $this->codeFor($input, $state->status);
    }

    /** The line the console marked as the one it stopped on, without the mark. */
    public static function reason(string $log): string
    {
        foreach (array_reverse(explode("\n", trim($log))) as $line) {
            if (str_starts_with($line, '✗')) {
                return trim(substr($line, \strlen('✗')));
            }
        }

        return '';
    }

    /**
     * Asked for rather than polled by the caller, because the caller cannot poll on
     * the answer: DDEV hands back one exit code for every failure, so "still
     * working" and "it failed" arrive as the same 1. An operation whose process is
     * gone is already reported as failed, so nothing waits on one that never answers.
     */
    private function await(string $id): JobState
    {
        while (true) {
            $state = $this->jobs->state($id);
            if ($state->status !== 'running') {
                return $state;
            }
            usleep(1_000_000);
        }
    }

    /**
     * Only ever what the caller asked about: without "--wait" the question is "how
     * does it stand", and an operation still working is a perfectly good answer.
     * With "--wait" the question is "did it work".
     */
    private function codeFor(InputInterface $input, string $status): int
    {
        return (bool) $input->getOption('wait') && $status !== 'done'
            ? Command::FAILURE
            : Command::SUCCESS;
    }
}
