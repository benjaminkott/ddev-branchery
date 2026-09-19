<?php

declare(strict_types=1);

namespace App\Command;

use App\Worktree\PhpVersions;
use App\Worktree\Surroundings;
use App\Worktree\Worktrees;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Links every worktree under each of its addresses again.
 *
 * Hidden, because there is nothing here to run by hand: a build links the
 * worktree it makes. The one caller is the container as it starts, for the
 * addresses a worktree gained since it was built -- a hostname the project asked
 * DDEV for afterwards is one every worktree answers at from the next start on,
 * and what "ddev describe" lists a moment later has to be served.
 */
#[AsCommand(name: 'worktree:link', description: 'Link every worktree under each of its addresses', hidden: true)]
final class LinkCommand extends Command
{
    public function __construct(
        private readonly Worktrees $worktrees,
        private readonly Surroundings $surroundings,
        private readonly PhpVersions $php,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        foreach ($this->worktrees->names() as $name) {
            $this->surroundings->linkDocroot($name, (string) ($this->worktrees->metadata($name)['docroot'] ?? ''));
        }
        // The pools are written per link, and the web container writes its own at
        // its start, which may have come before the links above. Not a failure
        // where it cannot be asked yet: the next start finds the links in place.
        try {
            $this->php->apply();
        } catch (\RuntimeException) {
        }

        return Command::SUCCESS;
    }
}
