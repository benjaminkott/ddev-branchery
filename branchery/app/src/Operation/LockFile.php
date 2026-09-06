<?php

declare(strict_types=1);

namespace App\Operation;

/**
 * What a lock file lacks of what the composer.json beside it requires.
 *
 * `composer install` refuses such a lock file -- rightly -- but it refuses at
 * the step that installs, after the branch is cut and the files are carried
 * over. This is the same question, asked of the two files before anything
 * exists, so the answer can be said while it still costs nothing.
 *
 * Only the first of composer's questions: whether the package is in the lock at
 * all, under its own name or through one that replaces or provides it. Whether
 * the locked version satisfies the constraint is composer's own arithmetic.
 */
final class LockFile
{
    /**
     * What composer answers for itself and never expects a lock file to have: the
     * interpreter, its extensions and libraries, and composer's own APIs. The
     * pattern is composer's.
     */
    private const string PLATFORM = '{^(?:php(?:-64bit|-ipv6|-zts|-debug)?|hhvm|(?:ext|lib)-[a-z0-9](?:[_.-]?[a-z0-9]+)*|composer(?:-(?:plugin|runtime)-api)?)$}iD';

    /**
     * Two files that cannot be read as JSON are not this class's to complain about:
     * composer says what is wrong with them, and says it better.
     *
     * @param bool $withDev whether the development requirements count -- they do
     *                      unless the install line says "--no-dev"
     *
     * @return list<string>
     */
    public static function missing(string $composerJson, string $composerLock, bool $withDev = true): array
    {
        $manifest = json_decode($composerJson, true);
        $lock = json_decode($composerLock, true);
        if (!is_array($manifest) || !is_array($lock)) {
            return [];
        }

        $locked = [];
        $packages = [...self::packages($lock['packages'] ?? null), ...self::packages($lock['packages-dev'] ?? null)];
        foreach ($packages as $package) {
            $names = [$package['name'] ?? null];
            foreach (['replace', 'provide'] as $key) {
                if (is_array($package[$key] ?? null)) {
                    $names = [...$names, ...array_keys($package[$key])];
                }
            }
            foreach ($names as $name) {
                if (is_string($name)) {
                    $locked[strtolower($name)] = true;
                }
            }
        }

        $missing = [];
        foreach ($withDev ? ['require', 'require-dev'] : ['require'] as $section) {
            if (!is_array($manifest[$section] ?? null)) {
                continue;
            }
            foreach (array_keys($manifest[$section]) as $name) {
                $name = (string) $name;
                if (preg_match(self::PLATFORM, $name) === 1 || isset($locked[strtolower($name)])) {
                    continue;
                }
                $missing[] = $name;
            }
        }

        return array_values(array_unique($missing));
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function packages(mixed $section): array
    {
        if (!is_array($section)) {
            return [];
        }

        return array_values(array_filter($section, 'is_array'));
    }
}
