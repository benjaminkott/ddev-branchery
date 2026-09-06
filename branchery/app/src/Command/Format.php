<?php

declare(strict_types=1);

namespace App\Command;

use Symfony\Component\Console\Input\InputInterface;

/**
 * How a command that answers a question writes its answer. A program that had
 * only the table to read parsed it, which breaks the day a column is added. The
 * shape of the JSON is the one the API answers with.
 */
final class Format
{
    public const string TABLE = 'table';
    public const string JSON = 'json';

    /** The format asked for, and a refusal for one this does not write. */
    public static function of(InputInterface $input): string
    {
        $format = strtolower(trim((string) $input->getOption('format')));
        if (!in_array($format, [self::TABLE, self::JSON], true)) {
            throw new \InvalidArgumentException(sprintf('"%s" is not a format this writes: table or json.', $format));
        }

        return $format;
    }

    /** One document, pretty enough to read and strict enough to parse. */
    public static function json(mixed $value): string
    {
        return (string) json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }
}
