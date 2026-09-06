# What this repository is worked on with, each target installing what it
# needs. Anything finer grained is a command of its own, where it has always
# been -- "npm run build:css" in branchery/app, "composer cs:fix" beside it,
# "bats tests/test.bats" for the add-on as a whole, "tools/deploy.sh --help" for
# what else that can do.

APP := branchery/app

# The project to install into is named as a word of its own -- "make deploy
# site-new". make would take it for a second target, so it is filtered out of
# the goals and given a rule that does nothing. Without a name the script says
# which projects there are.
ifneq ($(filter deploy,$(MAKECMDGOALS)),)
PROJECT := $(filter-out deploy,$(MAKECMDGOALS))
$(eval $(PROJECT):;@:)
endif

NPM := npm --prefix $(APP)
COMPOSER := composer --working-dir=$(APP)

# The manual is rendered by phpDocumentor's guides wearing Soul's theme, out
# of a composer installation of its own: it is a tool this repository uses and
# not something the application depends on, so it stays out of the app's own
# package list and out of the image.
DOCS := branchery/docs
RENDERER := .renderer
SITE := site
GUIDES := $(RENDERER)/vendor/bin/guides
FINISH := $(RENDERER)/vendor/typo3/soul-guides-theme/resources/dist/soul-finish.js

# Where the two of them answer. The manual is not on the interface's port, so
# both can stand at once: it links into the application and the application
# links back. Either can be moved -- "make dev PORT=9000" -- and "make status"
# then asks where it was told to look.
PORT ?= 8042
DOCS_PORT ?= 8044

.DEFAULT_GOAL := help
.PHONY: help status start restart down dev check deploy docs docs-serve

help:
	@awk 'BEGIN { FS = ":.*## " } /^[a-z-]+:.*## / { printf "  \033[1m%-11s\033[0m %s\n", $$1, $$2 }' \
		$(MAKEFILE_LIST)

# What is already up, before anything is started over it.
#
# The rule is that a running server is left running: it belongs to a terminal
# held open beside this one, to the browser tab a change is about to be looked
# at in, or to another session working on the same tree. That rule is only
# followable if the server can be found, and a second one started over it takes
# the next port and serves the same working copy from an address nobody is
# looking at -- so the change gets checked in a window that is not the one on
# screen.
#
# Which is why the ports above the interface's are asked as well: that is where
# a second one lands, because the dev server steps aside when its own is taken.
# Answered by opening a socket rather than by a request: what is wanted is
# whether something holds the port, and a server still building its bundle
# holds it before it answers anything.
status: ## What is running and where -- ask before starting anything
	@up() { python3 -c 'import socket, sys; s = socket.socket(); s.settimeout(0.3); sys.exit(0 if s.connect_ex(("127.0.0.1", int(sys.argv[1]))) == 0 else 1)' "$$1"; }; \
		say() { printf '    %-10s %-24s %s\n' "$$1" "http://localhost:$$2" "$$3"; }; \
		printf '\n'; \
		up $(PORT)      && say interface $(PORT)      'running'     || say interface $(PORT)      'not running -- "make start"'; \
		up $(DOCS_PORT) && say manual    $(DOCS_PORT) 'running'     || say manual    $(DOCS_PORT) 'not running -- "make start"'; \
		for port in $$(seq $$(($(PORT) + 1)) $$(($(PORT) + 3))); do \
			[ "$$port" = "$(DOCS_PORT)" ] && continue; \
			up $$port && say also $$port 'answering -- a second interface?'; \
		done; \
		printf '\n'

# Both ends of the working day at once, and what each of them is for -- the
# shape "make start" has in typo3-design-system next door, where a reader
# arriving from one repository already knows to look for it.
#
# What does not come across is that repository's detached start: it runs on
# docker compose, which supervises the processes and can be asked afterwards
# what is up. These are two processes on the host, so the same trick would mean
# pid files -- and a pid file that outlives its process is the stale state
# `Locks` uses flock to avoid a few pages further down. So the terminal is
# held: the dev server keeps it, because it is the one with something to say --
# which request was answered, which job was made to fail -- and the manual is
# served quietly behind it. Ctrl-C reaches both, since they share a process
# group; the kill afterwards is for the other way out, where the dev server
# stops by itself because its port is taken.
start: $(APP)/node_modules $(RENDERER)/vendor ## Both ends: the interface and the manual
	@$(MAKE) --no-print-directory docs
	@python3 -m http.server $(DOCS_PORT) --bind 127.0.0.1 --directory $(SITE) >/dev/null 2>&1 & \
		manual=$$!; \
		trap 'kill $$manual 2>/dev/null; exit 0' INT TERM; \
		printf '\n  running:\n'; \
		printf '    %-10s %-21s  %s\n' \
			interface "http://localhost:$(PORT)"         "the application, against a mocked API" \
			manual    "http://localhost:$(DOCS_PORT)"    "the documentation and the product page"; \
		printf '\n  ^C stops both.\n'; \
		$(NPM) run dev; \
		kill $$manual 2>/dev/null

# The way to give the mock the files it read once at start -- "dev/api.mjs" and
# "dev/fixtures.mjs" are read when it boots and never again, so a change to
# either is invisible until this. It ends holding this terminal, because that
# is what "start" does: the server it stopped belonged to another one, and this
# is the terminal taking it over.
restart: ## Stop what is running and start it again, here
	@$(MAKE) --no-print-directory down
	@$(MAKE) --no-print-directory start

# By port and not by a pid file, for the reason there is no pid file: one that
# outlives its process is the stale state `Locks` uses flock to avoid a few
# pages further down, and a stop that reads it kills whatever took the number
# since. So what is stopped is what "make status" reports -- which is whatever
# holds the port, and on a machine where something else does, that.
#
# Stopping the interface is enough to take the manual with it where "make
# start" ran both: the shell that holds them stops the one when the other
# returns. Both are asked all the same, for the terminal that ran only one.
down: ## Stop the interface and the manual, wherever they were started
	@holder() { lsof -ti "tcp:$$1" -sTCP:LISTEN 2>/dev/null || true; }; \
		say() { printf '    %-10s %-24s %s\n' "$$1" "http://localhost:$$2" "$$3"; }; \
		command -v lsof >/dev/null 2>&1 || { \
			printf '\n  This needs lsof to find what holds a port. Without it, stop the\n'; \
			printf '  server where it was started: ^C in the terminal holding it.\n\n'; \
			exit 1; \
		}; \
		interface=$$(holder $(PORT)); \
		manual=$$(holder $(DOCS_PORT)); \
		printf '\n'; \
		if [ -n "$$interface" ]; then kill $$interface 2>/dev/null || true; say interface $(PORT) 'stopped'; \
		else say interface $(PORT) 'not running'; fi; \
		if [ -n "$$manual" ]; then kill $$manual 2>/dev/null || true; say manual $(DOCS_PORT) 'stopped'; \
		else say manual $(DOCS_PORT) 'not running'; fi; \
		printf '\n'

dev: $(APP)/node_modules ## The interface alone, with a mocked API -- no DDEV, no git
	@$(NPM) run dev

check: $(APP)/node_modules $(APP)/vendor ## Type check, build, static analysis, coding style, tests
	@$(NPM) run check
	@$(COMPOSER) run stan
	@$(COMPOSER) run cs
	@$(COMPOSER) run test

# The mark is the application's and is kept with it. The renderer refuses to
# read outside its own root, so it is copied in rather than pointed at -- into
# a directory nothing versions, because a generated file in a source tree that
# git also carries is a file two people can disagree about.
docs: $(RENDERER)/vendor ## Render the manual and the product page into site/
	@mkdir -p $(DOCS)/_images
	@cp $(APP)/public/branchery-signet-*.svg $(DOCS)/_images/
	@$(GUIDES) $(DOCS) --output=$(SITE) -c $(DOCS) --fail-on-error
	@node $(FINISH) $(SITE)

# Two steps and not the renderer's own --watch: the theme's stylesheet, its
# script and its fonts are laid down by the finishing step, so a server put in
# front of the render alone serves the pages with nothing drawing them.
docs-serve: docs ## The same, served at http://localhost:8044 -- DOCS_PORT to move it
	@echo "  The manual is at http://localhost:$(DOCS_PORT)/ -- ^C to stop."
	@python3 -m http.server $(DOCS_PORT) --bind 127.0.0.1 --directory $(SITE)

# The rebuild is what makes a change visible: the application is baked into the
# image, not served from the project directory. tools/deploy.sh says why.
deploy: $(APP)/node_modules ## Install into a DDEV project -- "make deploy <name>"
	@tools/deploy.sh $(PROJECT)

# The dependencies, as the directories that prove they are there; installed
# again only when their manifest has moved since.
$(APP)/node_modules: $(APP)/package.json $(APP)/package-lock.json
	@$(NPM) install
	@touch $@

$(APP)/vendor: $(APP)/composer.json $(APP)/composer.lock
	@$(COMPOSER) install
	@touch $@

# The renderer is a tool and not a dependency, so nothing of it is versioned
# here: no manifest of somebody else's packages in this tree, and no lock file
# holding the theme at a release it has since moved past. It is installed when
# it is first needed, at whatever version is current then, into a directory git
# does not carry -- "rm -rf .renderer" is how it is taken again.
$(RENDERER)/vendor: Makefile
	@mkdir -p $(RENDERER)
	@composer --working-dir=$(RENDERER) require --no-interaction --no-progress typo3/soul-guides-theme
	@touch $@
