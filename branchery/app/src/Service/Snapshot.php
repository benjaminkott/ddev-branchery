<?php

declare(strict_types=1);

namespace App\Service;

use App\Http\Response;

/**
 * The answer the whole page is drawn from, kept for a moment.
 *
 * Reading it is five process starts in the web container, and the page asks for
 * it every two seconds while an operation runs -- with a second tab open, and
 * the operation's own question once a second beside it, four PHP workers are
 * a queue. Two questions asked within the same moment now cost one answer.
 *
 * A moment, and not longer, because git moves without anything here being told:
 * a developer commits in a terminal. What this application does itself needs no
 * waiting at all -- every operation writes a file under jobs/, and a mark taken
 * from those is what makes the end of one visible in the next answer rather
 * than a second later.
 */
final readonly class Snapshot
{
    /** How long an answer may be handed out again, at the outside. */
    private const int FRESH_FOR = 1;

    public function __construct(
        private Project $project,
        private ManagedFiles $files,
    ) {
    }

    /** @param callable(): Response $make */
    public function of(callable $make): Response
    {
        $mark = $this->mark();
        $file = $this->file();

        $kept = json_decode((string) @file_get_contents($file), true);
        if (
            \is_array($kept)
            && ($kept['mark'] ?? null) === $mark
            && \is_string($kept['body'] ?? null)
            && time() - (int) ($kept['at'] ?? 0) < self::FRESH_FOR
        ) {
            return Response::kept($kept['body']);
        }

        $answer = $make();
        // Only an answer worth keeping: an error is a moment's trouble, and one
        // handed out again for a second is a moment's trouble twice.
        if ($answer->status === 200) {
            $this->files->write($file, (string) json_encode([
                'mark' => $mark,
                'at' => time(),
                'body' => $answer->body,
            ], JSON_INVALID_UTF8_SUBSTITUTE));
        }

        return $answer;
    }

    /**
     * What says the project has moved since. The operations are the whole of it:
     * they are what this application changes anything through, and each of them
     * writes its status as it starts and as it ends.
     */
    private function mark(): string
    {
        $marks = [];
        foreach (glob($this->project->jobsDirectory() . '/*.status') ?: [] as $status) {
            $marks[] = basename($status) . ':' . (int) @filemtime($status);
        }
        // And which worktrees there are, for the one change that is a directory
        // and not an operation: a removal that got as far as the checkout.
        foreach (glob($this->project->worktreesDirectory() . '/*', GLOB_ONLYDIR) ?: [] as $directory) {
            $marks[] = basename($directory);
        }

        return md5(implode("\n", $marks));
    }

    private function file(): string
    {
        $directory = $this->project->stateDirectory() . '/cache';
        $this->files->ensureIgnoredDirectory($this->project->stateDirectory());
        $this->files->ensureDirectory($directory);

        return $directory . '/state.json';
    }
}
