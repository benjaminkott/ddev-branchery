:navigation-title: Carried files

..  _carried-files:

=============
Carried files
=============

Branching off carries everything git ignores from the source into the new
worktree: ``vendor/``, generated files, configuration, uploads. That is what
makes a fork run without a build in a project this add-on has never seen.

The shipped configurations leave ``var``, ``typo3temp``, ``.vscode`` and
``.idea`` behind. The first request rebuilds them, and a compiled container
carried into a checkout of other code fails on the first service it asks for,
with nothing in the message about the directory that was copied. ``.git``,
``.ddev`` and the directory the worktrees live in never travel, whatever is
written; a recipe that names one of them is refused.

A project changes the answer under ``carry``:

..  code-block:: yaml
    :caption: .ddev/branchery.yaml

    carry:
      except:
        - node_modules       # rebuilt by "npm ci", and the size of a small country
        - .build/var

``except`` keeps the ordinary answer and takes these out of it, on top of the
defaults above. A path may lie inside something that does travel: ``.build/var``
leaves the caches out of a ``.build/`` that is otherwise copied whole. Paths
are read from the root of the checkout and mean that one place, not every
directory of that name down the tree.

A list says the whole thing instead:

..  code-block:: yaml

    carry:
      - .build
      - config
      - fileadmin

Then exactly those travel, whether git ignores them or not, and nothing else
does.
