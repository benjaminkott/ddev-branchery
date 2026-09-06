:navigation-title: Troubleshooting

..  _troubleshooting:

===============
Troubleshooting
===============

An operation that fails exits non-zero and keeps its full output. The interface
and ``jobs:show`` display the same record, including the step that stopped and
the safe way forward where one exists.

..  _a-build-stopped-after-creating-the-worktree:

A build stopped after creating the worktree
===========================================

A failed build leaves the checkout and whatever completed before the failing
step. Its final output names the continuation:

..  code-block:: text

    ✗ cd Build && npm ci failed with exit status 1.
    → The worktree is here and not finished. "ddev branchery worktree:provision 11-5" takes it from the top.

Fix the cause inside the worktree or its ``.ddev/branchery.yaml``, then rebuild
without replacing its database:

..  code-block:: bash

    ddev branchery worktree:provision 11-5

The list calls this state *build unfinished*. It is different from *not built*:
some dependencies or generated files may already be present, but the operation
did not reach its end.

Use ``jobs:show <id> --log`` when the summary does not contain enough output.
The :ref:`automation guide <detached-operations>` explains how to find and wait
for job records.

..  _an-operation-finished-with-warnings:

An operation finished with warnings
===================================

An operation that continued past work it could not complete ends with a warning
rather than a success mark:

..  code-block:: text

    ⚠ https://localization-10-4.typo3-cms.ddev.site/  (10.4)
      The checkout asks for PHP 7.2, which the web image has no pool for; the project's own version applies.

Warnings may come from an unavailable PHP pool, a Node version that could not be
fetched, a missing or empty docroot, or a configuration task marked
``optional: true``. The worktree may still be usable, but the warning says which
part of its configuration is not true.

..  _a-php-version-is-refused:

A PHP version is refused
========================

Branchery rejects a branch before creating anything when its Composer
requirement cannot run on any PHP-FPM pool provided by the web image. Choose a
compatible web image or use a branch whose requirement is supported.

A later ``worktree:php`` switch is also refused when the desired runtime is
below the requirement recorded by Composer in
``vendor/composer/platform_check.php``. Running ``composer install`` again does
not change a requirement that comes from the lock file.

Show the current assignment with:

..  code-block:: bash

    ddev branchery worktree:php my-fix

Add ``--format=json`` to include the runtimes available to the interface.

..  _dependencies-changed-since-the-build:

Dependencies changed since the build
====================================

The list marks a worktree as stale when ``composer.json``, ``composer.lock`` or
``.ddev/branchery.yaml`` changed after it was built, or when the built commit is
no longer in the checked-out history. A commit of the worktree's own is normal;
the marker specifically means the installed state belongs to different code.

Rebuild it while keeping its data:

..  code-block:: bash

    ddev branchery worktree:provision my-fix

Use ``--fresh`` only when the database should be discarded and installed anew.

..  _pull-cannot-move-the-branch:

Pull cannot move the branch
===========================

``worktree:pull`` only performs a fast-forward. It refuses when the branch has
no upstream, contains commits the upstream does not have, or has uncommitted
files that the update would overwrite.

Choose the resolution in git when local commits must be rebased or merged. When
those commits should be dropped, inspect them in the interface and use:

..  code-block:: bash

    ddev branchery worktree:discard my-fix

Discard refuses a dirty checkout because uncommitted work has no reflog to
recover it from.

..  _restore-cannot-return-to-the-original-branch:

Restore cannot return to the original branch
============================================

``worktree:restore`` switches back to the branch the worktree was made for. Git
allows that branch in only one worktree at a time, so the operation refuses if
another checkout currently has it. Move the other checkout away from the branch
or remove that worktree first.

Uncommitted changes that cannot travel through the switch also stop the
operation. Commit, stash or discard them explicitly with git before trying
again.

..  _an-old-database-blocks-a-name:

An old database blocks a name
=============================

A database that contains tables and has no current worktree is preserved. When a
new worktree would use the same name, creation stops before touching the
repository:

..  code-block:: text

    ✗ The database branchery_my_fix already exists and holds tables. It is left
      over from a worktree that is not here any more.

Inspect the leftovers:

..  code-block:: bash

    ddev branchery database:prune

Export anything that may still be needed, then remove only the listed unclaimed
databases with:

..  code-block:: bash

    ddev branchery database:prune --drop

Alternatively create the new worktree with a different ``--name``. See
:ref:`find-databases-without-a-worktree` for the scope of pruning.

..  _the-site-opens-at-the-wrong-address:

The site opens at the wrong address
===================================

Branchery rewrites copied site configuration only when the branch does not keep
that file under version control. A committed site configuration is left clean
and must derive its address from the request, from ``BRANCHERY_HOST``, or from a
project command in the ``migrate`` moment.

The :ref:`configuration reference <data-source-and-site-addresses>` shows each
form. After changing the project configuration, refresh one worktree with:

..  code-block:: bash

    ddev branchery worktree:config my-fix

Omit the name to refresh every worktree.

..  _the-project-configuration-is-rejected:

The project configuration is rejected
=====================================

Unknown keys and invalid value types stop operations rather than being ignored.
The error names the key or value Branchery could not read. Compare the project
file with:

..  code-block:: bash

    ddev branchery config:example --profile=typo3-app --full

Use the profile named by the project. A branch may carry a different
``.ddev/branchery.yaml``; Branchery reads the worktree's file before the
project checkout's, so inspect the checkout that failed as well.

..  _the-container-restarted-during-an-operation:

The container restarted during an operation
===========================================

Every operation records its process id. If the process disappears without an
exit code, the job is reported as failed rather than left running forever. The
worktree lock belongs to the process and is released with it.

Inspect the job log, then use the resume command it reports. Builds normally
resume with ``worktree:provision``; operations that stopped before creating a
worktree can be started again directly.

..  _a-worktree-has-no-completion-or-navigation:

A worktree has no completion or navigation
==========================================

A PHP language server that indexes nothing reports nothing. The usual cause is
an exclusion meant for the project window: Intelephense matches its patterns
against the absolute path, so ``**/.worktrees/**`` in the user settings switches
the index off in every worktree window it reaches.

:ref:`intelephense-matches-the-absolute-path` explains what each window has to
exclude, and where the pattern belongs instead.
