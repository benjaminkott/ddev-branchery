:navigation-title: Data and addresses

..  _data-source-and-site-addresses:

==============================
Data source and site addresses
==============================

``data.from`` is ``source`` to copy the database of the checkout this worktree
is created from, or ``none`` to start empty. ``data.needs`` names unversioned
files or directories that must travel with that data. ``data.addresses`` names
files in which copied DDEV URLs may be pointed at the new worktree.

Every worktree answers at an address of its own, and a site has to know it.
Where the data comes from the project checkout — which is every worktree, since
one is built with the project's own data — the site configuration that reads
that data comes with it, and Branchery points the addresses in it at this
worktree: every ``https://….ddev.site`` in ``config/sites`` and
``typo3conf/sites`` is rewritten to
``https://<worktree>.<project>.ddev.site/``. The settings file comes along with
it where the worktree has none of its own — an application that has never been
set up has no ``settings.php``, boots as an installer, and runs every console
command without the container it needs.

**Only where the branch does not have that configuration under version
control.** A committed ``config/sites/main/config.yaml`` is the project's file:
writing a developer's worktree address into it leaves every worktree standing in
the list with an uncommitted change, and the one change in it is the one that
must never be pushed. So nothing is written into it, and the operation says in
its log which address the worktree answers at instead.

A project that commits its site configuration says where its address comes from,
and has three ways to do it. Branchery hands the address over in the environment
of the worktree — in ``additional.php``, which is loaded before any site is
read, and to every command an operation runs:

``BRANCHERY_HOST``
    ``my-fix.blog.ddev.site`` — what a site is found by

``BRANCHERY_URL``
    ``https://my-fix.blog.ddev.site/``

``BRANCHERY_NAME``
    ``my-fix``

``BRANCHERY_BRANCH``
    the branch the worktree was made for (commands only)

``BRANCHERY_DATABASE``
    ``branchery_my_fix`` (commands only)

**A relative base.** The shortest answer, and the one that needs nothing from
Branchery: a site whose base is ``/`` is served at whatever address reaches it.

..  code-block:: yaml
    :caption: config/sites/main/config.yaml

    base: /

**The address out of the environment.** TYPO3 resolves ``%env(…)%`` in
``config.yaml`` against the environment, so the site asks for the host it is
being served at:

..  code-block:: yaml
    :caption: config/sites/main/config.yaml

    base: 'https://%env(BRANCHERY_HOST)%/'

The project checkout itself is not a worktree and has no such variable, so it
says its own once, where DDEV keeps the environment of the web container:

..  code-block:: yaml
    :caption: .ddev/config.yaml

    web_environment:
      - BRANCHERY_HOST=blog.ddev.site

That is the whole of the setup. Every worktree is then right at its own address
without a file being touched, and ``git status`` in a fresh worktree is empty.
The placeholder is resolved when the configuration is read and cached with it --
which is no trouble here, because every operation ends with ``finish``.

..  _data-other-hostnames:

A project with more than one domain
===================================

A project that serves a second site at a second domain has told DDEV so, in
``additional_hostnames`` or ``additional_fqdns``. What the project has, every
worktree has: for each of those hostnames a worktree answers at one more
address of its own, under the wildcard, named after the worktree and the
hostname's label.

..  code-block:: text

    site-b.ddev.site          ->  <worktree>-site-b.blog.ddev.site
    shop.blog.ddev.site       ->  <worktree>-shop.blog.ddev.site
    shop.example.test         ->  <worktree>-shop-example-test.blog.ddev.site

The label is the hostname with what DDEV appends taken off, and with dots as
hyphens where a domain of the project's own keeps them. Nothing has to be
declared: the addresses follow from what DDEV routes, and a project that
changes its hostnames changes every worktree's addresses at the next
``ddev restart`` -- the worktrees built before included, which are linked under
their new addresses as the container starts.

A copied site configuration is pointed at these addresses hostname by
hostname, so the second site stays a second site instead of folding into the
main address; a committed one asks for them the way it asks for the main
address, by label:

..  code-block:: yaml
    :caption: config/sites/site-b/config.yaml

    base: 'https://%env(BRANCHERY_HOST_SITE_B)%/'

``BRANCHERY_HOST_<LABEL>`` and ``BRANCHERY_URL_<LABEL>`` stand in the
environment of every worktree beside ``BRANCHERY_HOST``, the label in capitals
with hyphens as underscores. The project checkout sets its own in
``web_environment``, as it does for ``BRANCHERY_HOST``.

Two names are not a worktree's to take because of this. A hostname the project
put directly under its own name -- ``shop.blog.ddev.site`` -- is what the
wildcard would serve for a worktree called ``shop``, so the project keeps that
name and the operation refuses it. And ``<worktree>-<label>`` is an address, so
a worktree cannot be called what another worktree's second address is, nor be
given a name whose second address is a worktree already; both are refused
before anything is built, with the name that is in the way.

**A step of the project's own.** Where neither fits — a base that is stored
somewhere else, a second site that has to be renamed, an address in a fixture --
this file is the place: ``migrate.after`` runs after the data has arrived, with
the whole environment above in it.

..  code-block:: yaml
    :caption: .ddev/branchery.yaml

    migrate:
      after:
        - ./bin/point-the-sites-at "$BRANCHERY_URL"
