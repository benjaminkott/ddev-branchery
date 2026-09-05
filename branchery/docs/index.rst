:layout: marketing
:navigation-title: Branchery

======================================
Every branch, ready beside the project
======================================

..  hero:: images/branchery-hero.svg

    Run several branches at once, each with its own URL, PHP runtime and
    database, while the project checkout keeps running.

    ..  button-bar::

        ..  button:: :doc:`/getting-started/quickstart`
            :icon: actions-arrow-right
            :size: lg

        ..  button:: `Repository <https://github.com/benjaminkott/ddev-branchery>`__
            :variant: secondary
            :icon: actions-brand-github
            :size: lg

..  band:: Quick start
    :quiet:
    :id: quick-start

    Pull Branchery into an existing DDEV project and restart it.

    ..  code-block:: bash

        ddev add-on get benjaminkott/ddev-branchery
        ddev restart

    ..  warning::

        **Branchery is a pre-release.** The interface, the API and the shipped
        profiles can still change from one version to the next. What a project
        writes in ``.ddev/branchery.yaml`` is the part already held steady — that
        grammar is added to, never renamed or narrowed. A worktree is a checkout
        beside the project, so keep anything you would miss on a remote.

..  band:: What a worktree is
    :id: what

    A worktree is a branch checked out beside the project instead of over it.
    Branchery gives that checkout everything it needs to run in a browser.

    ..  grid:: flush

        ..  card:: An address of its own
            :icon: actions-globe

            ``feature/checkout`` is served at its own DDEV URL while the
            project checkout keeps answering at its existing address.

        ..  card:: A database of its own
            :icon: actions-database

            Start empty, copy the project's data, or restore a dump without
            touching the database beside it.

        ..  card:: A PHP version of its own
            :icon: actions-code

            Assign the runtime the branch needs. Different PHP versions remain
            available at the same time.

        ..  card:: A record of how it was built
            :icon: actions-list

            Every operation records its steps. If it stops, the record says
            where and names the safe command to continue.

..  band:: From a branch to a worktree
    :quiet:
    :id: does

    You name a branch, and what stands there afterwards is a worktree of it.
    The interface and ``ddev branchery worktree:add`` build the same one.

    ..  split::
        :align: center

        ..  half::

            ..  steps::

                ..  step:: The branch is checked out beside the project

                    ``.worktrees/feature-checkout``, cut from the branch. The
                    project checkout is not moved and stays on the branch
                    it was on.

                ..  step:: The worktree gets an address and a runtime

                    It answers without a DDEV restart, with the PHP version the
                    branch asks for — a pool of its own where that differs
                    from the project's.

                ..  step:: The project's own build runs inside it

                    ``composer install``, ``npm ci``, whatever
                    ``.ddev/branchery.yaml`` names — in the project's web
                    container, so a worktree is built by the same toolchain
                    that serves it.

                ..  step:: It is given a database, and a way to reach it

                    Empty, or the project's data copied in and the schema
                    fitted to the code that is checked out. The connection and
                    the address are written into the checkout, and
                    ``database:sync`` refills it whenever you ask.

                ..  step:: What was done to it stays on record

                    Every step, what it printed and where it stopped — on the
                    worktree's page and in the shell, whichever end started the
                    work.

        ..  half::

            ..  code-block:: bash

                ddev branchery worktree:add feature/checkout

            ..  code-block:: text
                :caption: What stands there afterwards

                https://feature-checkout.blog.ddev.site
                .worktrees/feature-checkout
                branchery_feature_checkout

..  band:: Nothing about a project is guessed
    :id: configuration

    ..  split::

        ..  half::

            An operation creates a checkout, an address, a PHP version and an
            empty database. Everything beyond that is written in the project's
            own ``.ddev/branchery.yaml`` or does not happen.

            Shipped profiles cover TYPO3 applications, TYPO3 Core, Symfony and
            Composer-only projects. A project can amend every profile through
            the same public configuration grammar.

            Which steps are Branchery's own and which stand in that file is
            drawn step by step in :doc:`/reference/operations`.

        ..  half::

            ..  code-block:: yaml
                :caption: .ddev/branchery.yaml

                profile: typo3-app
                php: "8.3"
                docroot: web

..  band::
    :quiet:
    :id: ends

    ..  split::
        :align: center

        ..  half:: Two ends, one record

            The web interface and the command line perform the same operations
            and leave the same history. A command run as ``ddev branchery ...``
            adopts a job of its own, so the page shows it while it runs and the
            worktree's history has it afterwards.

            ..  code-block:: bash

                ddev branchery worktree:list
                ddev branchery worktree:add 13.4
                ddev branchery launch

        ..  half::

            ..  image:: images/branchery-record.svg

..  band:: The manual
    :id: manual

    ..  grid:: flush

        ..  card:: :doc:`getting-started`
            :label: Start here
            :action: Read it

            From installing the add-on to the first usable worktree.

        ..  card:: :doc:`use-branchery`
            :label: Guides
            :action: Read it

            Operate a worktree, manage its data, work in an editor and recover
            safely when something stops.

        ..  card:: :doc:`reference`
            :label: Reference
            :action: Read it

            Configure a project and drive Branchery from scripts or through
            its API.

        ..  card:: :doc:`architecture`
            :label: Under the hood
            :action: Read it

            See where the checkout and state live, what a worktree costs on
            disk, and which boundaries keep operations safe.

..  toctree::
    :hidden:

    getting-started
    use-branchery
    reference
    architecture
