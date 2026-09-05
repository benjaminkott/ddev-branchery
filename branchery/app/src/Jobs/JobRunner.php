<?php

declare(strict_types=1);

namespace App\Jobs;

use App\ManagedFiles;
use App\Model\JobState;
use App\Project;

/**
 * Long-running operations. A composer install outlasts any sensible request
 * timeout, so it runs in the background and the interface reads the progress
 * from the log file. Several run beside each other, one per worktree.
 */
final readonly class JobRunner
{
    /**
     * How a step announces itself in the log. The seconds are optional: an
     * operation started before they were counted does not carry them.
     */
    private const string MARKER = '/^##STEP (\d+)\/(\d+) (?:\+(\d+)s )?(.*)$/';

    /**
     * How long an operation may go without saying which process it is. It writes
     * that as its first act, so anything beyond a moment means it never got to.
     */
    private const int WITHOUT_A_PROCESS_ID = 30;

    public function __construct(
        private Project $project,
        private ManagedFiles $files,
        private string $consoleBinary,
    ) {
    }

    /**
     * @param list<string> $arguments Arguments for bin/console
     * @param string       $subject   the worktree it is about, where it is about one
     */
    public function start(array $arguments, string $subject = ''): string
    {
        $id = $this->begin($arguments, $subject);
        $directory = $this->project->jobsDirectory();
        // The console of the running application. It lives in the image, not in the
        // project directory -- there is no vendor/ next to that copy.
        $command = sprintf(
            // Its own process id first of all: it is what tells an operation that
            // ended badly from one whose process is simply gone. Without it a
            // container restarted mid-build leaves a row saying "installing
            // dependencies" about nothing, for as long as the project stands.
            'echo $$ > %s; php %s %s --job=%s >> %s 2>&1; echo $? > %s',
            escapeshellarg($directory . '/' . $id . '.pid'),
            escapeshellarg($this->consoleBinary),
            implode(' ', array_map('escapeshellarg', $arguments)),
            escapeshellarg($id),
            escapeshellarg($directory . '/' . $id . '.log'),
            escapeshellarg($directory . '/' . $id . '.exit'),
        );

        // The operation keeps running in its own container, long after the request
        // has been answered.
        exec('setsid nohup bash -c ' . escapeshellarg($command) . ' > /dev/null 2>&1 &');

        return $id;
    }

    /**
     * Every operation writes down which process it is, whichever end started it,
     * because both ends can be interrupted. A job whose process is gone and which
     * left no exit code did not finish -- and is not running either.
     *
     * One whose id is not there yet is taken to be alive: the shell writes it as
     * its first act, so it was started a moment ago.
     */
    private function stillAlive(string $id): bool
    {
        $directory = $this->project->jobsDirectory();
        if (is_file($directory . '/' . $id . '.exit')) {
            return true;
        }

        $started = (int) @file_get_contents($directory . '/' . $id . '.started');
        $pid = (int) @file_get_contents($directory . '/' . $id . '.pid');
        if ($pid > 0) {
            return self::isWorking($pid, $started);
        }

        // No process id at all: either the shell has not written one yet, or this
        // operation is from before it was written down -- which every project has
        // one of after an update. A moment's grace tells them apart.
        return $started > 0 && time() - $started < self::WITHOUT_A_PROCESS_ID;
    }

    /**
     * Not merely whether the process is there: one that has exited and has not been
     * collected keeps its entry, and taking that for a running operation is how a
     * row says "installing dependencies" about a process that ended an hour ago.
     *
     * And not merely whether something is there: the container is restarted, its
     * numbers start over, and the id is handed to whatever starts next. A process
     * that began after the operation did is somebody else under the same number.
     */
    private static function isWorking(int $pid, int $started): bool
    {
        $status = @file_get_contents('/proc/' . $pid . '/stat');
        if ($status === false) {
            return false;
        }

        // "pid (name) state ...", and the name may hold spaces and brackets -- so
        // the fields are what follows the last one.
        $fields = preg_split('/\s+/', trim(substr($status, (int) strrpos($status, ')') + 1))) ?: [];
        if (($fields[0] ?? '') === 'Z') {
            return false;
        }

        $began = self::beganAt((int) ($fields[19] ?? 0));

        return $began === null || $started <= 0 || $began <= $started + self::WITHOUT_A_PROCESS_ID;
    }

    /**
     * When a process began, out of the ticks since boot. The kernel counts them in
     * hundredths of a second for everything under /proc, whatever the machine's clock.
     */
    private static function beganAt(int $ticks): ?int
    {
        if ($ticks <= 0 || preg_match('/^btime (\d+)$/m', (string) @file_get_contents('/proc/stat'), $boot) !== 1) {
            return null;
        }

        return (int) $boot[1] + intdiv($ticks, 100);
    }

    /**
     * The files that make an operation something the interface can find.
     *
     * @param list<string> $arguments
     */
    private function begin(array $arguments, string $subject): string
    {
        $id = date('Ymd-His') . '-' . bin2hex(random_bytes(3));
        $directory = $this->project->jobsDirectory();
        $this->files->ensureIgnoredDirectory($this->project->stateDirectory());
        $this->files->ensureDirectory($directory);

        $this->files->write($directory . '/' . $id . '.status', "running\n");
        // What was done, always: an operation about no worktree in particular is
        // still one the interface has to be able to name.
        $this->files->write($directory . '/' . $id . '.command', ($arguments[0] ?? '') . "\n");
        if ($subject !== '') {
            // Which worktree this was about. Without it a log is a file with a
            // timestamp for a name, with no way back to the worktree's history.
            $this->files->write($directory . '/' . $id . '.subject', $subject . "\n");
        }
        $this->files->write($directory . '/' . $id . '.started', time() . "\n");
        $this->files->write($directory . '/' . $id . '.log', '');
        // A new record is what makes an old one one too many, so this is where
        // the old ones go -- no timer, nothing to run by hand.
        $this->tidy();

        return $id;
    }

    /**
     * How many operations are kept a full record of, per worktree and for those
     * about none. A history is worth having and a history nobody will read to the
     * end is worth less than the disk it grows on: a composer install writes
     * hundreds of kilobytes into its log, and until this there was nothing that
     * ever took one away from a worktree that goes on existing.
     */
    private const int KEPT = 25;

    /**
     * The oldest records past what is kept, by what they were about.
     *
     * Grouped rather than counted as one heap, so a worktree built twice a day
     * cannot push another's history out; and the operations about no worktree --
     * a fetch -- are a group of their own, which is what they had instead of
     * anything at all. forget() cannot reach them: they write no subject, and it
     * is a subject it looks them up by.
     *
     * Nothing running is touched, whatever its age. The ids carry the time they
     * were started, so they sort themselves.
     */
    private function tidy(): void
    {
        $directory = $this->project->jobsDirectory();

        $ids = [];
        foreach (glob($directory . '/*.status') ?: [] as $file) {
            $ids[] = basename($file, '.status');
        }
        sort($ids);

        $seen = [];
        foreach (array_reverse($ids) as $id) {
            $subject = trim((string) @file_get_contents($directory . '/' . $id . '.subject'));
            $seen[$subject] = ($seen[$subject] ?? 0) + 1;
            if ($seen[$subject] <= self::KEPT || $this->outcome($id)['status'] === 'running') {
                continue;
            }
            $this->files->remove(...(glob($directory . '/' . $id . '.*') ?: []));
        }
    }

    /**
     * A record for an operation already running here, so a provisioning started in
     * a terminal is not invisible to the list and missing from the worktree's
     * history afterwards. It writes the same files an operation started from the
     * interface writes.
     *
     * @param list<string> $arguments
     */
    public function adopt(array $arguments, string $subject = ''): string
    {
        $id = $this->begin($arguments, $subject);
        $this->files->write($this->project->jobsDirectory() . '/' . $id . '.pid', getmypid() . "\n");

        return $id;
    }

    /** One line of an adopted operation, as it is written. */
    public function append(string $id, string $line): void
    {
        $file = $this->project->jobsDirectory() . '/' . self::safe($id) . '.log';
        // Appended rather than written: the background operations redirect their
        // output into this same file, and reading it whole would lose whatever
        // arrived in between.
        @file_put_contents($file, $line . "\n", FILE_APPEND);
    }

    public function finish(string $id, bool $successful): void
    {
        $this->files->write(
            $this->project->jobsDirectory() . '/' . self::safe($id) . '.status',
            ($successful ? 'done' : 'failed') . "\n",
        );
    }

    /**
     * How an operation stands, without reading a word it wrote. A composer install
     * writes hundreds of kilobytes into that file, and the page asks for everything
     * running every couple of seconds.
     *
     * @return array{status: string, interrupted: bool, started: int, elapsed: int}
     */
    private function outcome(string $id): array
    {
        $directory = $this->project->jobsDirectory();

        $status = trim((string) @file_get_contents($directory . '/' . $id . '.status')) ?: 'unknown';
        $started = (int) @file_get_contents($directory . '/' . $id . '.started');

        // If the operation dies hard the status is stuck on "running"; the file
        // holding the exit code decides then.
        if ($status === 'running' && is_file($directory . '/' . $id . '.exit')) {
            $status = trim((string) file_get_contents($directory . '/' . $id . '.exit')) === '0' ? 'done' : 'failed';
        }
        // And without an exit code the process itself is asked: one that is gone
        // without having written one was killed, and saying it is still working is
        // the one answer that is certainly wrong.
        $interrupted = false;
        if ($status === 'running' && !$this->stillAlive($id)) {
            $status = 'failed';
            $interrupted = true;
        }

        // An operation that is over stops counting, or read an hour later it would
        // report how long ago it started under the word "finished in". For one that
        // was stopped there is no such moment, so what it last wrote is when it was
        // last alive.
        $ended = $status === 'running'
            ? time()
            : max(
                (int) (@filemtime($directory . '/' . $id . '.status') ?: time()),
                (int) (@filemtime($directory . '/' . $id . '.exit') ?: 0),
                $interrupted ? (int) (@filemtime($directory . '/' . $id . '.log') ?: 0) : 0,
            );

        return [
            'status' => $status,
            'interrupted' => $interrupted,
            'started' => $started,
            'elapsed' => $started > 0 ? max(0, $ended - $started) : 0,
        ];
    }

    /** The id as it may be used to build a path out of. */
    private static function safe(string $id): string
    {
        return preg_replace('/[^A-Za-z0-9-]/', '', $id) ?? '';
    }

    /**
     * Only the markers, which are a handful however long the log is -- as opposed
     * to taking the whole log apart to draw one line of text.
     *
     * @return ?array{no: int, total: int, label: string}
     */
    private static function stepIn(string $log): ?array
    {
        $found = preg_match_all(self::MARKER . 'm', $log, $matches, PREG_SET_ORDER);
        if ($found === false || $found === 0) {
            return null;
        }
        $last = $matches[$found - 1];

        return ['no' => (int) $last[1], 'total' => (int) $last[2], 'label' => trim($last[4])];
    }

    /**
     * The marker of the step being worked on is the last thing of ours in the file,
     * and what stands between two markers is whatever the tools wrote. The whole
     * file is not what a spinner needs to read.
     *
     * Unless the tail carries no marker at all: the step whose own output is longer
     * than this, or an operation that has not written its first marker yet.
     *
     * @return ?array{no: int, total: int, label: string}
     */
    private static function lastStepIn(string $file): ?array
    {
        $size = @filesize($file);
        if ($size !== false && $size > self::TAIL) {
            $step = self::stepIn((string) @file_get_contents($file, false, null, $size - self::TAIL));
            if ($step !== null) {
                return $step;
            }
        }

        return self::stepIn((string) @file_get_contents($file));
    }

    /** How much of the end of a log is enough to find the step in. */
    private const int TAIL = 65_536;

    /**
     * How far a log may be reported into while it is still being written: up to
     * its last complete line. A tool writing mid-line would otherwise put half a
     * marker in one answer and half in the next, and neither half reads as a step.
     */
    private static function wholeLines(string $log): int
    {
        $last = strrpos($log, "\n");

        return $last === false ? 0 : $last + 1;
    }

    /**
     * @param int $since how much of the log the caller already has, as JobState
     *                   reported it last. The page asks once a second and a
     *                   composer install writes hundreds of kilobytes, so what
     *                   has already been read is not sent again.
     */
    public function state(string $id, int $since = 0): JobState
    {
        $id = self::safe($id);
        $directory = $this->project->jobsDirectory();

        $outcome = $this->outcome($id);
        $log = (string) @file_get_contents($directory . '/' . $id . '.log');

        $size = $outcome['status'] === 'running' ? self::wholeLines($log) : \strlen($log);
        $log = substr($log, 0, $size);
        // Past the end of what is there: the file was replaced under the caller,
        // so it is given the whole of the new one rather than a slice of it.
        $carried = $since > 0 && $since <= $size ? $since : 0;

        return new JobState(
            id: $id,
            status: $outcome['status'],
            // What it is about and what it is doing. A page opened while an operation
            // was already running knows neither, and the end of it can then only say
            // "done" where it could name the worktree it built.
            subject: trim((string) @file_get_contents($directory . '/' . $id . '.subject')),
            command: trim((string) @file_get_contents($directory . '/' . $id . '.command')),
            step: self::stepIn($log),
            steps: $this->steps($log, $outcome['status'], $outcome['elapsed'], $carried),
            elapsed: $outcome['elapsed'],
            log: self::readable(substr($log, $carried)),
            size: $size,
            partial: $carried > 0,
            interrupted: $outcome['interrupted'],
        );
    }

    /**
     * The markers become what they say: a log that is only steps would otherwise
     * arrive as an empty block.
     */
    private static function readable(string $log): string
    {
        return (string) preg_replace(self::MARKER . 'm', '[$1/$2] $4', $log);
    }

    /**
     * What the interface shows: a list that is ticked off, not a wall of output in
     * which the current position has to be found. The log is kept beside it, whole,
     * because that is what gets copied into a bug report.
     *
     * @param int $since what the caller already has, in bytes of the log. The
     *                   output of a step that was over before that cannot have
     *                   gained a line since, so it is left out and the caller
     *                   keeps what it was given.
     *
     * @return list<array{no: int, label: string, output: ?string, state: string, seconds: int}>
     */
    private function steps(string $log, string $status, int $elapsed, int $since = 0): array
    {
        $steps = [];
        $current = null;

        // With the offsets, which is how a step is told from the bytes it holds.
        $lines = preg_split('/\R/', $log, -1, PREG_SPLIT_OFFSET_CAPTURE) ?: [];
        foreach ($lines as [$line, $from]) {
            if (preg_match(self::MARKER, $line, $hit) === 1) {
                $at = (int) $hit[3];
                if ($current !== null) {
                    // What passed between this marker and the one before it is how long that
                    // step took.
                    $steps[$current]['seconds'] = max(0, $at - $steps[$current]['at']);
                }
                // The reporter ends the work with the number it is already on, which
                // closes the step rather than opening another one.
                if ($current !== null && $steps[$current]['no'] === (int) $hit[1]) {
                    continue;
                }
                $steps[] = [
                    'no' => (int) $hit[1],
                    'label' => trim($hit[4]),
                    'output' => [],
                    'state' => 'done',
                    'seconds' => 0,
                    'at' => $at,
                    // Where in the log this step begins. The next one's start is
                    // where it ends, which is what says whether it has moved.
                    'from' => $from,
                ];
                $current = array_key_last($steps);
                continue;
            }
            if ($current !== null && trim($line) !== '') {
                $steps[$current]['output'][] = rtrim($line);
            }
        }

        // Only the operation itself can say that its last step is behind us.
        if ($current !== null && $status !== 'done') {
            $steps[$current]['state'] = $status === 'failed' ? 'failed' : 'running';
            $steps[$current]['seconds'] = max(0, $elapsed - $steps[$current]['at']);
        }

        $finished = [];
        foreach ($steps as $index => $step) {
            $ends = $steps[$index + 1]['from'] ?? \strlen($log);
            $finished[] = [
                'no' => $step['no'],
                'label' => $step['label'],
                'output' => $since > 0 && $ends <= $since ? null : implode("\n", $step['output']),
                'state' => $step['state'],
                'seconds' => $step['seconds'],
            ];
        }

        return $finished;
    }

    /**
     * The ids carry the time they were started, so they sort themselves. Not the
     * logs: those are read one at a time, when one of them is opened.
     *
     * @return list<array{id: string, command: string, status: string, elapsed: int, started: int}>
     */
    public function history(string $subject): array
    {
        $directory = $this->project->jobsDirectory();

        $history = [];
        foreach (array_reverse($this->about($subject)) as $id) {
            $outcome = $this->outcome($id);
            $history[] = [
                'id' => $id,
                'command' => trim((string) @file_get_contents($directory . '/' . $id . '.command')),
                'status' => $outcome['status'],
                'elapsed' => $outcome['elapsed'],
                // When it ran: how long it took says nothing about whether this is the
                // build from ten minutes ago or the one from last week.
                'started' => (int) @file_get_contents($directory . '/' . $id . '.started'),
            ];
        }

        return $history;
    }

    /**
     * The record of a worktree that is not there any more. A name comes back, and
     * the new worktree used to open with its predecessor's history.
     *
     * What is running is left alone, and that is not a detail: the removal is
     * itself an operation under this name, writing its log while this runs. Its own
     * files stay behind until the name is used again, where this is asked again.
     *
     * @return int how many operations were forgotten
     */
    public function forget(string $subject): int
    {
        $directory = $this->project->jobsDirectory();
        $forgotten = 0;

        foreach ($this->about($subject) as $id) {
            if ($this->outcome($id)['status'] === 'running') {
                continue;
            }
            // Everything written under that id, whatever it is called. A file left
            // behind here is a job that is half gone -- read as an operation with no
            // log and no time.
            $this->files->remove(...(glob($directory . '/' . $id . '.*') ?: []));
            ++$forgotten;
        }

        return $forgotten;
    }

    /**
     * @return list<string>
     */
    private function about(string $subject): array
    {
        $files = glob($this->project->jobsDirectory() . '/*.subject') ?: [];
        sort($files);

        $ids = [];
        foreach ($files as $file) {
            if (trim((string) @file_get_contents($file)) === $subject) {
                $ids[] = basename($file, '.subject');
            }
        }

        return $ids;
    }

    /**
     * Everything running right now, oldest first -- there is one operation per
     * worktree, and the list is what lets the page mark the busy rows instead of
     * going still behind a dialog about one of them.
     *
     * The short form and not the whole of each: this is drawn as a spinner and a
     * line of text. What is on the stage asks for itself in full through /api/jobs.
     *
     * @return list<array{id: string, subject: string, command: string, step: ?array{no: int, total: int, label: string}}>
     */
    public function running(): array
    {
        $directory = $this->project->jobsDirectory();
        $files = glob($directory . '/*.status') ?: [];
        sort($files);

        $running = [];
        foreach ($files as $file) {
            // The status file first: there is one for every operation the project ever
            // ran, and one that is over says so right here. What an outcome reads
            // beyond it is worth reading only about one that may still be working.
            if (trim((string) @file_get_contents($file)) !== 'running') {
                continue;
            }
            $id = self::safe(basename($file, '.status'));
            if ($this->outcome($id)['status'] !== 'running') {
                continue;
            }
            $running[] = [
                'id' => $id,
                'subject' => trim((string) @file_get_contents($directory . '/' . $id . '.subject')),
                'command' => trim((string) @file_get_contents($directory . '/' . $id . '.command')),
                // The one thing here that needs the log, and only its last marker.
                'step' => self::lastStepIn($directory . '/' . $id . '.log'),
            ];
        }

        return $running;
    }
}
