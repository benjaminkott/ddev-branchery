<?php

declare(strict_types=1);

namespace App\Tests\Contract;

/**
 * Whether an answer is the shape api-answers.json says it is.
 *
 * The twin of dev/shape.mjs, which reads the same file and says the same things
 * about the mock's answers. Two readers rather than one because there is no
 * language both halves are written in -- but one source, which is the point.
 */
final class Shape
{
    /**
     * Every way the value is not what the type says, as sentences. An empty list
     * is an answer of the right shape.
     *
     * @param array<string, array<string, string>> $shapes
     * @param array<string, true>                  $seen   the shapes actually walked, so a
     *                                                     caller can tell one that was
     *                                                     checked from one that was only
     *                                                     written down -- an empty list
     *                                                     checks nothing, silently
     *
     * @return list<string>
     */
    public static function mismatches(mixed $value, string $type, array $shapes, string $where, array &$seen): array
    {
        if (str_starts_with($type, '?')) {
            return $value === null ? [] : self::mismatches($value, substr($type, 1), $shapes, $where, $seen);
        }

        if (str_starts_with($type, '[') && str_ends_with($type, ']')) {
            if (!\is_array($value) || !array_is_list($value)) {
                return [sprintf('%s is %s where a list of %s was expected', $where, self::nameOf($value), substr($type, 1, -1))];
            }

            $found = [];
            foreach ($value as $at => $entry) {
                $found = [...$found, ...self::mismatches($entry, substr($type, 1, -1), $shapes, sprintf('%s[%d]', $where, $at), $seen)];
            }

            return $found;
        }

        if (str_starts_with($type, '@')) {
            return self::object($value, substr($type, 1), $shapes, $where, $seen);
        }

        return self::primitive($value, $type, $where);
    }

    /**
     * @param array<string, array<string, string>> $shapes
     * @param array<string, true>                  $seen
     *
     * @return list<string>
     */
    private static function object(mixed $value, string $name, array $shapes, string $where, array &$seen): array
    {
        $fields = $shapes[$name] ?? null;
        if ($fields === null) {
            return [sprintf('%s is said to be "%s", which is not one of the shapes', $where, $name)];
        }
        if (!\is_array($value) || array_is_list($value)) {
            return [sprintf('%s is %s where %s was expected', $where, self::nameOf($value), $name)];
        }
        $seen[$name] = true;

        $found = [];
        foreach ($fields as $field => $type) {
            if (!array_key_exists($field, $value)) {
                $found[] = sprintf('%s.%s is missing; %s has it', $where, $field, $name);

                continue;
            }
            $found = [...$found, ...self::mismatches($value[$field], $type, $shapes, $where . '.' . $field, $seen)];
        }
        // The other way round as well: an answer carrying more than the shape says
        // is what makes an interface written against a mock work against a lie.
        foreach (array_keys($value) as $field) {
            if (!isset($fields[$field])) {
                $found[] = sprintf('%s.%s is not part of %s', $where, (string) $field, $name);
            }
        }

        return $found;
    }

    /** @return list<string> */
    private static function primitive(mixed $value, string $type, string $where): array
    {
        $holds = match ($type) {
            'string' => \is_string($value),
            'int' => \is_int($value),
            'bool' => \is_bool($value),
            'mixed' => true,
            default => null,
        };

        if ($holds === null) {
            return [sprintf('%s is said to be "%s", which is not a type', $where, $type)];
        }

        return $holds ? [] : [sprintf('%s is %s where %s was expected', $where, self::nameOf($value), $type)];
    }

    private static function nameOf(mixed $value): string
    {
        if ($value === null) {
            return 'null';
        }
        if (\is_array($value)) {
            return array_is_list($value) ? 'a list' : 'an object';
        }

        return get_debug_type($value);
    }
}
