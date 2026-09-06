<?php

declare(strict_types=1);

namespace App\Command;

use App\Git\Git;
use App\Git\SshAgent;
use App\Jobs\JobRunner;
use App\Jobs\StepReporter;
use App\Web\WebContainer;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand('git:fetch', 'Fetch what a remote has gained')]
final class FetchCommand extends AbstractJobCommand
{
    public function __construct(
        JobRunner $jobs,
        WebContainer $web,
        private readonly Git $git,
        private readonly SshAgent $ssh,
    ) {
        parent::__construct($jobs, $web);
    }

    protected function configure(): void
    {
        parent::configure();
        $this->addArgument('remote', InputArgument::OPTIONAL, 'Remote to fetch from; without one the repository\'s own');
    }

    protected function perform(InputInterface $input, OutputInterface $output, StepReporter $reporter): int
    {
        $remote = $input->getArgument('remote') !== null ? (string) $input->getArgument('remote') : $this->git->defaultRemote();
        if ($remote === null) {
            throw new \RuntimeException('The repository has no remote to fetch from.');
        }
        // Held to the names git itself lists, as the interface's door is: a typo
        // answered by git's own "does not appear to be a git repository" reads as a
        // repository that broke.
        if (!in_array($remote, $this->git->remotes(), true)) {
            throw new \RuntimeException(sprintf('There is no remote called "%s". The repository has %s.', $remote, implode(', ', $this->git->remotes())));
        }

        $reporter->expect(1);
        $reporter->step(sprintf('Update %s', $remote));
        $result = $this->git->fetch($remote);

        // git says everything about a fetch on the error channel: the remote it
        // contacted as much as the reason it could not.
        if (!$result->isSuccessful()) {
            throw new \RuntimeException($this->ssh->explain($remote, $result->message(), $reporter));
        }

        // A fetch that found nothing prints nothing at all, and in the log that
        // silence is indistinguishable from a failure.
        if ($result->message() === '') {
            $reporter->note(sprintf('%s is up to date.', $remote));
        }
        $reporter->finish();

        return Command::SUCCESS;
    }
}
