:navigation-title: Copied files

..  _copied-files:

============
Copied files
============

Branching off copies everything git ignores from the source into the new
worktree: ``vendor/``, generated files, configuration, uploads. That is what
makes a fork run without a build in a project this add-on has never seen.

The shipped configurations leave ``var``, ``typo3temp``, ``.vscode`` and
``.idea`` behind. The first request rebuilds them, and a compiled container
carried into a checkout of other code fails on the first service it asks for,
with nothing in the message about the directory that was copied. ``.git``,
``.ddev`` and the directory the worktrees live in never travel, whatever is
written; a recipe that names one of them is refused.

A project changes the answer under ``copy``:

..  code-block:: yaml
    :caption: .ddev/branchery.yaml

    copy:
      except:
        - node_modules       # rebuilt by "npm ci", and the size of a small country
        - .build/var

``except`` keeps the ordinary answer and takes these out of it, on top of the
defaults above. A path may lie inside something that does travel: ``.build/var``
leaves the caches out of a ``.build/`` that is otherwise copied whole. Paths
are read from the root of the checkout and mean that one place, not every
directory of that name down the tree.

Written beside ``profile:``, this list stands instead of the shipped one rather
than adding to it, so a project that wants ``var`` carried after all writes
``except: []`` — or names the ones it does want left behind and leaves ``var``
out of them.

A list says the whole thing instead:

..  code-block:: yaml

    copy:
      - .build
      - config
      - fileadmin

Then exactly those travel, whether git ignores them or not, and nothing else
does.
