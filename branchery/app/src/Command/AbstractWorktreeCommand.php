<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\Project;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;

/**
 * A command about one worktree, named by its first argument: the worktree the
 * operation is done to, and so the row it is marked on and the history it lands in.
 */
abstract class AbstractWorktreeCommand extends AbstractJobCommand
{
    protected function configure(): void
    {
        parent::configure();
        $this->addArgument('name', InputArgument::REQUIRED, 'Worktree');
    }

    final protected function subject(InputInterface $input): string
    {
        // As it was typed: this only says which row and which history the record
        // belongs to, and a name the operation is about to refuse still has a
        // record of the refusal.
        return (string) $input->getArgument('name');
    }

    /**
     * Checked here, inside the operation, so the refusal is reported the way every
     * other failure is.
     */
    protected function name(InputInterface $input): string
    {
        return Project::assertName((string) $input->getArgument('name'));
    }
}
