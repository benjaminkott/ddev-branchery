:navigation-title: Automation

..  _automation:

==================
CLI and automation
==================

The command line and the web interface call the same application. Work started
at either end gets the same operation record, so a script can start a job and a
person can inspect it in the interface while it runs. The commands themselves
are listed in :ref:`operations-commands`, with what each does step by step,
and the routes the interface uses in :doc:`api`.

..  _automation-json:

JSON output
===========

Commands that answer a question accept ``--format=json``: ``worktree:list``,
``worktree:php``, ``database:prune``, ``jobs:list`` and ``jobs:show``.
Operations that build, move, synchronize or remove something accept it as well
and return one document when they end.

Commands that write another kind of output — ``worktree:config``, ``docs`` and
``config:example`` — do not offer JSON.

An operation result has this shape:

..  code-block:: json

    {
        "ok": false,
        "command": "worktree:add",
        "job": "20260903-114102-9f31ac",
        "worktree": "11-5",
        "result": null,
        "warnings": [],
        "error": "cd Build && npm ci failed with exit status 1.",
        "resume": "ddev branchery worktree:provision 11-5"
    }

``ok`` follows the process exit code. ``result`` contains the worktree in the
same shape as ``GET /api/worktrees`` when the operation produced one.
``warnings`` names work that could not be completed although the operation
continued, and ``resume`` is the safe continuation for a stopped build.

The worktree list uses the same state names as the interface. It includes the
branch a worktree was cut from, how that base and the current branch have moved,
whether the build is unfinished or stale, and whether work is uncommitted,
unpushed or behind its upstream. Scripts should read these fields instead of
parsing the human table.

..  _detached-operations:

Detached operations
===================

Long-running operations accept ``--detach``. The first response contains the job
identifier instead of waiting for the work to finish:

..  code-block:: bash

    job=$(ddev branchery worktree:add 13.4 --detach --format=json | jq -r .job)

    ddev branchery jobs:show "$job" --format=json
    ddev branchery jobs:show "$job" --wait --format=json

Without ``--wait``, ``jobs:show`` reports the current state and its exit code
only says whether the record could be read. With ``--wait``, it returns after
the job has ended and exits successfully or unsuccessfully with the operation.

``jobs:list --format=json`` finds the identifier of work that is currently
running. ``jobs:show <id> --log`` prints the full output rather than only the
current summary. Finished records remain available until their worktree is
removed.

..  _automation-verbose:

Verbose operation logs
======================

Use ``-v`` on an operation when its summary is not enough:

..  code-block:: bash

    ddev branchery -v worktree:fork my-fix

Verbose output names individual files and other targets where the regular log
only summarizes them. It is particularly useful for checking what a fork carries
from its source.

..  toctree::
    :hidden:

    api
