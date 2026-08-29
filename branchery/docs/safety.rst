:navigation-title: Safety

..  _safety:

============================
What keeps an operation safe
============================

What an operation holds while it runs, what it never does to a branch, what it
leaves behind, and whose machine all of it assumes.

..  _architecture-locks:

Repository and worktree locks
=============================

Operations are exclusive per worktree. A second operation on the same checkout
is refused while work on another checkout can start immediately.

Only short project-wide mutations are serialized: adding or removing a git
worktree, deleting a branch, fetching a remote, and writing down which version a
worktree runs on together with putting its PHP pool up. Installing dependencies,
copying a database and running application setup belong to one worktree and can
run beside the same work in another.

Locks use ``flock`` and are held by the process rather than by a status file. A
process that exits or is killed releases its locks, so a container restart does
not leave a permanent claim behind.

..  _architecture-branch-safety:

Branch safety
=============

An existing local branch is checked out exactly where it stands. Branchery does
not reset it onto its remote, which preserves commits that were never pushed.
Only a branch not present locally is created from a remote branch.

The interface records which branch and commit a worktree was cut from because
git does not retain that relationship. The overview can then group related
worktrees and show how the base and child have each moved since the fork.

Moving commands are deliberately narrow. ``pull`` uses only a fast-forward,
``restore`` switches to the recorded branch, and ``discard`` is the explicitly
destructive way to reset that branch to its upstream.

..  _architecture-records:

Operation records
=================

Every operation writes its process id before starting and records its named
steps, output, warnings and exit code. A command run through
``ddev branchery ...`` adopts a record of its own, just as a job started by the
interface does.

If a process disappears without writing an exit code, its record becomes failed
instead of appearing to run forever. A worktree's history remains until the
worktree is removed; a reused name starts with an empty history so it cannot
inherit records from an older checkout.

..  _architecture-trust:

Trust boundary
==============

The API does not ask who the caller is, and the container can invoke the
project's tools and console. This is safe only within the trust boundary DDEV
normally provides: one developer's machine, one local project and its router.

..  warning::

    Do not publish the Branchery port or place the interface on a shared
    network. It is a local development tool with the effective power of a shell
    in the project's web container.
