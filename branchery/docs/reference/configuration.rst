:navigation-title: Configuration

..  _configuration:

=======================
Configuration reference
=======================

An operation makes a checkout of a branch, an address of its own, a PHP
version and an empty database. Everything beyond that is written in
``.ddev/branchery.yaml`` or does not happen: without the file, no dependencies
are installed, no application is set up and no data is copied.

Start from a shipped profile, then override only what this project needs:

..  code-block:: yaml
    :caption: .ddev/branchery.yaml

    profile: typo3-app

``ddev branchery config:example --profile=typo3-app --write`` writes exactly
that, and ``--full`` prints the shipped file it names, to read and to copy out
of.

..  table:: The keys
    :name: keys

    ================================================================ ================================================= ===========================================
    Key                                                              What it says                                      Where
    ================================================================ ================================================= ===========================================
    ``profile``                                                      the shipped configuration this builds on          :ref:`configuration-profiles`
    ``docroot``, ``bin``                                             what is served and where the binaries are         :ref:`configuration-basic`
    ``entrypoints``                                                  the pages a worktree is opened at                 :ref:`configuration-basic`
    ``php``, ``node``                                                the versions, or where they are written down      :ref:`php-and-node-versions`
    ``install``, ``configure``, ``setup``, ``migrate``, ``finish``   what runs at each moment of a build               :ref:`configuration-moments`
    ``copy``                                                         what travels from the source into a fork          :ref:`copied-files`
    ``data``                                                         where the data comes from and what comes with it  :ref:`data-source-and-site-addresses`
    ``links``                                                        where review, issue and commit lead               :ref:`configuration-links`
    ================================================================ ================================================= ===========================================

..  _configuration-profiles:

Start with a profile
====================

..  table:: The shipped profiles
    :name: shipped-profiles

    ================ ==================================================
    Name             What it is
    ================ ==================================================
    ``typo3-app``    a TYPO3 instance, or an extension that builds one
    ``typo3-core``   the TYPO3 core repository, served from its own root
    ``symfony``      a Symfony application
    ``composer``     ``composer install``, and nothing else
    ================ ==================================================

They live in the image under ``defaults/``, written in the grammar below, and
are the worked examples this documentation would otherwise have to repeat. What
a project writes beside ``profile:`` stands over them.

..  _configuration-example:

Complete example
================

..  code-block:: yaml
    :caption: .ddev/branchery.yaml

    profile: typo3-app     # the shipped configuration this is built on
    docroot: web           # what is served; "" is the checkout itself
    bin: .build/bin        # where this project's binaries are
    php: "8.3"             # the version this is served with

    # The pages worth opening, in the order they are offered. Written empty,
    # the list says this project has none although its profile has.
    entrypoints:
      - Backend: /typo3
      - Storybook: /storybook

    # Where the work in a checkout is talked about. The number comes out of the
    # last commit's own trailers -- "Change-Id" and "Resolves: #12345" -- and is
    # put where the placeholder is.
    links:
      review: https://review.typo3.org/q/{change}
      issue: https://forge.typo3.org/issues/{issue}
      commit: https://github.com/typo3/typo3/commit/{commit}

    # What travels from the source into a new worktree. A list is what travels;
    # "except" keeps everything git ignores and takes these out.
    copy:
      except:
        - node_modules

    # Where a new worktree's data comes from, and what has to travel with it in
    # order to be readable at all.
    data:
      from: source         # the checkout this one was cut from; "none" for an empty database
      needs:
        - config/sites
        - config/system/settings.php
      addresses:
        - config/sites

    # A moment is the lines it runs, in order. "profile" is where the shipped
    # configuration does its own work, so this installs what typo3-app installs
    # and builds the assets afterwards. This is what most projects need.
    install:
      - profile
      - npm ci
      - npm run build
      - composer: dump-autoload --classmap-authoritative

    # Left out, the moment is what stands here and no more.
    setup:
      - ./bin/install-fresh.sh

Every key is optional, and every one of them is refused if it is spelled wrong
-- a key that silently did nothing would leave a worktree missing exactly the
step the file was written for.

..  note::

    The file is separate from ``.ddev/config.yaml``: DDEV rewrites its own file
    when ``ddev config`` runs and would drop keys it does not know. Do not put
    project configuration in the generated ``config.branchery.yaml`` either; an
    add-on update replaces that file.

..  _configuration-basic:

Basic project settings
======================

``profile`` names the shipped configuration this project builds on. Everything
written beside it overrides or extends that profile as described below.

``docroot`` is the directory served for the worktree, relative to its checkout.
An empty string serves the checkout root. ``bin`` is the relative directory that
contains project commands and is exposed to configuration tasks as
``BRANCHERY_BIN``.

``entrypoints`` are the pages a worktree is worth opening at, each written as
the word it is offered under and the path it stands at. They are drawn beside
the site link, in the order they are written. A path and not a whole address:
the worktree's own is put in front of it. ``php`` and ``node`` select runtimes
and are described under :ref:`php-and-node-versions`.

..  _php-and-node-versions:

PHP and Node versions
=====================

``php:`` and ``node:`` are a version, or the file in the checkout it stands in:

..  code-block:: yaml

    php: "8.3"

    node:
      read: Build/.nvmrc

``read`` names the file and nothing more. A file made to hold a version — a
``.nvmrc``, a ``.node-version`` — holds one line and is read without being told
how: the first line that is neither blank nor a remark, without the ``v`` such a
file may or may not carry. A word rather than a number, ``lts/iron``, is handed
on as it stands.

``match`` is for a file that holds more than the version, and it is the only
reason to write one:

..  code-block:: yaml

    php:
      read: Build/Scripts/runTests.sh
      match: 'PHP_VERSION="(\d+\.\d+)"'

That is what ``typo3-core`` says, because a core branch names the version it
tests itself with. A version written out is read before anything is created, so
a branch asking for a version the web image has no pool for is refused while
nothing exists yet. What was read, and out of which file, is said in the log of
the operation either way — and so is a file that held no version.

Most projects need neither spelling for Node: a checkout that says which version
it wants in the usual places — ``.nvmrc``, ``.node-version``, or the ``engines``
of the root ``package.json`` — is read without being asked to, and ``node:`` is
for a project that keeps the file somewhere else. ``typo3-core`` is such a
project, which is where the lines above come from: its ``.nvmrc`` is under
``Build/``.

Nothing is served with Node, so nothing about it is refused ahead of time. The
version decides what a line like ``npm ci`` runs as — it is put in front of the
path for every line of the configuration, and it is ``$BRANCHERY_NODE`` and
``$BRANCHERY_NPM`` for a line that would rather name it. Where nothing says
which version, the web container's own applies. A version that is not in the
cache is fetched once, into a cache that belongs to the project rather than to
the worktree: the next branch that asks for it has it without a download, and so
does this one after a restart.

..  _configuration-links:

Review, issue and commit links
==============================

``links`` says where the numbers in a checkout lead. Branchery reads the last
commit's trailers, ``Change-Id`` and ``Resolves: #12345``, and draws the review
and the issue beside the worktree's own address. ``links.commit`` is how one of
the checkout's commits is addressed; where it says nothing, the sha stands as
text.

..  code-block:: yaml
    :caption: .ddev/branchery.yaml

    links:
      review: https://review.typo3.org/q/{change}
      issue: https://forge.typo3.org/issues/{issue}
      commit: https://github.com/typo3/typo3/commit/{commit}

The shape is the forge's: ``…/commit/{commit}`` on GitHub, GitLab and Gitea,
``…/commits/{commit}`` on Bitbucket. The review is asked for by ``Change-Id``
because Gerrit's change number is nowhere in the commit. An address without its
placeholder is refused. ``typo3-core`` answers for itself, since it is the TYPO3
repository.

..  _configuration-not-hooks:

Worktree moments are not DDEV hooks
===================================

DDEV's hooks fire at the moments of a *project*: ``post-start``,
``post-import-db``, ``pre-composer``. Branchery's moments are those of a
*worktree* being built, and DDEV has no hook for that — so a project's
``post-start`` does not run when a worktree is created, and it should not: it
fires once for the project and usually assumes the project's own docroot. Where
the same work is wanted for every worktree, it belongs here.

..  _configuration-precedence:

Configuration precedence and branches
=====================================

Branchery looks for the file in the worktree first and in the project checkout
second. A file committed to a branch therefore travels with it: a branch whose
build is different carries the difference in its own commit, every worktree of
it is right without anybody remembering a setting — and so is every branch made
from that one, because the file comes along with the checkout it was cut from.

A file it names under ``profile:`` is the same file in the same grammar, and
this one is laid over it: a key written here stands, a key left out is the
shipped one's. ``links``, ``data`` and ``copy`` are laid over key by key, since
their keys are written one at a time — a project that says where its issues are
tracked keeps the review address it is built on. A list written empty is an
answer and not a silence: ``copy: {except: []}`` is how a project takes back
what the configuration it names keeps out of a fork.

Anything the file says that Branchery does not understand is refused, not
ignored. Every operation that touches such a worktree stops and says which key
it did not understand, the list itself keeps working, and where it is the
project's own file that is unusable the interface says so at the top of every
page.

..  toctree::
    :hidden:

    moments
    copied-files
    data
