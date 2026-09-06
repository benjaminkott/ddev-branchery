<?php

declare(strict_types=1);

namespace App\Command;

use App\Config\Recipe;
use App\Config\Recipes;
use App\ManagedFiles;
use App\Project;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * The file a project starts from. Nothing is detected, so a project that has
 * written nothing gets worktrees that are a checkout and an address; this
 * prints the one line most projects need, and with `--write` puts it where it
 * belongs.
 */
#[AsCommand(name: 'config:example', description: 'Print the configuration a project starts from')]
final class ExampleCommand extends Command
{
    public function __construct(
        private readonly Recipes $recipes,
        private readonly Project $project,
        private readonly ManagedFiles $files,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('profile', null, InputOption::VALUE_REQUIRED, 'Which shipped configuration to build on')
            ->addOption('full', null, InputOption::VALUE_NONE, 'Print the shipped configuration itself, to copy out of')
            ->addOption('write', null, InputOption::VALUE_NONE, 'Write it into the project rather than printing it');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $names = $this->recipes->names();
        $named = $input->getOption('profile');
        $name = is_string($named) && $named !== '' ? $named : null;

        if ($name !== null && !in_array($name, $names, true)) {
            $output->writeln(sprintf('<error>There is no shipped configuration called "%s". There is %s.</error>', $name, implode(', ', $names)));

            return Command::FAILURE;
        }

        if ($input->getOption('full') === true) {
            if ($name === null) {
                $output->writeln(sprintf('<error>Say which one: --profile=%s</error>', implode('|', $names)));

                return Command::FAILURE;
            }
            $output->write($this->recipes->shippedFile($name));

            return Command::SUCCESS;
        }

        $example = $this->example($name, $names);

        if ($input->getOption('write') !== true) {
            $output->write($example);

            return Command::SUCCESS;
        }

        $file = $this->project->root() . '/' . Recipe::FILE;
        if (is_file($file)) {
            // Never over what is there: this file is written by hand.
            $output->writeln(sprintf('<error>%s is already there. Read it, or print this with --write left out.</error>', Recipe::FILE));

            return Command::FAILURE;
        }
        $this->files->write($file, $example);
        $output->writeln(sprintf('<fg=green;options=bold>✓</> %s written. Build a worktree again to see it take effect.', Recipe::FILE));

        return Command::SUCCESS;
    }

    /**
     * @param list<string> $names
     */
    private function example(?string $name, array $names): string
    {
        if ($name === null) {
            return sprintf(
                "# How this project's worktrees are built. Without this file a\n"
                . "# worktree is a checkout at an address of its own, and nothing else.\n"
                . "#\n"
                . "# Name one of the shipped configurations to start from -- %s --\n"
                . "# and write below it whatever this project does differently.\n"
                . "#\n"
                . "# profile: %s\n",
                implode(', ', $names),
                $names[0] ?? 'composer',
            );
        }

        return sprintf(
            "# How this project's worktrees are built.\n"
            . "#\n"
            . "# What \"%1\$s\" does is a file in the image, in this same grammar:\n"
            . "#   ddev branchery config:example --profile=%1\$s --full\n"
            . "# Everything written here stands over it. In a moment, \"profile\" is\n"
            . "# where that file does its own work; left out, the moment is what\n"
            . "# stands here and no more.\n"
            . "profile: %1\$s\n"
            . "\n"
            . "# docroot: .build/public   # what is served, where it is not %2\$s\n"
            . "# bin: .build/bin          # where this project's binaries are\n"
            . "# install:\n"
            . "#   - profile\n"
            . "#   - npm ci\n",
            $name,
            // What the shipped file serves from, said in its own words: the checkout
            // itself where it says so, its public directory where it says nothing.
            $this->recipes->shipped($name)->docroot === '' ? 'the checkout itself' : ($this->recipes->shipped($name)->docroot ?? 'public'),
        );
    }
}
