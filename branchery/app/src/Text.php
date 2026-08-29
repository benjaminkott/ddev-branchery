<?php

declare(strict_types=1);

namespace App;

/** The small things that read badly when they are got wrong. */
final class Text
{
    /**
     * Text order puts "10.4" above "9.5", and the branches of this world are
     * versions and ticket numbers.
     *
     * @param list<string> $names
     *
     * @return list<string>
     */
    public static function inReadingOrder(array $names): array
    {
        usort($names, static fn (string $a, string $b): int => strnatcasecmp($a, $b));

        return $names;
    }

    /**
     * A count with the thing it counts, in the right number. The plural is passed
     * where English does not make it by adding an s.
     */
    public static function count(int $amount, string $singular, ?string $plural = null): string
    {
        return $amount . ' ' . ($amount === 1 ? $singular : $plural ?? $singular . 's');
    }
}
