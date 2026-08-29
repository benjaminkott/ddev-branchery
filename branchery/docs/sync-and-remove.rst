:navigation-title: Syncing and removing

..  _sync-and-remove:

====================
Syncing and removing
====================

The data of a worktree replaced, and a worktree taken away.

..  _operations-sync:

sync
====

``ddev branchery database:sync <name> [--from=<worktree>]`` ·
``POST /api/worktrees/<name>/sync``

Replaces the worktree's data with the project checkout's, or another
worktree's. The code is not touched, and neither are files outside what
``data.bring`` names.

#.  **Copying** ``<source>`` **into** ``<target>``. How far this branch is
    behind the source is reported first, because that is what explains errors
    afterwards. The dump is taken, then the target is dropped and made anew,
    then the dump is loaded — in that order, so a dump that fails leaves the
    old data where it was.

#.  **Putting the addresses back.** Site configuration the branch does not
    keep under version control comes along from the source, and every
    ``https://….ddev.site`` in it is rewritten to this worktree's address. A
    committed one is left as it is, with a line in the log; see
    :ref:`data-source-and-site-addresses`.

#.  **Fitting the data to this code** (**config** ``migrate``).

#.  **Flushing caches** (**config**).

..  _operations-remove:

remove
======

``ddev branchery worktree:remove <name>`` · ``DELETE /api/worktrees/<name>``

#.  **Removing database.** ``DROP DATABASE IF EXISTS branchery_<name>``.

#.  **Removing worktree.** ``git worktree remove --force``, the directory, and
    the branch the worktree is on (``git branch -D``) — for a worktree that has
    wandered onto a patch, the patch's branch and not the one it was made for,
    which the question before the press names. Where git refuses the worktree --
    one holding a submodule, or a locked one — the directory goes anyway and
    the stale entry is pruned. A branch git will not delete ends the operation
    as failed, after the cleaning up.

#.  **Cleaning up.** Docroot link, metadata, PHP pool assignment, the
    ``ddev describe`` block, and the worktree's operation history. Only the
    removal's own log stays, until the name is used again.

The list offers finished worktrees — branches merged into the project's own,
and branches deleted from the remote — for removal together, which is this
operation once per worktree. Nothing with uncommitted work in it is offered.
