# Working on Branchery

How this repository is worked on. It is written for whoever picks it up next --
a person or an agent, the rules are the same.

## Interface changes are verified visually

**Anything that changes what the interface shows is looked at before it is
called done.** Not "the types check and the bundle built" -- looked at, in a
browser, in the state the change is about. A list whose rows had one cell fewer
than its head collapsed a column to a single character, and `--border-hairline`
is a *width* in Soul, so three borders written as `1px solid
var(--border-hairline)` never drew at all. Both typechecked, built cleanly, and
were obvious in the first screenshot.

**Ask what is running before starting anything.**

```bash
make status                  # what is up and where -- "make status PORT=9000" to ask elsewhere
make start                   # the interface and the manual -- only if nothing is
make down                    # stop both, wherever they were started
make restart                 # the two of those, and this terminal then holds them
```

Where something answers, that is the server: use it. It is very probably
somebody else's -- a terminal held open beside this one, the tab this change is
going to be looked at in, another session on the same tree -- and a second one
started over it takes the next port, so the change gets checked at an address
nobody is looking at. **A running server is left running**, through the whole
session: the bundle is rebuilt on every save, and killing it takes that browser
and every session beside you down with it. That `make down` exists does not make
it yours.

The mock is the exception, because it reads `dev/api.mjs` and `dev/fixtures.mjs`
once at start and never again -- a change to either is invisible until a
restart, so say so and ask for `make restart` rather than taking it.

The development server answers `/api` with an invented project, so the states
that are hard to produce against a real one are one line of data away in
`dev/fixtures.mjs`. An ending is asked for by the name it is asked with: a
branch carrying `fail` stops the operation in the middle, `warn` finishes it
having gone past something, `stale` gives it the lock file composer refuses.
Every component is judged where it stands -- there is no second page it is drawn
on beside the application.

What the check has to cover:

- **Both themes.** The palette is Soul's and both are one toggle away. A colour
  that only works in one of them is the classic broken artifact.
- **The state the change is about**, not only the happy one: a failed operation,
  an empty list, a name three times too long.
- **The real project too**, for what the mock cannot show -- long branch names,
  real composer output, a database that already exists. `tools/deploy.sh
  <project>` installs this working copy into a DDEV project; the add-on is
  baked into an image, so nothing takes effect without that.

## Before it is done

```bash
cd branchery/app
npm run check                # formatting, linter, types, tests, then the bundle and the stylesheet
npm run test:pages           # that every page draws -- a browser, against the mock
composer test                # PHPUnit
composer stan                # static analysis, level 8
composer cs                  # coding style
```

and, from the root, `bats tests/scripts.bats` -- what the two scripts in the web
container write.

`composer stan` is not optional politeness. Every operation ends in a container,
so the paths that only run against a real project -- a database that already
exists, a remote that is gone -- are the ones the tests are least likely to
walk. That is how `sync` was found broken: it typechecked, its tests passed, it
was deployed, and it died on `Call to undefined method` at its first step.

What the analyser cannot say anything about is the order those calls come in,
and that is what an operation is. `WebContainer` is an interface for that
reason: `tests/Fake` stands in for the container and remembers every command, so
what a worktree is built out of -- the checkout before anything installed into
it, the question asked before a database is dropped, the branch deleted after
the checkout it was in -- is a thing a test can hold to.

The PHP side needs 8.4. Where the host has an older one the container does the
work -- `docker run --rm -v "$PWD":/app -w /app php:8.4-cli php
vendor/bin/phpunit` -- and static analysis wants room in it: `php -d
memory_limit=1G vendor/bin/phpstan analyse`, because the image's own limit stops
the analysis partway and reports it as "severe errors", which reads like a
finding about the code and is nothing of the sort.

`npm test` runs what can be tested without a browser: the rules the interface
applies -- a name made into a hostname, a length of time, what a search leaves
standing -- and that the mocked API answers the same doors as the container,
with the same fields behind them.

`npm run test:pages` is the floor under the section above: a browser, the dev
server, and every address the router knows opened in turn. It checks that a page
draws and says what it is about, and nothing whatever about how it looks -- that
is still looked at. It is out of `npm run check` because it downloads a browser
engine; a server already answering on the port is used as it stands, so it runs
beside a `make start` rather than over it.

`bats tests/test.bats` is the only thing that walks the way a developer actually
arrives: `ddev add-on get`, in a project this repository has never seen, with
the image built from the working copy. `tools/deploy.sh` does not walk that
path -- it stages a clean copy first, which is why it kept working while `ddev
add-on get` had been failing outright on the symlinks in `app/node_modules`.

Run it before anything that changes **what the image contains, or where** --
which is wider than `install.yaml`, the `Dockerfile` and the shipped files, and
the wider reading is the one that matters. A file moving inside `app/` is none
of those three by the letter, and it was exactly that: `Container` went a
directory deeper and went on counting its way to the application from where it
used to stand, so a project could find neither the shipped configurations it
names nor the console every background operation starts. The unit tests, the
analyser and the API contract all passed. This suite forks a worktree and asks
for the manual, so it would have said so at once -- and it runs on every pull
request, so what failed was reaching for it here.

`bats tests/scripts.bats` needs no container at all: the two scripts in the web
container write what they write in functions that take what they need and print
what they make, and that half is read here. Applying it -- the pools, the
reloads -- is the half that still needs a project.

The same suite walks two more project shapes, because the paths that only exist
in them are the destructive ones: `DatabaseOperations` speaks a second dialect
and every statement in it drops or copies something, and `install.yaml` writes
Apache a module of its own. `BRANCHERY_TEST_DATABASE` and
`BRANCHERY_TEST_WEBSERVER` say which shape the project is configured as, and the
`shapes` job in the workflow runs both -- nightly and on `main`, not on every
pull request, each being a DDEV project built from nothing. Locally:
`BRANCHERY_TEST_DATABASE=postgres:16 bats tests/test.bats`.

### The application is an image, and a project installs a tag

`ghcr.io/benjaminkott/ddev-branchery:<version>`, built by
`.github/workflows/image.yml` when a `v*` tag is pushed. The compose file names
it, so an update is `ddev add-on get` and a restart, and there is no state in
which the container serves something other than what was installed.
`Installation` still compares the tag the compose file asks for with the one
baked into the image, because the failure this guards against is an update that
appears to have worked.

**A release is cut with `git tag -a`, and the message is the release page.**
`tools/release-notes.sh` reads it and the workflow creates the release from it,
so a lightweight tag or one with a subject and no body fails the build rather
than publishing a version nobody described. The release is made *after* the
image is pushed and never beside it: every project asks what the newest release
is and tells its developer to fetch it, so a release standing over a build that
failed sends all of them after an image that is not there. Three places say the
version and `tools/check-compose-tag.sh` holds them together -- the compose
file, the manual's footer, and the tag.

What travels as files is what has to: `branchery/scripts/` (they run in the
*web* container, which reaches them through `/mnt/ddev_config`), the host
command, the compose file. `install.yaml` removes those before the copy, and
with them what an older, file-based Branchery left behind -- `var/` is the
project's state and is never touched. A new shipped directory has to be added to
both lists or it will quietly never update.

Working on the add-on itself is the one case with no tag to pull:
`tools/deploy.sh <project>` builds the image from the working copy and points
the project at it through `BRANCHERY_DOCKER_IMAGE`, which is the one thing the
compose file leaves open.

## The house style

- **English**, everywhere: code, comments, documentation, commit messages.
- **Comments say why**, not what. A comment earns its place by explaining the
  decision behind it, the failure it prevents, or the thing that surprised
  somebody. Everything else -- what the name already says, what the line below
  says in words -- is deleted, not shortened.
- **A comment is a sentence, not a paragraph.** One line where one line does
  it, two or three at the outside, and the reason alone: not the state before
  it, not the argument that led to it, not the afternoon it was found on. The
  prose that gets written while a thing is being worked out belongs in the
  commit message, which is where the account of it is kept and where nobody
  reading the code has to walk past it.
- **Do not name counts of things.** "Fourteen services", "eleven routes" --
  every one of those is wrong at the next commit, and nobody updates them.
- **A name is a thing, not something that happened to it.** A participle
  standing where a noun belongs -- `Asked`, `Offered`, `Settled` -- names
  nothing the reader can hold: they have to rebuild the sentence it was cut out
  of before they know what they have. What reads a request is `Parameters`,
  what may be done to a worktree is `actions`, what a page states about one is
  its `summary`. Where the plain noun is dull, the dull one is right: a name is
  read a hundred times and worked out once. A predicate is the exception, since
  there it is a question and English asks it that way -- `wandered(worktree)`.
- **The mock mirrors the container**, and no longer only as a promise.
  `api-answers.json` says what every door answers with, field by field, and
  three readers are held to it: the container's own answers
  (`tests/Contract/ApiAnswersTest.php`), the mock's (`dev/answers.test.mjs`) and
  the interfaces in `frontend/types.ts`. A field added on one side and not the
  others fails there rather than reading exactly as it did. The same file holds
  what a door answers when it will not answer: the status is what the interface
  acts on, and both sides used to decide it apart from one another.
- **The layout of the sources is not an opinion.** Prettier writes it, and
  `npm run check` refuses what was not run through it. It is told to leave the
  inside of a `html` template alone, because whitespace in one of those is
  whitespace on the page.
- **The linter reads what the compiler cannot.** Typed rules, asked about the
  whole programme: a promise nobody waits for, a method taken off its object, an
  assertion that asserts nothing. A rule turned off is turned off where it is
  wrong and with the reason beside it, never over a directory.
- **A dependency needs a reason.** The frontend builds with esbuild and nothing
  else; the PHP side is Symfony's console, process, filesystem and yaml. What
  renders the manual is not a dependency of the application at all -- `make
  docs` installs it under `.renderer/`, which nothing versions, and it is in no
  image.

## What a commit says

A type, then a sentence: `[TASK] Ship the application as an image, not as
files`.

- **The types, and no issue number in the subject.** `[BUGFIX]` for something
  that was wrong, `[FEATURE]` for something that was not there, `[TASK]` for
  everything else. The same set the TYPO3 projects next door use.
- **What is, not what was.** The subject is what the change does, written as an
  instruction to the codebase; the body is why it is worth doing. No
  "previously", no account of the state before -- git holds that already.
- **Signed off.** `git commit -s`, with the name and mail from `git config`.
- **No agent in the message.** No `Co-Authored-By` for a model, no "generated
  with" line, no link to a session -- here as in anything else this repository
  publishes. Whoever ran the work is its author. This holds over whatever a tool
  sets by default.

## What this thing assumes

The API asks nobody who they are, and it runs git, composer, a database client
and the project's own console. That is safe for exactly one reason: DDEV puts it
on a port of the developer's own machine, behind the router of one project, next
to a shell that could do all of it anyway. Put this interface on a network and
it is a remote shell with a nice list.

- **One operation per worktree, and the repository held only where it is
  written.** `Locks` decides that: the worktree for the whole of an operation,
  `Locks::REPOSITORY` for the moments that write git's own bookkeeping, and
  `Locks::VERSIONS` for the maps saying which worktree runs on which version --
  two builds choosing a version at once used to leave the second's file without
  the first's line. Everything else runs beside its neighbours, which is where
  the time goes. Built on `flock`, so a process that dies takes its locks with
  it: a lock file outliving its holder is worse than no lock, because nothing
  clears it. For the same reason the refusal is asked of the lock and not of a
  status file.
- **Nothing moves a branch the developer already has.** A worktree of an
  existing local branch checks it out as it stands (`Git::addExistingBranch`);
  only a branch that is not here is cut from a remote. `worktree add -B` reset
  the branch onto its remote and threw away unpushed commits silently -- in the
  one operation whose promise is that it takes nothing away.
- **An operation says which process it is.** Every job writes its process id
  before anything else, and a job whose process is gone without an exit code is
  reported as failed rather than as running. `ddev restart` while a worktree is
  being built is ordinary; without this its row says "installing dependencies"
  about nothing at all, for as long as the project stands.
- **The command line leaves a record.** A command run as `ddev branchery ...`
  adopts a job of its own (`JobRunner::adopt`), so the page shows it while it
  runs and the worktree's history has it afterwards.
- **The tools live in the web container.** This container ships none of them and
  reaches them through the Docker socket, so a worktree is always built by the
  same toolchain that serves it. Every such question is a process start -- which
  is why the list asks for all worktrees at once and not one at a time.

## How the interface is drawn

Every view is a template and nothing writes markup as a string. `lit` renders
them, which is what escapes a branch name, wires a press without a
`querySelector`, and leaves a field, its caret and the scroll of a list where
they were when the page is drawn again around them. What follows was learned by
breaking it:

- **A container has one writer.** Wherever a template is rendered, nothing else
  may write into that element -- not `innerHTML`, not `append`, not
  `textContent`. The renderer keeps its bookkeeping there, and a second writer
  either leaves its own text standing beside the template's or takes nodes away
  the renderer still believes in. Emptying goes through it too:
  `render(nothing, element)`, not `replaceChildren()`.
- **A word inside a control of the system is written by the control.** Soul's
  button takes its label out of the element and puts it inside the button it
  draws, so written again the word goes where nothing reads it and the button
  keeps the one it was first drawn with -- while the attributes of that same
  element update perfectly, which is why it is found by reading the page in
  another language and by nothing else. A label that can change is wrapped in
  `saying()`, which makes the word the identity of the control: a different word
  is a different element, drawn rather than written into. A count in a label
  needs it as much as a language does.
- **A page the reader goes to takes the focus.** Nothing about the document
  changes when an address here does, so the focus stays on a row that is gone
  and the browser hands it to the body: whoever reads with a keyboard is then at
  the top of the document rather than of the page. `land()` in `app.ts` gives it
  to `#main` -- and the focus ring is taken off that one element, because the
  page is not a thing to act on.

What is fetched afterwards -- a history, the steps of one entry, a page of the
documentation -- is kept beside the view and the view is drawn again. Nothing
patches what it drew.

## The design system is the system

The interface is Soul's, not its own: colours, type, spacing and every control
come from the
[Soul Design System](https://typo3.github.io/soul-design-system/frontend/index.html),
and what lives in `frontend/app.css` is the arrangement between them.

- **Never a colour literal.** Not a hex, not an `rgb()`, not a named colour -- a
  token, and where none fits, the honest answer is a token, not a local value.
  The same goes for spacing and type.
- **One accent, three places.** `--accent` belongs to the active navigation
  item, the shell prompt and the pipe in the wordmark. A fourth use makes those
  three stop meaning anything -- so the step being worked on is drawn in the ink
  of the page and told by its movement.
- **The `sds-` namespace is Soul's.** What belongs to this interface is
  `branchery-`, with `__` for the parts of a block and `--` for its variants;
  transient state is `.is-*`, which is Soul's own spelling for it.
- **A component is steered through its own tokens.** `--sds-btn-fill` on the
  button, not a rule that redraws what the button draws. The few places that do
  reach into what Soul renders say in a comment what they could not get any
  other way -- and every one of them is a candidate for a bug report there.
- **The default size is the size.** Reaching for `sm` on buttons, fields and
  dropdowns because a surface feels full makes the page small and hard to read;
  the crowding it was meant to answer is a layout that wants fixing instead.
- **There is a floor, and below it nothing is drawn.** `light-dark()`, `:has()`
  and nesting are used without fallbacks, because a fallback for one of them
  would be the only thing left standing.
- **`soul-boot.js` loads before the stylesheets.** It is what remembers the
  reader's mode, and it has to have set it before the first paint -- see
  `public/index.html`, where the order is deliberate.

`npm run build:soul` copies the system into `public/soul/`; nothing there is
edited by hand.

## The manual is a site, not a page of the application

The documentation is reStructuredText under `branchery/docs/`, rendered by
phpDocumentor's guides wearing Soul's own theme and published as a site of its
own. `index.rst` is the product page; the toctree under it is the manual.

```bash
make docs                    # into site/
make docs-serve              # the same, at http://localhost:8044
```

It is two steps and not the renderer's own `--watch`: the theme's stylesheet,
script and fonts are laid down by the finishing step, so a server put in front
of the render alone serves the pages with nothing drawing them.

The application no longer renders these pages -- a manual only readable by
somebody who had already installed the add-on is one nobody can be sent to. What
it keeps is the way in from a shell, `ddev branchery docs [<page>]`, which is
why the sources still travel in the image.

- **The reading order lives in the toctree**, and `Docs::pages()` reads it
  there. A second list beside it is a second place to keep in step.
- **A section of the manual is a directory**, and the four at the root --
  `getting-started/`, `use-branchery/`, `reference/`, `architecture/` -- are the
  four the index names. A page stands in the one it is read under, so the slug
  carries it: `reference/configuration`, which is what `ddev branchery docs`
  prints and what the site serves. The name alone still reaches a page, since
  that is what somebody types. A toctree entry and a `:doc:` are read the way
  the renderer reads them -- from the directory of the page that names them, or
  from the root with a leading slash -- and so is a `figure::`, which is why the
  drawings are named `/images/...`.
- **Nothing about the site is committed, and neither is the renderer.** `make
  docs` installs the theme at whatever version is current, into a directory git
  does not carry, and the workflow renders through the same target -- so a
  published site that disagrees with the sources is a state that cannot arise.
- **It renders with `--fail-on-error`.** A `:ref:` that no longer resolves reads
  as ordinary text, and nobody notices a link that quietly stopped being one.

A page of it is looked at the way any other interface change is -- both themes,
the state the change is about.

## Where things are

A namespace under `src/` says what a thing is, and it only says that for as
long as it can be read on its own -- so **no two of them may need each other**.
`App\` itself holds what everything is made of and nothing depends on anything
of ours there, `Container` excepted: a composition root reaches every namespace
by definition and nothing reaches it, so it is what draws the graph rather than
a part of it, and `tests/LayersTest.php` passes over it for that reason. That
test walks the graph the imports draw and fails on any way back to where it
started -- a cycle between namespaces is invisible to the compiler, to the
analyser and to every other test, and it is what turned the old `Service\` into
forty classes under a name that had stopped meaning anything.

**And a directory is only worth having at the size a reader opens.** Cutting
until nothing needed anything back left six directories holding one, two or
three files -- a namespace for a single class is a namespace that says nothing
either. Where the subject is the same, they stand together: what keeps two
operations apart lives with the operations (`Jobs`), what is reached through the
docker socket lives together (`Web`), and what a worktree is served with lives
with the worktree.

| | |
|---|---|
| `branchery/app/src/` | the REST API and the console, PHP -- and at the top level what everything is made of, with `Container` wiring it |
| `branchery/app/src/Operation/` | what an operation is made of -- the order it is put in is `WorktreeManager` |
| `branchery/app/src/Http/` | what a request becomes: the routes, the controller, the answer |
| `branchery/app/src/Config/` | what a project says about how its branches are built -- read, and laid over the shipped file it names; it runs nothing |
| `branchery/app/src/Worktree/` | what a worktree is, what it is served with, and the place a recipe's lines run in it |
| `branchery/app/src/Git/`, `Web/` | the tools: git, and everything else reached through the docker socket |
| `branchery/app/src/Jobs/` | a long operation -- how it starts, how it reports, and what keeps two of them off one worktree |
| `branchery/app/api-answers.json` | what the API answers with, field by field -- both halves are checked against it |
| `branchery/app/frontend/` | the interface, TypeScript: the shell, the store, the way to the API |
| `branchery/app/frontend/rules/` | what the interface decides, each one testable without a browser -- a name made into a hostname, what a search leaves standing, what may be done to a worktree |
| `branchery/app/frontend/views/` | the pages, the dialogs and the pieces they are drawn from -- a page is a lit element, and `view.ts` is what one is |
| `branchery/app/dev/` | the mocked API the interface is developed against |
| `branchery/app/defaults/` | the shipped configurations -- what `profile: typo3-app` means, as files |
| `branchery/app/tests/` | what is worth testing without a project: the parsing, the naming, the generated configuration |
| `branchery/docs/` | the documentation and the product page, reStructuredText -- a directory per section of the manual, as the toctrees have it |
| `install.yaml`, `commands/`, `docker-compose.*` | what DDEV installs |
| `tools/` | what is run by hand or by a workflow and ships with neither |

[branchery/docs/reference/operations.rst](branchery/docs/reference/operations.rst)
says what every operation does, step by step;
[branchery/docs/reference/configuration.rst](branchery/docs/reference/configuration.rst)
says what a project writes in `.ddev/branchery.yaml`, key by key.

**Nothing about a project is guessed.** An operation makes a worktree -- a
checkout, an address, a PHP version, an empty database -- and everything beyond
that is in the project's own file or does not happen. There is no detection and
there are no profile classes; what a TYPO3 needs is `defaults/typo3-app.yaml`,
written in the same grammar a project writes, reached through `profile:` and
amended by everything said beside it. A shipped file talks to the worktree
through the environment (`BRANCHERY_DATABASE`, `BRANCHERY_BIN`, ...), which is
what lets it be a file at all.

That file is a public contract: written by hand in projects this add-on never
sees, and not correctable by an update. A change to what it accepts is a change
nobody can take back -- add to it, never rename or narrow it.
