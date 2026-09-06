[![add-on registry](https://img.shields.io/badge/DDEV-Add--on_Registry-blue)](https://addons.ddev.com)
[![tests](https://github.com/benjaminkott/ddev-branchery/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/benjaminkott/ddev-branchery/actions/workflows/tests.yml?query=branch%3Amain)
[![last commit](https://img.shields.io/github/last-commit/benjaminkott/ddev-branchery)](https://github.com/benjaminkott/ddev-branchery/commits)
[![release](https://img.shields.io/github/v/release/benjaminkott/ddev-branchery)](https://github.com/benjaminkott/ddev-branchery/releases/latest)

# Branchery

Work on several branches of a project at the same time — each under its own
address, with its own PHP version and its own database, inside one DDEV project.
The original checkout, docroot and web server stay in place.

## Quick start

Add Branchery to an existing DDEV project and restart it:

```bash
ddev add-on get benjaminkott/ddev-branchery
ddev restart
```

Tell Branchery how a worktree of this project is built. The shipped profiles
cover common project shapes:

```bash
ddev branchery config:example --profile=typo3-app --write
```

Use `typo3-core`, `symfony` or `composer` instead where that is the project in
front of you. Without `.ddev/branchery.yaml`, Branchery deliberately creates
only a checkout, an address and an empty database; it does not guess how an
unknown application is installed.

Now branch off from the project checkout:

```bash
ddev branchery worktree:fork feature/checkout
# → https://feature-checkout.<project>.ddev.site
```

The worktree gets the code, the dependencies described by the configuration
and, where its profile asks for it, a copy of the source database. Open the
interface with:

```bash
ddev branchery launch
```

[Getting started](https://benjaminkott.github.io/ddev-branchery/getting-started.html) walks through the result and the
choice between creating a branch and checking out one that exists.

## Addresses

```text
<worktree>.<project>.ddev.site    one worktree
<project>.ddev.site:8041          Branchery
<project>.ddev.site               the original site, unchanged
```

A worktree is named after its branch and made hostname-safe: `13.4` becomes
`13-4`, and `bugfix/foo` becomes `bugfix-foo`. The git branch keeps its real
name. A new address works immediately; no restart is needed.

## Everyday commands

Create and inspect worktrees:

```bash
ddev branchery worktree:list
ddev branchery worktree:fork my-fix
ddev branchery worktree:fork my-fix --from=other
ddev branchery worktree:add 13.4
```

Keep them useful:

```bash
ddev branchery worktree:pull my-fix
ddev branchery worktree:provision my-fix
ddev branchery worktree:php my-fix 8.3
ddev branchery database:sync my-fix
ddev branchery worktree:config my-fix
```

Actions that discard or remove something say what will go before they run:

```bash
ddev branchery worktree:discard my-fix
ddev branchery worktree:remove my-fix
ddev branchery database:prune
```

The interface drives the same operations. A command started in a terminal is
visible there while it runs and remains in the worktree's history afterwards.

## Documentation

The manual is a site of its own at **[benjaminkott.github.io/ddev-branchery](https://benjaminkott.github.io/ddev-branchery/)**,
written in reStructuredText under `branchery/docs/`. The same pages travel in
the image and are read in the terminal with `ddev branchery docs [<page>]`.

| Read this | When you need it |
|---|---|
| [Getting started](https://benjaminkott.github.io/ddev-branchery/getting-started.html) | Install, configure and create the first worktree |
| [Worktree operations](https://benjaminkott.github.io/ddev-branchery/operations.html) | Add, fork, update, rebuild, restore and remove worktrees |
| [Databases and data](https://benjaminkott.github.io/ddev-branchery/databases.html) | Understand copies, synchronization and database cleanup |
| [Configuration reference](https://benjaminkott.github.io/ddev-branchery/configuration.html) | Write `.ddev/branchery.yaml`, key by key |
| [CLI and automation](https://benjaminkott.github.io/ddev-branchery/automation.html) | Use JSON output, detached jobs and the REST API |
| [Troubleshooting](https://benjaminkott.github.io/ddev-branchery/troubleshooting.html) | Recover stopped builds and clear leftovers safely |
| [How Branchery works](https://benjaminkott.github.io/ddev-branchery/architecture.html) | Understand containers, files, locks and generated state |

## What stays separate

Every worktree has its own checkout, address, selected PHP runtime and database.
Nothing uses the original project's database, and worktrees do not share one
with each other. A row in the interface also shows the branch it was cut from,
how both sides have moved since, what is uncommitted or unpushed, and whether
the installed dependencies still belong to the checked-out code.

Branchery runs in a container of its own but uses git, Composer, Node, PHP and
the database clients from the project's web container. The toolchain serving
the original project is therefore the one building its worktrees.

## Requirements and safety

- The DDEV project is a git repository.
- DDEV 1.24.0 or newer is installed.
- Both nginx and Apache are supported.
- The web image must provide a compatible PHP-FPM pool; current worktrees can
  use PHP 8.2 and newer.
- A branch can be checked out in only one worktree at a time.
- The Branchery container needs the Docker socket to run tools in the web
  container.

The API does not authenticate its caller. That is appropriate only on the
developer's own machine, behind the router of its DDEV project. Do not expose
the Branchery port on a shared or public network: the application can run the
project's tools and console commands by design.

## Updating and removing

An update installs a new image tag and takes effect after the container is
replaced:

```bash
ddev add-on get benjaminkott/ddev-branchery
ddev restart
```

To try the image built from the current main branch:

```bash
docker pull ghcr.io/benjaminkott/ddev-branchery:main
ddev dotenv set .ddev/.env.branchery --branchery-docker-image=ghcr.io/benjaminkott/ddev-branchery:main
ddev restart
```

Remove the add-on with `ddev add-on remove branchery`. Worktrees and their
databases are kept deliberately; remove worktrees through Branchery first when
their data is no longer wanted.

## Development

[AGENTS.md](AGENTS.md) is the working agreement for this repository. The root
`Makefile` is the usual front door:

```bash
make start                          # the application and the manual
make check                          # frontend and PHP checks
make docs                           # render the manual and the product page
make deploy site-new                # install this working copy into a DDEV project
```

`make start` names what it started and where each of them answers, and is left
running while the work happens -- the bundle is rebuilt on every save, and only
the mocked API under `branchery/app/dev/` is read once at start. Interface
changes are checked in the application itself, in both themes and in the state
the change concerns.
