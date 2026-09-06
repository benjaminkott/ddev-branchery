:navigation-title: What runs where

..  _what-runs-where:

===============
What runs where
===============

The containers, the addresses and the files: where each part of a worktree lives, and what it costs on disk.

..  code-block:: text

    .ddev/branchery/                    files and state installed in the project
    ├── scripts/                        web-server and PHP-pool helpers
    └── var/                            metadata, docroot links and operation logs
    .ddev/docker-compose.branchery.yaml the management container and image tag
    .worktrees/<worktree>/              parallel git working copies

The REST API, command line, interface and shipped configurations run in the
Branchery container. Git, Composer, Node, database clients, PHP pools and
application consoles run through ``docker exec`` in the project's web
container, so a worktree is built by the toolchain that serves it. That is why
the management container needs the Docker socket.

..  _architecture-addresses:

Addresses and docroots
======================

Installation adds one wildcard hostname below the project's domain. A worktree
can therefore become reachable as soon as its docroot link and web-server
configuration are written; creating one does not require a DDEV restart.

..  code-block:: text

    <worktree>.<project>.ddev.site    one worktree
    <project>.ddev.site:8041          Branchery
    <project>.ddev.site               the project checkout

``ddev describe`` gets a Branchery section with the active addresses, PHP
versions and databases. That section is regenerated when worktrees change and
again when the container starts.

..  _architecture-written:

What is written where
=====================

..  table:: What is written where
    :name: written-where

    ============================================= ==================== =========================================================================
    Path                                          Writer               Contents
    ============================================= ==================== =========================================================================
    ``.worktrees/<name>/``                        git                  the checkout
    ``.worktrees/<name>/.vscode/``                Branchery            debugger and terminal environment, with its own ``.gitignore``
    ``.ddev/branchery/var/metadata/<name>.json``  Branchery            branch, base, profile, docroot, PHP version, database and built commit
    ``.ddev/branchery/var/docroots/<name>``       Branchery            link from the web server to the worktree docroot
    ``.ddev/branchery/var/php.map``               Branchery            PHP assignment for every worktree
    ``.ddev/branchery/var/node.map``              Branchery            Node assignment for every worktree
    ``.ddev/branchery/var/jobs/<id>.*``           Branchery            operation log, status, process id and exit code
    ``.ddev/branchery/var/locks/``                Branchery            the claim one operation holds on a worktree or on the repository
    files inside the worktree                     project              application-specific setup and generated files
    ============================================= ==================== =========================================================================

The editor files are VS Code's. Other editors, and every PHP language server,
are set up by hand; :doc:`/use-branchery/editors` says what Branchery writes and what a project
window and a worktree window each still need.

Branchery does not modify the project's own ``.gitignore``. The installation
places local ignore rules beside ``.worktrees/`` and ``.ddev/branchery/var/``,
and generated editor files carry an ignore rule of their own.

..  _disk-usage:

Disk usage
==========

A worktree does not duplicate the repository. Its ``.git`` file points back to
the project's shared Git object store. What it does own is a checked-out copy of
the files, everything the build writes below that directory, and a database of
its own. Dependencies and generated assets often make the checkout much larger
than the source alone.

..  figure:: /images/branchery-owned-shared.svg
    :zoomable:

    What one worktree owns is what makes it separate. Everything underneath
    belongs to the project, and every worktree uses the same copy of it.

The worktree page measures those two owned parts on demand: the allocated
space below ``.worktrees/<name>/``, dependencies and caches included, and the
database with its tables and indexes. What the project holds once for every
checkout is left out, because no single worktree owns it: the Git object store,
the Docker images of the services, and the download caches Composer and npm
keep outside the checkout.
