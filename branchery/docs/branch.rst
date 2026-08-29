:navigation-title: Moving the branch

..  _branch:

=================
Moving the branch
=================

The operations that move a worktree's branch, and what none of them will do.

..  _operations-pull:

pull
====

``ddev branchery worktree:pull <name>`` · ``POST /api/worktrees/<name>/pull``

Brings the worktree's branch up to what its remote has. The dependencies and
the database stay as they were, and the list says *dependencies changed since
the build* where a rebuild is due.

#.  **Updating** ``<remote>``. ``git fetch <remote> --prune``.

#.  **Moving** ``<branch>`` **onto** ``<upstream>``. ``git merge --ff-only``,
    and only that. A fast-forward adds commits and rewrites none.

Refused before anything moves where the branch follows no remote, carries
commits the remote does not have, or is already what the remote has. A
fast-forward that would write over uncommitted work is git's own refusal.
:ref:`pull-cannot-move-the-branch` says what to do in each case.

..  _operations-restore:

restore
=======

``ddev branchery worktree:restore <name>`` ·
``POST /api/worktrees/<name>/restore``

Puts a worktree back on the branch it was made for and brings it up to date
there — the way back after a patch was checked out into it, by
``git-review -d`` or by hand.

#.  **Going back to** ``<branch>``. ``git switch``, which refuses rather than
    carry uncommitted work across. The branch being left stays where it is,
    with everything committed on it.

#.  **Updating** ``<remote>`` and **moving** ``<branch>`` **onto**
    ``<upstream>``, the two steps of :ref:`pull <operations-pull>`, refused in
    the same cases. A branch that follows no remote ends the operation after the
    first step.

The branch is the one recorded when the worktree was made
(``.ddev/branchery/var/metadata/<name>.json``), not what the directory is
called. Refused where that branch is checked out in another worktree, and where
the worktree is on it already;
:ref:`restore-cannot-return-to-the-original-branch` says what to do.

..  _operations-discard:

discard
=======

``ddev branchery worktree:discard <name>`` ·
``POST /api/worktrees/<name>/discard``

Puts the branch back exactly on its remote and drops the commits it was
carrying alone. It is the way out of the state ``pull`` refuses — a branch
with commits of its own that is also behind — for whoever has decided against
rebasing them.

#.  **Updating** ``<remote>``. ``git fetch <remote> --prune``.

#.  **Putting** ``<branch>`` **back on** ``<upstream>``. ``git reset --hard``.
    Every commit dropped is named in the log by its sha and its subject.

A dropped commit is in no branch but stays in ``git reflog`` until git next
collects. Uncommitted work has no such second chance, so a working copy that is
not clean is refused rather than reset. The interface shows the commits that
would go before it asks.
