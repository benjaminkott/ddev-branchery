:navigation-title: Worktrees

..  _worktrees:

======================
Working with worktrees
======================

The overview is the page Branchery opens on, and
``ddev branchery worktree:list`` prints the same list. Each row is one
worktree: its name, the branch it is on and the commit that branch stands on,
what is outstanding in it, its PHP version, and the way into its own page. Over
the rows stands the project checkout with the same facts, and under them every
branch that has no worktree yet.

..  _worktrees-marks:

What a row says
===============

A row carries a mark only where something about the worktree is remarkable.

..  table:: The marks
    :name: marks

    ======================= ==============================================================================
    Mark                    What it means, and what to do
    ======================= ==============================================================================
    *not built*             the worktree has not been built yet; provision it
    *build unfinished*      a build stopped before its end; provision it again
    *dependencies changed*  what the build reads has changed since it was built; provision it again
    *merged*                every commit is in the project's branch; the worktree can go
    *branch gone*           the remote has deleted the branch; the worktree can probably go
    ======================= ==============================================================================

The column beside the branch counts what is not settled: changes never
committed, commits never pushed, and how far the branch is behind its remote. A
quiet row says nothing there.

Over the list, a note names the worktrees whose build did not finish, and
another the ones that look finished, with a press that removes them together.
:ref:`worktrees-remove` says what that press does.

..  _worktrees-create:

Create one
==========

*New worktree* opens a dialog for any branch, and the branches without a
worktree offer the same press one by one. The dialog asks what the worktree is
called, which version it runs on and where its data comes from, and says
before the press what the operation would stop on. ``n`` opens it from the
keyboard, and ``/`` puts the cursor in the filter.

From a shell:

..  code-block:: bash

    ddev branchery worktree:add 13.4
    ddev branchery worktree:fork feature/checkout

:ref:`add <operations-add>` checks out a branch that exists, :ref:`fork
<operations-fork>` cuts one that does not; both are there step by step.

..  _worktrees-current:

Keep one current
================

*Fetch* at the top of the page asks the remote what moved, and the counts in
the list follow. A worktree that is behind is brought up with *Bring up to
date* on its page:

..  code-block:: bash

    ddev branchery worktree:pull my-fix

Only a fast-forward: nothing the worktree has committed is touched. A branch
with commits of its own that is also behind is refused, and there are two ways
on: rebase in git, or drop the commits with *Discard what is not pushed*, which
shows every commit that would go before it asks.

The dependencies and the database are not part of this. Where the code now
asks for something else, the row says *dependencies changed*, and
:ref:`worktrees-rebuild` is the answer.

..  _worktrees-patch:

Try a patch and come back
=========================

A worktree is where a patch is looked at: ``git-review -d`` or a fetched ref
checks another branch out into it. Its page then says which branch it was made
for, and *Back to* that branch puts it there again and brings it up to date:

..  code-block:: bash

    ddev branchery worktree:restore my-fix

The branch being left keeps everything committed on it. Uncommitted work is
refused rather than carried across.

..  _worktrees-rebuild:

Build one again
===============

*Provision again* rebuilds dependencies, configuration, docroot and PHP
version. The data is the choice the dialog asks: keep it and fit it to the
code that is checked out now, or install anew into an empty database.

..  code-block:: bash

    ddev branchery worktree:provision my-fix
    ddev branchery worktree:provision my-fix --fresh

*Copy data* takes the project checkout's data again instead of rebuilding;
:doc:`databases` is the page for that. *Change* switches the PHP version alone.

..  _worktrees-remove:

Remove what is finished
=======================

*Remove* on a worktree's page takes its database, its checkout and its branch,
and says beforehand what is uncommitted or unpushed in it.

..  code-block:: bash

    ddev branchery worktree:remove my-fix

*Tidy up* over the list offers every worktree that looks finished, together.
Merged ones are ticked, because nothing can be lost. Ones whose branch is gone
from the remote are offered unticked, because their commits may be nowhere
else. A worktree with uncommitted changes is not offered at all.
