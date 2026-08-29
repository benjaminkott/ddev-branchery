<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\DescribeInfo;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Writes the worktrees into what "ddev describe" shows.
 *
 * Hidden, because there is nothing here to run by hand: every change refreshes
 * the block by itself. The one caller is the container as it starts -- DDEV
 * renders the compose files just before that and the block has to be put back.
 */
#[AsCommand(name: 'ddev:describe', description: 'Refresh what "ddev describe" shows', hidden: true)]
final class DescribeCommand extends Command
{
    public function __construct(private readonly DescribeInfo $describe)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->describe->refresh();

        return Command::SUCCESS;
    }
}
