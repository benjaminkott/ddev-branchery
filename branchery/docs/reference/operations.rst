:navigation-title: Operations

..  _operations:

===================
Worktree operations
===================

Every operation is reached from both ends: ``ddev branchery <command>`` in a
shell, or the interface, which starts the same command and reads its log. Both
leave the same record, so an operation started in a terminal shows on the page
while it runs and stands in the worktree's history afterwards. One operation
runs per worktree at a time, and operations on different worktrees run side by
side.

..  _operations-commands:

Commands
========

Run ``ddev branchery`` for the commands the installed image has, and append
``--help`` to any of them for its arguments and options.

..  table:: The commands
    :name: commands

    ==================================== =============================================================
    Command                              Purpose
    ==================================== =============================================================
    ``worktree:list``                    list worktrees and their current state
    ``worktree:fork <branch>``           create a branch from the project or another worktree
    ``worktree:add <branch>``            check out an existing local or remote branch
    ``worktree:pull <name>``             fast-forward a worktree branch from its upstream
    ``worktree:restore <name>``          return to the branch the worktree was made for
    ``worktree:discard <name>``          reset that branch to its upstream
    ``worktree:provision <name>``        rebuild dependencies and application state
    ``worktree:config [<name>]``         rewrite generated configuration for one or all worktrees
    ``worktree:php <name> [<version>]``  show or change the PHP runtime
    ``worktree:remove <name>``           remove checkout, branch, database and state
    ``database:sync <name>``             replace a worktree database from another source
    ``database:prune``                   list or drop databases without a worktree
    ``git:fetch [<remote>]``             fetch and prune remote branches
    ``jobs:list``                        list operations that are running
    ``jobs:show <id>``                   inspect or wait for an operation
    ``config:example``                   print or write a starting project configuration
    ``docs [<page>]``                    list or print pages of this manual
    ==================================== =============================================================

What follows is what each operation does, in order. A step marked **config**
is not Branchery's own work but what the project's ``.ddev/branchery.yaml``
says, directly or through the shipped profile it names. Without that file a
worktree is a checkout at an address of its own, with an empty database.
:doc:`configuration` is the file, key by key.

..  figure:: /images/branchery-build-steps.svg
    :zoomable:

    The build of a worktree, and which half of it a project owns. ``add``,
    ``fork`` and ``provision`` differ in where the checkout and the data come
    from; the phases below are the same.

Start with :doc:`/use-branchery/troubleshooting` when an operation stopped.

..  toctree::
    :hidden:

    build
    branch
    sync-and-remove
