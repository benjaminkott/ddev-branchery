:navigation-title: Lifecycle moments

..  _moments:

=====================================
Lifecycle moments and the environment
=====================================

What a project's file runs, when, and what every line of it can reach for.

..  _configuration-moments:

Lifecycle moments
=================

..  table:: When each moment is asked for
    :name: moments

    ============= =====================================================================================
    Moment        Asked when
    ============= =====================================================================================
    ``install``   the worktree is built — ``add``, ``fork``, ``provision``
    ``configure`` the same, and on every ``worktree:config``
    ``setup``     a worktree with no data to inherit: the application is installed
    ``migrate``   data was copied in — ``add``, ``fork``, ``sync`` — or a rebuilt worktree has its own
    ``finish``    the last step of every one of them, and of a version switch
    ============= =====================================================================================

A moment is the lines it runs, in the order they are written:

..  code-block:: yaml

    install:
      - ./bin/write-registry-token.sh
      - profile
      - npm ci

``profile`` is the one word in that list which is not a line to run: it is where
the configuration this is built on does its own work. So the list above writes a
token, then installs the dependencies the shipped profile installs, then builds
the assets — and a later change to that profile reaches this project. Left out,
the moment is what stands there and no more. The word is reserved; a program of
that name is written out as ``exec: profile``.

A line is a command, or a task written the way DDEV writes a hook task:
``exec:`` for a command, ``composer:`` for composer. A bare string is ``exec:``.
Everything runs in the worktree, in the project's web container, through a
shell, so pipes, ``&&`` and heredocs work. A line that fails stops the
operation.

A task may add ``optional: true``, and then a failure of that one line is a
warning rather than the end of the build:

..  code-block:: yaml

    install:
      - composer: install --no-interaction
      - exec: cd Build && npm ci
        optional: true

An operation that went past an optional line ends in ``⚠`` with the reason,
and ``--format=json`` carries it under ``warnings``. ``optional:`` is ``true``
or ``false``; anything else is refused. The shipped ``typo3-core`` marks its
``npm ci`` this way, because a branch whose lock file predates the container's
npm cannot install it and is still usable for work on PHP.

A moment written as an empty list (``finish: []``) is a moment that does nothing,
which is how a project takes something away that the shipped configuration does.

..  _configuration-environment:

Environment for commands
========================

The worktree a line is running for is in its environment. This is what lets a
shipped configuration be a file rather than a class, and what a project's own
line reaches for when it has to point at something:

``BRANCHERY_NAME``
    ``my-fix``

``BRANCHERY_BRANCH``
    the branch the worktree was made for — while it is checked out on something
    else, still that one

``BRANCHERY_URL``
    ``https://my-fix.blog.ddev.site/``

``BRANCHERY_HOST``
    ``my-fix.blog.ddev.site`` — what a site is found by

``BRANCHERY_TLD``
    ``blog.ddev.site`` — under whatever domain DDEV was given, ``ddev.site``
    unless ``project_tld`` says otherwise

``BRANCHERY_HOSTS_PATTERN``
    the same as a pattern, for a trusted-hosts setting

``BRANCHERY_PHP``
    the interpreter this worktree is served with

``BRANCHERY_NODE``, ``BRANCHERY_NPM``
    the Node and npm this worktree builds with — the same ones a bare ``node``
    or ``npm`` in a line reaches

``BRANCHERY_BIN``
    where the project's binaries are, as ``bin:`` says

``BRANCHERY_DOCROOT``
    what is served, as ``docroot:`` says

``BRANCHERY_DATABASE``
    this worktree's own database

``BRANCHERY_DB_DRIVER``, ``BRANCHERY_DB_HOST``, ``BRANCHERY_DB_PORT``, ``BRANCHERY_DB_USER``, ``BRANCHERY_DB_PASSWORD``
    the connection to it

``BRANCHERY_DB_URL``
    the same connection as one string

``BRANCHERY_ADMIN_USER``, ``BRANCHERY_ADMIN_PASSWORD``, ``BRANCHERY_ADMIN_EMAIL``
    the editor a setup creates: ``admin``, ``Password1!``,
    ``admin@example.com`` — a development login, the same in every worktree
