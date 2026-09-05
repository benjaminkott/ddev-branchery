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
instead of appearing to run forever. A reused name starts with an empty history
so it cannot inherit records from an older checkout, and removing a worktree
takes its records with it.

A worktree keeps the most recent operations rather than all of them, and the
operations about no worktree — a fetch — are kept the same way and apart, so one
worktree's history cannot push them out. Starting an operation is what sweeps;
nothing running is ever swept, whatever its age. A composer install writes
hundreds of kilobytes into its log, and a worktree that goes on existing would
otherwise keep every one of them for as long as the project stands.

..  _architecture-trust:

Trust boundary
==============

The API does not ask who the caller is, and the container can invoke the
project's tools and console. This is safe only within the trust boundary DDEV
normally provides: one developer's machine, one local project and its router.

Requests a browser marks as coming from another site are refused, so a page open
in another tab cannot drive this interface. That is a bolt on the door and not a
lock: it stops one specific way in and it does nothing about who can reach the
port. What keeps this safe is still the network boundary.

..  warning::

    Do not publish the Branchery port or place the interface on a shared
    network. It is a local development tool with the effective power of a shell
    in the project's web container.

DDEV binds its router to the loopback address by default, which is what puts the
interface on the developer's own machine and nowhere else. A project or a global
configuration that sets ``bind_all_interfaces: true`` -- usually to try a site on
a phone -- takes that boundary away, and Branchery is then reachable from every
machine on the same network, as a shell. The same is true of a project that omits
the DDEV router: the port is then published straight out of the container, on
every interface the machine has.

Branchery asks the Docker daemon what its port is actually bound to, and says so
over the page when the answer is anything but this machine. That is the whole of
the reaction: it adds no lock, because a lock in front of a tool that sits beside
a shell able to do all of it anyway would be a lock on the wrong door. What it
removes is the silence -- the boundary is the network, and a developer whose
interface has left it can now find that out from the interface.

If you need a site on another device, expose the project and leave Branchery out
of it: run ``ddev branchery`` from a terminal instead of opening the interface,
or remove the add-on for as long as the port is open.
