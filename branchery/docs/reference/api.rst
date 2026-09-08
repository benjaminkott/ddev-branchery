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
    ``/api/worktrees/<name>/file``          one file of the checkout, as itself
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

The change in an image is not a diff. Where the path names one -- ``.png``,
``.jpg``, ``.gif``, ``.webp``, ``.avif``, ``.bmp``, ``.ico`` -- both diff doors
answer with no ``lines`` and an ``image`` instead: a ``before`` and an ``after``,
either of which is ``null`` where the change added the file or deleted it. Each
side says how many bytes it is and where to fetch it,
``/api/worktrees/<name>/file?path=<path>&blob=<object>``, which answers with the
bytes themselves under the media type the name of the file gives them. Without a
``blob`` that door hands over the file as it stands in the checkout, which is the
side of an uncommitted change git holds nothing of.

An operation is read a piece at a time. ``GET /api/jobs/<id>`` answers with its
steps and its log, and with ``size``: how much of the log that answer accounts
for. Handing that back as ``?since=<size>`` asks for what has been written in
the meantime -- the answer then carries ``partial: true``, its ``log`` is the
piece to add to what you already have, and a step that was over before that
point carries ``output: null`` rather than saying the same thing again.

Reading the whole of it every time is still correct and still supported; a
``composer install`` writes hundreds of kilobytes, and asking once a second is
what the interface does.

..  note::

    Requests a browser marks as coming from another site are refused with
    ``403``. Anything that carries no such mark -- curl, a script, the console
    -- is unaffected. See :ref:`safety`.
