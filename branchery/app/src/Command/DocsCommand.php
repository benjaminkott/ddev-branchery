<?php

declare(strict_types=1);

namespace App\Command;

use App\Docs;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * What is written about this add-on, from the command line: the way to pages
 * that travel in the image, where the manual was otherwise found by nobody.
 * Printed as written, which is reStructuredText and reads as text.
 */
#[AsCommand('docs', 'Read the documentation: the pages there are, or one of them')]
final class DocsCommand extends Command
{
    public function __construct(private readonly Docs $docs)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('page', InputArgument::OPTIONAL, 'Which page; without one, the list of them');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $page = $input->getArgument('page');
        if (!is_string($page) || $page === '') {
            foreach ($this->docs->pages() as $entry) {
                // Wide enough for the longest slug there is: a page carries the
                // section it stands in, and a column that does not fit turns the
                // list into two ragged ones.
                $output->writeln(sprintf('  <options=bold>%-30s</> %s', $entry['slug'], $entry['title']));
            }
            $output->writeln('');
            $output->writeln('  "ddev branchery docs <page>" prints one of them -- the name alone will do.');

            return Command::SUCCESS;
        }

        $source = $this->docs->source($page);
        if ($source === null) {
            $output->writeln(sprintf('<fg=red;options=bold>✗</> <fg=red>There is no page called "%s". "ddev branchery docs" lists them.</>', $page));

            return Command::FAILURE;
        }
        // As written, and not through the console's formatter: a manual is full of
        // angle brackets that mean what they say.
        $output->writeln($source, OutputInterface::OUTPUT_RAW);

        return Command::SUCCESS;
    }
}
