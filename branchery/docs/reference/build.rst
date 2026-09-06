:navigation-title: Building

..  _build:

===================
Building a worktree
===================

The operations that make a worktree and what is inside it.

..  _operations-add:

add
===

``ddev branchery worktree:add <branch>`` · ``POST /api/worktrees``

Checks out a branch that exists locally or on a remote, and builds it.

#.  **Reading what the branch needs.** The branch's own ``.ddev/branchery.yaml``
    is read out of the ref (``git show origin/<branch>:.ddev/branchery.yaml``),
    and the project's applies where the branch carries none. A PHP version the
    web image has no pool for, or a database name that another worktree uses or
    that holds tables, stops the operation here, before anything exists. A
    ``composer.lock`` that lacks a package its ``composer.json`` requires is
    said as a warning; the worktree is still made, because the checkout is where
    that is fixed. Whatever history stands under this name belongs to a worktree
    that was removed and is forgotten.

    The interface asks the same questions before the press: the dialog names
    the version the worktree will be served with and repeats the operation's
    own warnings.

#.  **Checking out worktree.** ``git worktree add .worktrees/<name> <branch>``
    for a branch that is already here,
    ``git worktree add -b <branch> .worktrees/<name> origin/<branch>`` for one
    that is not. An entry left behind by a worktree deleted by hand is pruned
    first, so its name can be used again.

#.  **Reading how this is built.** The project's file, and the profile it
    names, decide the rest of the operation. What the worktree serves is written
    into its metadata, and the docroot link is made.

#.  **Choosing the versions.** PHP is what step 1 read, or what the file the
    configuration points at says now; a version other than the project's gets
    an FPM pool and a ``<Directory>`` block of its own. Node is decided here
    and only here, from the configuration or from the checkout's own
    ``.nvmrc``, ``.node-version`` or ``package.json``; a version that is not in
    the cache is fetched once. :ref:`php-and-node-versions` says how both are
    read.

#.  **Installing dependencies** (**config**).

#.  **Writing the configuration** (**config**), together with the worktree's
    ``.vscode/launch.json`` and ``.vscode/settings.json``.

#.  **Preparing the database.** ``branchery_<name>`` is created on the project's
    server. With ``data.from: source`` the project checkout's data is copied
    into it, the files ``data.needs`` names come with it, and the addresses in
    the files ``data.addresses`` names are pointed at this worktree. Then
    **migrate** (**config**) fits the schema to the checked-out code.

    Where the project says nothing about its data, or the source holds no
    tables, the database stays empty and **setup** (**config**) installs the
    application. Where the copied data cannot be fitted to the code, the copy
    is dropped and the application installed instead, and the log says so. The
    source database is never written to. :doc:`/use-branchery/databases` follows all three
    paths.

#.  **Finishing up.** **finish** (**config**) runs -- where a cache flush
    stands -- and the ``ddev describe`` block is rewritten.

A branch that is already in the repository is checked out as it stands and is
never moved onto its remote; one that is behind stays behind, and the list says
so. :ref:`architecture-branch-safety` is the rule.

..  _operations-fork:

fork
====

``ddev branchery worktree:fork <branch> [--from=<worktree>]`` ·
``POST /api/worktrees`` with ``mode: fork``

Creates a branch that does not exist yet, from the project checkout or from
another worktree, and builds it.

#.  **Reading what the branch needs**, as for ``add``, out of the commit the
    branch starts from. The lock file checked is the one the fork installs
    from: the committed one, or, in a project that keeps ``composer.lock`` out
    of git, the source checkout's working copy.

#.  **Creating branch.**
    ``git worktree add -b <branch> .worktrees/<name> <base>``, where the base is
    ``HEAD`` of the source worktree or of the project checkout. Which branch and
    commit that was is written into the worktree's metadata and shown on its
    page, because git keeps no such thing.

#.  **Carrying over unversioned files.** Everything git ignores in the source is
    copied over — ``vendor/``, generated files, configuration, uploads --
    except what a run leaves behind: ``var``, ``typo3temp``, ``.vscode``,
    ``.idea``, and always ``.git``, ``.ddev`` and the worktrees themselves. The
    log says how many entries travelled; ``-v`` names each. A project changes
    the list under ``copy``; see :ref:`copied-files`.

#.  **Building the worktree.** The build phases of ``add``: reading how this
    is built, choosing the versions, installing dependencies, writing the
    configuration.

#.  **Preparing the database.** ``branchery_<name>`` is created and the
    source's data is copied into it — the project checkout's, or that of the
    worktree this was branched off. The rest is ``add``'s database step.

#.  **Finishing up.**

..  _operations-provision:

provision
=========

``ddev branchery worktree:provision <name> [--fresh]`` ·
``POST /api/worktrees/<name>/provision``

Builds again everything inside a worktree that stays as it is. It is the way
on from a build that stopped and from a worktree whose dependencies changed
since it was built.

#.  **Reading how this is built**, from the ``.ddev/branchery.yaml`` in the
    checkout. A PHP version an earlier build assigned and the configuration no
    longer asks for is let go of, and the log says so.

#.  **Choosing the versions**, **installing dependencies** and **writing the
    configuration**, as in ``add``.

#.  **Preparing the database.** The database is created if it is missing.
    Where it already holds tables, **migrate** brings the schema up to the
    code and nothing is installed over the data; where it is empty, **setup**
    installs the application. With ``--fresh`` it is dropped first, so the
    worktree ends up as it would have been created today.
    :ref:`databases-fresh` is the choice.

#.  **Finishing up.**

A worktree that is to take the project's data again is what
:ref:`sync <operations-sync>` is for.

..  _operations-config:

config
======

``ddev branchery worktree:config [<name>]``

Writes the generated configuration again without rebuilding dependencies or
replacing data: the project's ``configure`` moment, the docroot link, the site
addresses and the editor files, then the ``finish`` moment and the
``ddev describe`` section. Without a name it refreshes every
worktree. Use it after a change to the configuration that needs neither
dependencies nor a migration; provision the worktree when its build inputs
changed.

..  _operations-php:

php
===

``ddev branchery worktree:php <name> [<version>]``

Shows the assigned version, or changes it: the new version's PHP-FPM pool is
assigned, the web-server configuration updated and ``finish`` run. A
version below the requirement Composer recorded is refused, because every
request would fail. :ref:`php-and-node-versions` says how a branch chooses its
version to begin with.
