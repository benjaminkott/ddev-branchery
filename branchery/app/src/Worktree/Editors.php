<?php

declare(strict_types=1);

namespace App\Worktree;

use App\Config\Build;
use App\Project;

/**
 * What opens a worktree on the machine the page is read on, as addresses the
 * page can lead to.
 *
 * Two questions, and neither is answered by guessing. Which editors are there
 * is read off the marks they leave in the project's own checkout -- an editor
 * that has opened this project has written into it, and one that never has is
 * not offered. What their address looks like is a template, and a template
 * whose placeholders cannot all be filled is not an address on this machine: it
 * is why the WSL form of an address falls away on a Linux host without anything
 * here asking which host it is.
 *
 * A project that writes "editors:" has said what it offers, and then nothing is
 * looked for at all -- saying so is the evidence. That is also the way to an
 * editor this file has never heard of.
 */
final readonly class Editors
{
    /**
     * The mark each one leaves in a checkout it has been opened in, and the
     * addresses that open one -- the first whose placeholders are all filled.
     *
     * Both marks are directories the editor writes into the project itself, which
     * is what makes them readable from here at all. The worktrees are no evidence:
     * Branchery writes .vscode into every one of them -- see Surroundings.
     *
     * @var array<string, array{mark: string, open: list<string>}>
     */
    private const KNOWN = [
        'VS Code' => [
            'mark' => '.vscode',
            'open' => ['vscode://vscode-remote/wsl+{distribution}{path}', 'vscode://file{path}'],
        ],
        'PhpStorm' => [
            'mark' => '.idea',
            // Running on Windows it reaches a distribution's files under their UNC
            // path and nothing else; running beside the checkout it wants the path.
            'open' => ['phpstorm://open?file={windows}', 'phpstorm://open?file={path}'],
        ],
    ];

    public function __construct(
        private Project $project,
        /**
         * The WSL distribution the project lies in, where it lies in one. Nothing
         * in here can read it -- a container on WSL sees the same kernel as every
         * other and no distribution at all -- so the host says so through the
         * compose file, and everywhere else it is empty.
         */
        private string $distribution,
    ) {
    }

    /**
     * @return list<array{name: string, url: string}>
     */
    public function of(string $hostPath, Build $build): array
    {
        $offered = [];
        foreach ($this->wanted($build) as $name => $addresses) {
            $url = $this->firstFilled($addresses, $hostPath);
            if ($url !== null) {
                $offered[] = ['name' => $name, 'url' => $url];
            }
        }

        return $offered;
    }

    /**
     * What the project said, or -- where it said nothing -- the known ones this
     * checkout carries the mark of.
     *
     * @return array<string, list<string>>
     */
    private function wanted(Build $build): array
    {
        $said = $build->editors();
        if ($said !== null) {
            $wanted = [];
            foreach ($said as $editor) {
                $wanted[$editor['name']] = [$editor['open']];
            }

            return $wanted;
        }

        $wanted = [];
        foreach (self::KNOWN as $name => $editor) {
            if (is_dir($this->project->root() . '/' . $editor['mark'])) {
                $wanted[$name] = $editor['open'];
            }
        }

        return $wanted;
    }

    /**
     * The first address every placeholder of which has something to stand for.
     * Null where none has: an editor whose only address needs a distribution is
     * one this machine cannot reach.
     *
     * @param list<string> $addresses
     */
    private function firstFilled(array $addresses, string $hostPath): ?string
    {
        $values = $this->values($hostPath);
        foreach ($addresses as $address) {
            $filled = strtr($address, $values);
            // An address is a whole address or it is nothing: half of one -- the
            // scheme with the path missing out of the middle -- opens something else
            // or opens nothing, and both are worse than no button.
            if (!str_contains($filled, '{') && !in_array('', self::used($address, $values), true)) {
                return $filled;
            }
        }

        return null;
    }

    /**
     * @return array<string, string>
     */
    private function values(string $hostPath): array
    {
        return [
            '{path}' => $hostPath,
            '{distribution}' => $this->distribution,
            // What Windows calls the same directory, which is the only name a program
            // outside the distribution can open it by.
            '{windows}' => $this->distribution === ''
                ? ''
                : '\\\\wsl$\\' . $this->distribution . str_replace('/', '\\', $hostPath),
        ];
    }

    /**
     * The values the address actually asked for, so that an empty one is only in
     * the way of an address that names it.
     *
     * @param array<string, string> $values
     *
     * @return list<string>
     */
    private static function used(string $address, array $values): array
    {
        $asked = [];
        foreach ($values as $placeholder => $value) {
            if (str_contains($address, $placeholder)) {
                $asked[] = $value;
            }
        }

        return $asked;
    }
}
