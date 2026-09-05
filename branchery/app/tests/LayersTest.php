<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;

/**
 * That no two of this application's namespaces need each other.
 *
 * The directories under src/ are meant to say what a thing is, and a directory
 * only says something as long as it can be read on its own: where App\Config
 * needs App\Worktree and App\Worktree needs App\Config back, neither name
 * describes anything and the pair is one lump with two labels on it. That is
 * what "Service" had become -- forty classes and a name that had stopped
 * meaning anything -- and nothing said so, because a cycle between namespaces
 * is invisible to the compiler, to the analyser and to every other test here.
 *
 * The rule is derived rather than written down: no list of layers to keep in
 * step with the code, only the demand that the graph the code already draws has
 * no way back to where it started.
 */
final class LayersTest extends TestCase
{
    public function testNoNamespaceNeedsOneThatNeedsItBack(): void
    {
        $needs = self::graph();

        $cycles = [];
        foreach (array_keys($needs) as $start) {
            $path = self::wayBack($start, $start, $needs, []);
            if ($path !== null) {
                // One reading of a cycle is enough: every namespace on it would
                // otherwise report the same loop from its own starting point.
                $set = $path;
                sort($set);
                $cycles[implode('|', array_unique($set))] = implode(' -> ', $path);
            }
        }

        $found = array_values($cycles);
        self::assertSame([], $found, "\n  " . implode("\n  ", $found) . "\n");
    }

    /**
     * Which namespace names which, out of the imports -- the one place a file
     * says where something it uses comes from.
     *
     * @return array<string, list<string>>
     */
    private static function graph(): array
    {
        $needs = [];
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator(\dirname(__DIR__) . '/src'));
        foreach ($files as $file) {
            if (!$file instanceof \SplFileInfo || $file->getExtension() !== 'php') {
                continue;
            }
            $source = (string) file_get_contents($file->getPathname());
            if (preg_match('/^namespace ([^;]+);/m', $source, $where) !== 1) {
                continue;
            }
            $from = $where[1];
            $needs[$from] ??= [];
            preg_match_all('/^use (App(?:\\\\[A-Za-z]+)*)\\\\[A-Za-z]+;$/m', $source, $imports);
            foreach ($imports[1] as $to) {
                if ($to !== $from && !in_array($to, $needs[$from], true)) {
                    $needs[$from][] = $to;
                }
            }
        }
        ksort($needs);

        return $needs;
    }

    /**
     * The way from one namespace back to another, or null where there is none.
     * Written out as the path it took, because "there is a cycle" leaves whoever
     * reads the failure to find it themselves.
     *
     * @param array<string, list<string>> $needs
     * @param list<string>                $walked
     *
     * @return ?list<string>
     */
    private static function wayBack(string $at, string $home, array $needs, array $walked): ?array
    {
        foreach ($needs[$at] ?? [] as $next) {
            if ($next === $home) {
                return [...$walked, $at, $home];
            }
            if (in_array($next, $walked, true)) {
                continue;
            }
            $further = self::wayBack($next, $home, $needs, [...$walked, $at]);
            if ($further !== null) {
                return $further;
            }
        }

        return null;
    }
}
