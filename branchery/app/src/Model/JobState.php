<?php

declare(strict_types=1);

namespace App\Model;

final readonly class JobState implements \JsonSerializable
{
    /**
     * @param ?array{no: int, total: int, label: string}                                       $step  the one being worked on
     * @param list<array{no: int, label: string, output: string, state: string, seconds: int}> $steps every one that has begun
     */
    public function __construct(
        public string $id,
        public string $status,
        /** The worktree it is about, empty where it is about none. */
        public string $subject,
        /** The console command it runs. */
        public string $command,
        public ?array $step,
        public array $steps,
        public int $elapsed,
        public string $log,
        /**
         * It did not end; it stopped. A failure normally says why in the last
         * line the tools wrote; this one has nothing to say -- the process is
         * gone without an exit code and the log breaks off mid-sentence, so the
         * reader sees a step marked failed above output that looks fine.
         */
        public bool $interrupted = false,
    ) {
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'subject' => $this->subject,
            'command' => $this->command,
            'step' => $this->step,
            'steps' => $this->steps,
            'elapsed' => $this->elapsed,
            'log' => $this->log,
            'interrupted' => $this->interrupted,
        ];
    }
}
