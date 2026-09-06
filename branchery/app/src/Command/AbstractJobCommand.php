<?php

declare(strict_types=1);

namespace App\Command;

use App\Jobs\JobRunner;
use App\Jobs\StepReporter;
use App\Web\WebContainer;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Formatter\OutputFormatter;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Base class for the commands that can also run as a background operation. The
 * same logic serves both entry points, because both read the same stream: the
 * steps, the notes, and what the tools wrote while they worked.
 *
 * And a third reader that is neither: `--format=json` holds every line back and
 * answers with one document, because a reader that greps for a tick through
 * escape sequences will eventually grep wrongly. `--detach` hands the work to
 * the background and answers with the id to ask after.
 */
abstract class AbstractJobCommand extends Command
{
    /** What the operation answers with, for the reader who asked for a document. */
    private mixed $answer = null;

    /** How this run was asked to write its answer -- read again by report(). */
    private string $format = Format::TABLE;

    public function __construct(
        protected readonly JobRunner $jobs,
        private readonly WebContainer $web,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('job', null, InputOption::VALUE_REQUIRED, 'Id of the operation whose progress this run writes; the interface sets it, and it is not how one is asked after -- that is "jobs:show"')
            ->addOption('detach', null, InputOption::VALUE_NONE, 'Do the work in the background and answer with the id of the operation')
            ->addOption('format', null, InputOption::VALUE_REQUIRED, 'How to write the answer: "table" for a person, "json" for a program', 'table');
    }

    final protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $format = $this->format = Format::of($input);
        $started = $input->getOption('job');
        $running = is_string($started) && $started !== '';

        // Never when the interface asked: that run *is* the background one, and a
        // detach there would start it a second time.
        if (!$running && (bool) $input->getOption('detach')) {
            return $this->detach($input, $output, $format);
        }

        // Run from a terminal, this keeps a record of itself: until it did, work
        // started there was invisible in the list while it ran and missing from the
        // worktree's history afterwards.
        $job = $running ? (string) $started : $this->jobs->adopt([(string) $this->getName()], $this->subject($input));
        $adopted = !$running;

        $reporter = new StepReporter(function (string $line, string $shown) use ($output, $job, $adopted, $format): void {
            // An operation in the background has no terminal: what it writes is the
            // log, and the log wants the marker. One run from a terminal writes its own
            // record, so the terminal can have the readable form -- whether or not it
            // draws colour, which is not the same question and was taken for it.
            if ($format !== Format::JSON) {
                $output->writeln($adopted ? $shown : $line);
            }
            if ($adopted) {
                // Without the markup: the same line is read in a browser and in a
                // terminal. Resolved by the console's own formatter and not by strip_tags,
                // which cuts "expected \<5 seconds" off at the bracket.
                $this->jobs->append($job, (new OutputFormatter(false))->format($line) ?? '');
            }
        }, $output->isVerbose());
        $this->web->listen($reporter->output(...));

        $failure = null;
        try {
            $status = $this->perform($input, $output, $reporter);
        } catch (\Throwable $exception) {
            $failure = $exception->getMessage();
            if ($format !== Format::JSON) {
                $output->writeln('<fg=red;options=bold>✗</> <fg=red>' . OutputFormatter::escape($failure) . '</>');
                // The way back, here at the moment the reader is looking: a build that
                // stopped leaves a worktree that is there and is not finished, and the
                // command that finishes it is one nobody finds by reading a help page.
                // Only in a terminal: the interface has the press for it on the page.
                if ($adopted && $reporter->resume() !== null) {
                    $output->writeln(sprintf(
                        '<fg=yellow>→</> The worktree is here and not finished. "%s" takes it from the top.',
                        $reporter->resume(),
                    ));
                }
            }
            if ($adopted) {
                $this->jobs->append($job, '✗ ' . $failure);
            }
            $status = Command::FAILURE;
        }

        $this->jobs->finish($job, $status === Command::SUCCESS);

        if ($format === Format::JSON) {
            $output->writeln(Format::json([
                'ok' => $status === Command::SUCCESS,
                'command' => (string) $this->getName(),
                'job' => $job,
                'worktree' => $this->subject($input) !== '' ? $this->subject($input) : null,
                'result' => $this->answer,
                // What it could not do although it went on. Empty is the ordinary answer,
                // and it is the difference between a worktree that is what it says and one
                // that is nearly that.
                'warnings' => $reporter->concerns(),
                'error' => $failure,
                'resume' => $failure !== null ? $reporter->resume() : null,
            ]));
        }

        return $status;
    }

    /**
     * The arguments as they were typed, because they are the only exact record of
     * them: the command's definition is merged with the application's by the time
     * it runs, and rebuilding a line out of that forwards every global option
     * Symfony brings along. What is taken out is what is about this run rather
     * than about the work.
     */
    private function detach(InputInterface $input, OutputInterface $output, string $format): int
    {
        $arguments = [];
        $skip = false;
        foreach (array_slice($_SERVER['argv'] ?? [], 1) as $argument) {
            $argument = (string) $argument;
            if ($skip) {
                // The value of a "--format" written apart from its name. Left standing it
                // would be read as an argument -- "worktree:add json".
                $skip = false;
                continue;
            }
            if ($argument === '--detach' || str_starts_with($argument, '--format=')) {
                continue;
            }
            if ($argument === '--format') {
                $skip = true;
                continue;
            }
            $arguments[] = $argument;
        }

        $job = $this->jobs->start($arguments, $this->subject($input));

        if ($format === Format::JSON) {
            $output->writeln(Format::json(['ok' => true, 'command' => (string) $this->getName(), 'job' => $job]));

            return Command::SUCCESS;
        }
        $output->writeln(sprintf('<fg=cyan>→</> %s', $job));
        $output->writeln(sprintf('  "ddev branchery jobs:show %s" says how it stands, "--wait" answers when it is over.', $job));

        return Command::SUCCESS;
    }

    /**
     * How an operation ends: the one line that says what came of it, in the colour
     * of what it stands on. Everything it could not do is said again under it,
     * because the line above is the one a reader stops at.
     */
    protected function report(OutputInterface $output, StepReporter $reporter, string $line, mixed $answer = null): void
    {
        $this->answer = $answer;

        if ($this->format === Format::JSON) {
            return;
        }

        $concerns = $reporter->concerns();
        $output->writeln(sprintf(
            $concerns === [] ? '<fg=green;options=bold>✓</> %s' : '<fg=yellow;options=bold>⚠</> %s',
            OutputFormatter::escape($line),
        ));
        foreach ($concerns as $concern) {
            $output->writeln('  <fg=yellow>' . OutputFormatter::escape($concern) . '</>');
        }
    }

    /**
     * Only so that work started in a terminal lands in the right row and the right
     * history. A command about the project as a whole says nothing, and is still
     * recorded.
     */
    protected function subject(InputInterface $input): string
    {
        return '';
    }

    abstract protected function perform(InputInterface $input, OutputInterface $output, StepReporter $reporter): int;
}
