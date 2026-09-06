<?php

declare(strict_types=1);

namespace App\Git;

use App\CommandResult;
use App\Jobs\StepReporter;
use App\Text;
use App\Web\WebContainer;

/**
 * Whether the developer's own keys reached the containers. Nothing here has a
 * key of its own; the way in is "ddev auth ssh" on the host. Nothing says so
 * when it has not been done -- git answers "Permission denied (publickey)",
 * which reads like a repository somebody has no access to.
 */
final class SshAgent
{
    private ?CommandResult $listed = null;

    public function __construct(
        private readonly WebContainer $web,
        private readonly Git $git,
    ) {
    }

    /**
     * A remote's refusal, in words somebody can act on. Over ssh it is far more
     * often the container's missing key than anything about the repository, and git
     * has one sentence for either -- what the agent holds settles it, and an agent
     * that is full saves running "ddev auth ssh" again for nothing.
     *
     * Where it is the key, the sentence goes first, because the interface lifts the
     * first line out of the log as the reason. Here rather than in the one command
     * that fetches on purpose: every catch-up fetches first.
     */
    public function explain(string $remote, string $said, StepReporter $reporter): string
    {
        // What git said is in the log already, line by line; the reason names the
        // cause where one is known and otherwise points at those lines. Quoted
        // whole, a refused fetch stood twice in the log.
        $failed = sprintf('Fetching from %s failed. What git wrote is above.', $remote);
        if (!$this->git->reachesOverSsh($remote) || $said === '') {
            return $failed;
        }

        if (!$this->holdsKeys()) {
            return $this->advice();
        }

        $reporter->note($this->advice());

        return $failed;
    }

    /** Whether a key of the developer's is within reach of the containers. */
    public function holdsKeys(): bool
    {
        return $this->listed()->isSuccessful();
    }

    /**
     * Worth a line either way: an empty agent names the cause, and a full one takes
     * it off the table -- without that, the answer to a refused fetch is to run
     * "ddev auth ssh" again and watch it be refused the same way.
     */
    public function advice(): string
    {
        if (!$this->holdsKeys()) {
            return 'No key of yours is in the ssh agent: run "ddev auth ssh" on the host, then try again.';
        }

        return sprintf(
            '"ddev auth ssh" has been run -- the agent holds %s, and the remote refused all the same. Then it is not the key that is missing.',
            Text::count(count($this->listed()->lines()), 'key'),
        );
    }

    /**
     * Asked once, the answer being wanted twice and every question put to the web
     * container a process start.
     *
     * ssh-add answers 1 for an agent it reached and found empty and 2 for one it
     * could not reach. The difference is nothing the developer can act on: both
     * mean no key of theirs is in reach, and both are undone by the same command.
     */
    private function listed(): CommandResult
    {
        return $this->listed ??= $this->web->run(['ssh-add', '-l']);
    }
}
