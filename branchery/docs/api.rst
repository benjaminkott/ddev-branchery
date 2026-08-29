:navigation-title: REST API

..  _automation-api:

========
REST API
========

The interface uses the REST API under ``/api``; it is not a separate execution
path. Read endpoints return state immediately. Operations return
``202 Accepted`` with a job identifier, and ``GET /api/jobs/<id>`` reports their
progress, steps and log.

The principal resources are:

..  table:: The principal resources
    :name: resources

    ======================================= =========================================================
    Resource                                Purpose
    ======================================= =========================================================
    ``/api/state``                          project and installation state
    ``/api/worktrees``                      list or create worktrees
    ``/api/worktrees/preview``              what creating one would produce, before it is asked for
    ``/api/worktrees/<name>``               update or remove one worktree
    ``/api/worktrees/<name>/<operation>``   provision, sync, pull, restore or discard
    ``/api/worktrees/<name>/commits``       browse the worktree's commits and diffs
    ``/api/worktrees/<name>/changes``       browse uncommitted changes and diffs
    ``/api/worktrees/<name>/usage``         disk usage of its checkout and database
    ``/api/worktrees/<name>/jobs``          operation history for a worktree
    ``/api/branches``                       branches available for a worktree
    ``/api/branch?branch=<name>``           one branch: where it was cut from, what it tracks
    ``/api/branch/commits?branch=<name>``   what is on it, a page at a time
    ``/api/fetch``                          fetch a remote
    ``/api/php-versions``                   PHP runtimes the image can serve
    ``/api/jobs/<id>``                      current or finished job state
    ======================================= =========================================================

The commits of a worktree are read a page at a time.
``GET /api/worktrees/<name>/commits`` answers with the upstream, the branch the
worktree was cut from, and what ``git log`` would print, newest first; each
entry says whether the remote has it and whether it is the branch's own or the
base's. ``?skip=<n>`` is the page behind that one,
``/commits/<sha>`` one commit in full with the files it touched, and
``/commits/<sha>/diff?path=<path>`` one of those files. It is what the
interface shows before a discard.
