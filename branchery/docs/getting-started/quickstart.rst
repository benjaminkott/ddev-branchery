:navigation-title: Quickstart

..  _quickstart:

==========
Quickstart
==========

From installing the add-on to the first usable worktree. Every step is one
command, and the interface does the same thing with a press.

..  _getting-started-before:

Before you install
==================

The project must already run in DDEV and its root must be a git repository.
Branchery uses the project's web and database containers, so start from a
working project rather than from an empty DDEV configuration.

..  warning::

    The Branchery API is intentionally unauthenticated. Keep its port on the
    developer's own machine behind DDEV's router; do not expose it on a shared
    or public network.

..  _getting-started-install:

Install Branchery
=================

Run these commands in the project root:

..  code-block:: bash

    ddev add-on get benjaminkott/ddev-branchery
    ddev restart

The management interface is now available at
``https://<project>.ddev.site:8041``. Open it with:

..  code-block:: bash

    ddev branchery launch

The project checkout keeps answering at ``https://<project>.ddev.site``.

..  _getting-started-commit:

Commit what was installed
=========================

The add-on leaves a handful of files in ``.ddev/``. They are committed with the
project, which is DDEV's convention for an add-on: a clone then has Branchery
without installing it, and on the version the project chose.

..  code-block:: text

    .ddev/addon-metadata/branchery/      which version is installed
    .ddev/commands/host/branchery        the "ddev branchery" command
    .ddev/config.branchery.yaml          the wildcard hostname of the worktrees
    .ddev/docker-compose.branchery.yaml  the service and the image tag it runs
    .ddev/web-entrypoint.d/branchery.sh  what the web container runs on start

What stays out is the working state. ``.ddev/branchery/var/`` and
``.worktrees/`` each carry a rule of their own, and the project's own
``.gitignore`` is never written to.

..  _getting-started-configure:

Describe how the project is built
=================================

Branchery does not infer an application's setup from its files. Choose the
shipped profile that matches the project:

..  table:: The shipped profiles
    :name: profiles

    ============== =================================================
    Profile        Use it for
    ============== =================================================
    ``typo3-app``  a TYPO3 instance, or an extension that builds one
    ``typo3-core`` the TYPO3 core repository, served from its own root
    ``symfony``    a Symfony application
    ``composer``   a project that only needs ``composer install``
    ============== =================================================

Write the starting configuration, for example:

..  code-block:: bash

    ddev branchery config:example --profile=typo3-app --write

This creates ``.ddev/branchery.yaml``. Commit it with the project so the team
and every branch share the setup. Print the complete shipped profile before
customizing it with:

..  code-block:: bash

    ddev branchery config:example --profile=typo3-app --full

The :doc:`configuration reference </reference/configuration>` explains how a project
changes its docroot, setup commands, data source and carried files. Without
this file a worktree is only a checkout at an address of its own, with an empty
database.

..  _getting-started-first-worktree:

Create the first worktree
=========================

Use ``fork`` when the branch does not exist yet and should start from the
current project checkout:

..  code-block:: bash

    ddev branchery worktree:fork feature/checkout

Use ``add`` when the branch already exists locally or on a remote:

..  code-block:: bash

    ddev branchery worktree:add 13.4

A fork may start from another worktree instead of the project checkout:

..  code-block:: bash

    ddev branchery worktree:fork follow-up --from=feature-checkout

Branchery makes the name safe for a hostname. A branch called
``feature/checkout`` is normally served at:

..  code-block:: text

    https://feature-checkout.<project>.ddev.site

The git branch keeps its original name. Use ``--name=<worktree>`` only when the
directory, address and database need a different safe name.

..  _getting-started-check:

Check the result
================

List what Branchery created:

..  code-block:: bash

    ddev branchery worktree:list

The row names the address, branch, PHP version and database. It also shows
whether the build finished and whether dependencies have changed since it was
built. ``ddev describe`` carries the same addresses in its Branchery section.

Open the worktree URL and the Branchery interface. A finished operation has a
step-by-step record on the worktree page; a stopped one includes the command
that continues from a safe point. See :doc:`/use-branchery/troubleshooting` when the first
build does not finish.

..  _getting-started-continue:

Continue from here
==================

The overview now has a row for the worktree. :doc:`/use-branchery/worktrees` says what that
row tells you, how to keep the worktree current and how to remove it when its
work has landed. Open the checkout in an editor next: :doc:`/use-branchery/editors` says what
Branchery has written into it for the debugger and what each window has to
leave out. When a build stops, :doc:`/use-branchery/troubleshooting` has the way on.

:doc:`/reference/configuration` is the project's file, key by key, and :doc:`/reference/operations`
every operation, step by step. Updating and uninstalling the add-on are on
:doc:`update`.
