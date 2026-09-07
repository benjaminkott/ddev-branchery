<?php

declare(strict_types=1);

namespace App\Command;

use App\Installation;
use App\ManagedFiles;
use App\Project;
use App\Releases;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Notes what the newest released version is, so the page can say that one
 * exists.
 *
 * Hidden, and run by the container as it starts: no project can work this out
 * from its own files, and the interface must not go asking while somebody waits
 * for a page. What arrives is left in the state directory and read from there.
 *
 * Nothing here fails. A machine with no network, a rate limit, a repository
 * that has never released: each answers null, and what was noted last time is
 * left standing rather than replaced with silence.
 */
#[AsCommand(name: 'update:check', description: 'Note the newest released version', hidden: true)]
final class CheckReleasesCommand extends Command
{
    /**
     * How long a noted version is taken as current. A restart is the moment this
     * runs and developers restart projects all day; without an age the check would
     * spend a rate limit on an answer that cannot have changed.
     */
    private const int FRESH_FOR = 6 * 3600;

    public function __construct(
        private readonly Releases $releases,
        private readonly Project $project,
        private readonly ManagedFiles $files,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('force', null, InputOption::VALUE_NONE, 'Ask again even if what is noted is still fresh');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $file = $this->project->stateDirectory() . '/' . Installation::NOTED;

        if ($input->getOption('force') !== true && $this->fresh($file)) {
            $output->writeln('What is noted is still fresh.', OutputInterface::VERBOSITY_VERBOSE);

            return Command::SUCCESS;
        }

        $latest = $this->releases->latest();
        if ($latest === null) {
            $output->writeln('No answer; keeping what was noted.', OutputInterface::VERBOSITY_VERBOSE);

            return Command::SUCCESS;
        }

        $this->files->write($file, $latest . "\n");
        $output->writeln($latest, OutputInterface::VERBOSITY_VERBOSE);

        return Command::SUCCESS;
    }

    /** Its age is the file's own, which is why nothing writes a time into it. */
    private function fresh(string $file): bool
    {
        $written = @filemtime($file);

        return $written !== false && time() - $written < self::FRESH_FOR;
    }
}
