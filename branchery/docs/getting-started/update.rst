:navigation-title: Update and uninstall

..  _update:

====================
Update and uninstall
====================

The application is an image, and a project installs a tag of it. An update
fetches the next tag; an uninstall takes the add-on out and leaves the
worktrees standing.

..  _update-image:

Update
======

An update is the add-on fetched again and the project restarted:

..  code-block:: bash

    ddev add-on get benjaminkott/ddev-branchery
    ddev restart

``.ddev/docker-compose.branchery.yaml`` names the image tag installed in the
project. The update writes the new tag, and the restart replaces the running
container; until then the old image continues to serve the application. The
running application notices when the project has been updated past it and says
so at the top of the page.

..  _architecture-image:

Choose another image
====================

A different image can be selected without editing the generated compose file:

..  code-block:: bash

    ddev dotenv set .ddev/.env.branchery --branchery-docker-image=ghcr.io/benjaminkott/ddev-branchery:v0.1.0
    ddev restart

Delete ``.ddev/.env.branchery`` to return to the tag the add-on installed.
During development, ``tools/deploy.sh <project>`` builds the working copy and
selects that local image for the target project.

..  _uninstall:

Uninstall
=========

..  code-block:: bash

    ddev add-on remove branchery
    ddev restart

The worktrees and their databases are kept on purpose, so an uninstall can be
undone by installing again. What is no longer wanted is removed by hand: the
checkouts under ``.worktrees/`` with ``git worktree remove``, and the databases
with ``ddev branchery database:prune --drop`` before the add-on goes, or with
``ddev mysql`` afterwards.
