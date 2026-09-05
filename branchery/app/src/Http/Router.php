<?php

declare(strict_types=1);

namespace App\Http;

use App\Container;

/**
 * The routes, written as a table. A path is matched by one regular expression
 * each, and what a segment may contain is part of that expression -- so a name
 * that is not a worktree name never reaches the code behind it.
 */
final readonly class Router
{
    public function __construct(private Container $container)
    {
    }

    /** @param array<string, mixed> $query what stood behind the question mark */
    public function dispatch(string $method, string $path, string $body, array $query = []): Response
    {
        $api = $this->container->api();
        // Wider than a worktree name, which is Project::NAME_PATTERN: the same
        // doors reach the project's own checkout, and that name is DDEV's -- where
        // a dot and a capital are allowed. What is not a worktree is still held to
        // being the project, one comparison behind this; what a leading letter or
        // digit keeps out is "." and "..", which are directories too.
        $name = '(?<name>[A-Za-z0-9][A-Za-z0-9.-]*)';
        // A commit is named by its hash and by nothing else. Written into the
        // pattern rather than checked behind it, so a segment that is a branch
        // name, a date or an option never reaches git.
        $sha = '(?<sha>[0-9a-f]{4,40})';

        $routes = [
            ['GET', '#^/api/state$#', fn (): Response => $api->state()],
            ['GET', '#^/api/worktrees$#', fn (): Response => $api->list()],
            ['POST', '#^/api/worktrees$#', fn (): Response => $api->create($this->payload($body))],
            // Beside the door it rehearses rather than at the top level, where it read
            // as a preview of nothing in particular. The literal stands before the
            // pattern that would swallow it -- "preview" is a name a worktree may
            // have, and this claims one verb on one path and nothing under it.
            ['GET', '#^/api/worktrees/preview$#', fn (): Response => $api->preview($query)],
            ['PATCH', "#^/api/worktrees/{$name}$#", fn (array $v): Response => $api->update($v['name'], $this->payload($body))],
            ['POST', "#^/api/worktrees/{$name}/provision$#", fn (array $v): Response => $api->provision($v['name'], $this->payload($body))],
            ['POST', "#^/api/worktrees/{$name}/sync$#", fn (array $v): Response => $api->sync($v['name'], $this->payload($body))],
            ['POST', "#^/api/worktrees/{$name}/pull$#", fn (array $v): Response => $api->pull($v['name'])],
            ['POST', "#^/api/worktrees/{$name}/restore$#", fn (array $v): Response => $api->restore($v['name'])],
            ['POST', "#^/api/worktrees/{$name}/discard$#", fn (array $v): Response => $api->discard($v['name'])],
            ['GET', "#^/api/worktrees/{$name}/commits$#", fn (array $v): Response => $api->commits($v['name'], $query)],
            ['GET', "#^/api/worktrees/{$name}/commits/{$sha}$#", fn (array $v): Response => $api->commit($v['name'], $v['sha'])],
            ['GET', "#^/api/worktrees/{$name}/commits/{$sha}/diff$#", fn (array $v): Response => $api->commitDiff($v['name'], $v['sha'], $query)],
            ['GET', "#^/api/worktrees/{$name}/changes$#", fn (array $v): Response => $api->changes($v['name'])],
            ['GET', "#^/api/worktrees/{$name}/changes/diff$#", fn (array $v): Response => $api->changeDiff($v['name'], $query)],
            ['GET', "#^/api/worktrees/{$name}/usage$#", fn (array $v): Response => $api->usage($v['name'])],
            ['GET', "#^/api/worktrees/{$name}/jobs$#", fn (array $v): Response => $api->worktreeJobs($v['name'])],
            ['DELETE', "#^/api/worktrees/{$name}$#", fn (array $v): Response => $api->remove($v['name'])],
            ['GET', '#^/api/branches$#', fn (): Response => $api->branches()],
            // The name behind the question mark rather than in the path: a branch name
            // carries slashes, and a segment that may hold one cannot say where it
            // ends. The one place here where a path does not mirror what it is about.
            ['GET', '#^/api/branch$#', fn (): Response => $api->branch($query)],
            ['GET', '#^/api/branch/commits$#', fn (): Response => $api->branchCommits($query)],
            ['POST', '#^/api/fetch$#', fn (): Response => $api->fetch($this->payload($body))],
            ['GET', '#^/api/php-versions$#', fn (): Response => $api->phpVersions()],
            ['GET', '#^/api/jobs/(?<id>[A-Za-z0-9-]+)$#', fn (array $v): Response => $api->job($v['id'], $query)],
        ];

        // The path decides which routes are candidates, the method which of them
        // answers. Both are needed: several routes share a path and differ only in
        // their verb, and stopping at the first would answer "method not allowed".
        $known = false;
        foreach ($routes as [$verb, $pattern, $handler]) {
            if (!preg_match($pattern, $path, $matches)) {
                continue;
            }
            $known = true;
            if ($verb === $method) {
                return $handler($matches);
            }
        }

        return $known
            ? Response::json(['error' => 'Method not allowed.'], 405)
            : Response::json(['error' => 'Unknown endpoint.'], 404);
    }

    /** @return array<string, mixed> */
    private function payload(string $body): array
    {
        $data = json_decode($body, true);

        return is_array($data) ? $data : [];
    }
}
