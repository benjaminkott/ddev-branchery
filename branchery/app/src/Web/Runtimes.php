<?php

declare(strict_types=1);

namespace App\Web;

/**
 * What the web container runs on: the PHP it serves with, the FPM pools beside
 * it, the Node it has. None is about any worktree, all three are asked for on
 * every look, and they were three container calls.
 *
 * Through a shell, and not only for tidiness: Node comes from `n`, under
 * /usr/local/n/bin, which is on the shell's path and not on the one a command
 * handed to the container directly is looked for on.
 *
 * Remembered no longer than this process runs: the container is rebuilt under
 * a page that stands open.
 */
final class Runtimes
{
    /** @var ?array{php: string, pools: list<string>, node: ?string} */
    private ?array $read = null;

    public function __construct(private readonly WebContainer $web)
    {
    }

    /** The version the project itself is served with. */
    public function php(): string
    {
        return $this->all()['php'];
    }

    /**
     * The versions an FPM pool can be put up for, lowest first.
     *
     * @return list<string>
     */
    public function phpPools(): array
    {
        return $this->all()['pools'];
    }

    /** What the container's own Node is, or null where it has none. */
    public function node(): ?string
    {
        return $this->all()['node'];
    }

    /** @return array{php: string, pools: list<string>, node: ?string} */
    private function all(): array
    {
        // Each answer says which of the three it is, so a container with no Node
        // simply says nothing about one rather than leaving a line to be counted.
        $script = <<<'SH'
            php -r 'printf("php %d.%d\n", PHP_MAJOR_VERSION, PHP_MINOR_VERSION);' 2>/dev/null
            ls /usr/sbin/php-fpm* 2>/dev/null | grep -oE '[0-9]+\.[0-9]+' | sort -V -u | sed 's/^/pool /'
            node -v 2>/dev/null | sed 's/^v//; s/^/node /'
            true
            SH;

        return $this->read ??= self::readingOf($this->web->run(['bash', '-c', $script])->output);
    }

    /**
     * Apart from the call that asks, because the shell is the one part of this that
     * cannot be looked at without a project.
     *
     * @return array{php: string, pools: list<string>, node: ?string}
     */
    public static function readingOf(string $output): array
    {
        $php = '';
        $pools = [];
        $node = null;
        foreach (explode("\n", $output) as $line) {
            [$what, $said] = array_pad(explode(' ', trim($line), 2), 2, '');
            $said = trim((string) $said);
            if ($said === '') {
                continue;
            }
            if ($what === 'php') {
                $php = $said;
            } elseif ($what === 'pool') {
                $pools[] = $said;
            } elseif ($what === 'node') {
                $node = $said;
            }
        }

        return ['php' => $php, 'pools' => $pools, 'node' => $node];
    }
}
