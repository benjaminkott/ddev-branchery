:navigation-title: Editors

..  _editors:

=======
Editors
=======

A worktree is an ordinary directory in the project and is opened like any other
checkout. Branchery writes what the editor cannot derive by itself — the
debugger's path mapping and the worktree's own environment — and leaves
everything that depends on which window is open to the developer.

..  _editors-written:

What Branchery writes into a worktree
=====================================

Building a worktree creates ``.worktrees/<name>/.vscode/`` with its own
``.gitignore``, so a new worktree does not start out dirty, and two files in it:

..  table:: What is written
    :name: editor-files

    ================= =================================================================================================
    File              Contents
    ================= =================================================================================================
    ``launch.json``   an Xdebug listener on port 9003, mapping the worktree's container path to the open folder
    ``settings.json`` search exclusions for ``vendor``, ``node_modules`` and ``typo3temp``, and the terminal environment
    ================= =================================================================================================

The terminal of a worktree window knows where it stands:

..  code-block:: text

    BRANCHERY_NAME        the worktree name
    BRANCHERY_URL         the address it answers at
    PLAYWRIGHT_BASE_URL   the same address, for browser tests

A file the branch keeps under version control is left alone. Both files are
written when a worktree is built and again by ``worktree:config``, which is the
way back after they were deleted or edited by hand:

..  code-block:: bash

    ddev branchery worktree:config my-fix

..  _editors-debugging:

Debugging
=========

Xdebug belongs to the project's web container and is switched on there:

..  code-block:: bash

    ddev xdebug on

The generated ``launch.json`` then needs no further setup in a VS Code window
opened on the worktree. Every worktree maps its own path, which is why the
debugger stops in the checkout the request actually went to.

In PhpStorm the mapping is entered by hand under *PHP → Servers*, from the
worktree directory to the same path inside the container. Branchery writes
nothing below ``.idea/`` and carries no ``.idea/`` into a worktree.

..  _editors-exclusions:

Two windows, two sets of exclusions
===================================

An index costs what the code costs, and a worktree is a complete checkout with a
dependency tree of its own. A project with a dozen worktrees can hold several
gigabytes of index for the same code, so both windows need to be told what to
leave out — and each needs the opposite thing.

**A window on the project** should skip the worktrees entirely. They are copies
of code the editor already has. In VS Code, in the project's own
``.vscode/settings.json``:

..  code-block:: json

    {
      "search.exclude": { "**/.worktrees/**": true },
      "files.watcherExclude": { "**/.worktrees/**": true },
      "intelephense.files.exclude": ["**/.worktrees/**"]
    }

In PhpStorm, right-click ``.worktrees`` in the project tree and choose *Mark
Directory as → Excluded*.

**A window on a worktree** should skip the dependency trees instead, and must
not exclude ``.worktrees`` — see below:

..  code-block:: json

    {
      "intelephense.files.exclude": ["**/vendor/**", "**/node_modules/**", "**/typo3temp/**"]
    }

Name the directories the project's profile actually builds into; a project that
installs below ``.build/`` names that path here.

..  _editors-intelephense:
..  _intelephense-matches-the-absolute-path:

Intelephense matches the absolute path
======================================

VS Code matches its own exclusions against the path relative to the open folder.
Intelephense matches ``intelephense.files.exclude`` against the absolute path.
For a window opened directly on ``.worktrees/<name>`` the same pattern therefore
means opposite things:

..  code-block:: text

    **/.worktrees/**   /home/…/blog/.worktrees/my-fix/Classes/Post.php   matches
    **/.worktrees/**   Classes/Post.php                                  no match

VS Code no longer sees ``.worktrees`` in the relative path and keeps working.
Intelephense matches the absolute path, indexes nothing, and says so nowhere: no
completion, no navigation, no references, no error.

..  note::

    Keep ``**/.worktrees/**`` out of ``intelephense.files.exclude`` in every
    scope a worktree window inherits, above all the user settings. It belongs
    in the project's workspace settings. PhpStorm excludes by project-relative
    path and is not affected.
