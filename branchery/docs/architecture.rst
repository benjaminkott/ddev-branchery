:navigation-title: Architecture

..  _architecture:

===================
How Branchery works
===================

Branchery adds worktrees without replacing the DDEV project's docroot, web
server or database service. Its application is an image; the checkouts and their
state belong to the project.

..  grid::

    ..  card:: :doc:`what-runs-where`
        :action: Read it

        The containers, the addresses, the files that are written, and what a
        worktree costs on disk.

    ..  card:: :doc:`safety`
        :action: Read it

        Locks, branch safety, operation records and the trust boundary.

..  toctree::
    :hidden:

    what-runs-where
    safety
