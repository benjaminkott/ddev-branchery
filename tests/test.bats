#!/usr/bin/env bats

# Verifies that the add-on fits into an existing DDEV project: the service
# runs, the API answers, and a worktree is created and disappears again without
# leaving anything behind.

setup() {
  set -eu -o pipefail
  export DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")/.." >/dev/null 2>&1 && pwd)"
  export PROJNAME="test-worktrees"
  export TESTDIR="$(mktemp -d -t ddev-worktrees-XXXXXX)"
  export DDEV_NONINTERACTIVE=true

  mkdir -p "${TESTDIR}/public"
  cd "${TESTDIR}"
  printf '<?php echo "project";\n' > public/index.php

  # The add-on works with the project's repository, and what a worktree serves
  # is what the branch has committed -- an empty initial commit gives every
  # worktree an empty checkout, and the address then answers 403.
  git init -q -b main
  git add public/index.php
  git -c user.email=test@example.com -c user.name=Test commit -q -m "initial"

  # The shape of the project is the suite's one variable. Everything here has
  # always run against DDEV's own defaults -- MariaDB behind nginx -- and the
  # two paths that only exist elsewhere are the ones nothing walked:
  # DatabaseOperations speaks a second dialect, and install.yaml writes Apache
  # a module of its own. Named rather than switched on, so the row in the
  # workflow says which project form it walked.
  export TEST_DATABASE="${BRANCHERY_TEST_DATABASE:-}"
  export TEST_WEBSERVER="${BRANCHERY_TEST_WEBSERVER:-}"

  ddev config --project-name="${PROJNAME}" --project-type=php --docroot=public \
    ${TEST_DATABASE:+--database="${TEST_DATABASE}"} \
    ${TEST_WEBSERVER:+--webserver-type="${TEST_WEBSERVER}"}
  # Nothing about a project is guessed: a worktree serves its checkout unless
  # the project says what is served, and this one serves public/.
  printf 'docroot: public\n' > .ddev/branchery.yaml
  ddev start -y >/dev/null
}

# Which of the two clients the project's server is asked through. The
# application decides this from DDEV's own environment; the suite decides it
# from what it configured, and the two have to agree or the tests below would
# be checking a server nothing wrote to.
db_family() {
  case "${TEST_DATABASE}" in
    postgres*) printf 'postgres' ;;
    *) printf 'mysql' ;;
  esac
}

# One statement against one database. The clients differ in everything but
# that, so the tests below say what they want and this says how it is asked.
db_sql() {
  local database="$1" statement="$2"
  if [ "$(db_family)" = postgres ]; then
    ddev psql -d "${database}" -c "${statement}"
  else
    ddev mysql -uroot -proot "${database}" -e "${statement}"
  fi
}

# What tables a database holds, as lines. "show tables" has no counterpart in
# postgres, and its catalogue is where the same question is asked.
db_tables() {
  if [ "$(db_family)" = postgres ]; then
    ddev psql -d "$1" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
  else
    ddev mysql -uroot -proot "$1" -e "show tables"
  fi
}

# What databases the server holds, as lines.
db_databases() {
  if [ "$(db_family)" = postgres ]; then
    ddev psql -d postgres -t -c "SELECT datname FROM pg_database"
  else
    ddev mysql -uroot -proot -e "show databases"
  fi
}

# Where the entry for the worktree addresses is written. The script picks the
# server the project actually runs, and a test that names one of the two says
# nothing whatever about the other.
vhost_file() {
  case "${TEST_WEBSERVER}" in
    apache*) printf '/etc/apache2/sites-enabled/zz-branchery.conf' ;;
    *) printf '/etc/nginx/sites-enabled/zz-branchery.conf' ;;
  esac
}

# And how the domain reads inside it. nginx matches the worktree out of the
# hostname with a regular expression, so its dots are escaped; Apache names the
# same thing as a ServerAlias, where they are dots. The same fact, spelled the
# way each server spells it.
vhost_hostname() {
  case "${TEST_WEBSERVER}" in
    apache*) printf '%s' "$1" ;;
    *) printf '%s' "${1//./\\.}" ;;
  esac
}

# A database made outside Branchery, which is what an orphan is.
db_create() {
  if [ "$(db_family)" = postgres ]; then
    ddev psql -d postgres -c "CREATE DATABASE \"$1\""
  else
    ddev mysql -uroot -proot -e "create database \`$1\`"
  fi
}

teardown() {
  set -eu -o pipefail
  cd "${TESTDIR}" || true
  ddev delete -Oy "${PROJNAME}" >/dev/null 2>&1 || true
  [ -n "${TESTDIR:-}" ] && rm -rf "${TESTDIR}" "${TESTDIR}.gitdir"
}

# The add-on, as a developer installs it. The image is built under the very
# name the compose file asks for, so the suite walks the path a project walks
# and tests this working copy rather than the last release. Docker caches the
# build, so this costs the first test and nothing after it.
install_addon() {
  local image
  image="$(sed -n 's/.*BRANCHERY_DOCKER_IMAGE:-\([^}]*\)}.*/\1/p' "${DIR}/docker-compose.branchery.yaml" | head -1)"
  [ -n "${image}" ]
  docker build -t "${image}" "${DIR}/branchery" >/dev/null
  ddev add-on get "${DIR}" >/dev/null
}

health_check() {
  # The service shows up in "ddev describe" and answers requests.
  ddev describe | grep -q worktrees
  run curl -sfk "https://${PROJNAME}.ddev.site:8041/api/php-versions"
  [ "$status" -eq 0 ]
  echo "$output" | grep -q '8\.'

  # And "launch" opens it. DDEV_DEBUG stops short of the browser and prints
  # the address it would have opened.
  run env DDEV_DEBUG=true ddev branchery launch
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "https://${PROJNAME}.ddev.site:8041"

  # The domain the worktrees hang under is the machine's to choose, and the
  # application learns it the same way the scripts do.
  run docker inspect "ddev-${PROJNAME}-branchery" --format '{{range .Config.Env}}{{println .}}{{end}}'
  echo "$output" | grep -q "^DDEV_TLD=ddev.site$"
}

@test "install from directory" {
  set -eu -o pipefail
  cd "${TESTDIR}"
  echo "# ddev add-on get ${DIR}" >&3
  install_addon
  ddev restart -y >/dev/null
  health_check

  # An argument reaches the console as it was typed: "ddev exec" without --raw
  # joins the arguments and has a shell read them again, and a branch with a
  # parenthesis in its name was a syntax error before the console saw it.
  run ddev branchery worktree:add 'feature/(foo);x'
  [ "$status" -ne 0 ]
  echo "$output" | grep -qF 'Branch "feature/(foo);x" is unknown'

  # A program reads the answer as JSON, in the shape the API answers in; the
  # project checkout is the first entry and says so of itself.
  run ddev branchery worktree:list --format=json
  [ "$status" -eq 0 ]
  echo "$output" | php -r '$list = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR); exit($list[0]["isProject"] === true && $list[0]["name"] === getenv("PROJNAME") ? 0 : 1);'

  # And the manual is a command away, as written.
  run ddev branchery docs
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "operations"
  run ddev branchery docs configuration
  [ "$status" -eq 0 ]
  echo "$output" | grep -qF '.ddev/branchery.yaml'
}

# What the entry point runs into on other machines, walked in this container:
# it runs as the project's user under DDEV's own errexit, and whatever it
# cannot do must cost a line of output and not the project.
@test "the entry point brings the container up whatever it finds" {
  set -eu -o pipefail
  cd "${TESTDIR}"
  install_addon
  ddev restart -y >/dev/null

  local entrypoint="/mnt/ddev_config/web-entrypoint.d/branchery.sh"

  # A project outside /home: the directory above it is root's, and the link
  # used to be made without asking for root -- which killed every macOS.
  run ddev exec --raw -- env HOST_PROJECT_ROOT=/Users/somebody/project bash "${entrypoint}"
  [ "$status" -eq 0 ]
  run ddev exec --raw -- test -L /Users/somebody/project
  [ "$status" -eq 0 ]

  # A Windows path is no place for a link, and is said so rather than tried.
  run ddev exec --raw -- env 'HOST_PROJECT_ROOT=C:\Users\somebody\project' bash "${entrypoint}"
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "not an absolute POSIX path"

  # DDEV sources this file into a script that stops at the first command that
  # fails, and its arguments there are DDEV's own. Neither may cost the
  # container: what the file does is decided by itself, not by the shell it
  # lands in.
  run ddev exec --raw -- bash -c 'set -eu -o pipefail; source '"${entrypoint}"' --a-flag-of-ddevs; echo still-starting'
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "still-starting"
}

@test "creates and removes a worktree" {
  set -eu -o pipefail
  cd "${TESTDIR}"
  install_addon
  ddev restart -y >/dev/null

  # Without a source, the project checkout is branched off.
  ddev branchery worktree:fork demo >/dev/null
  run ddev branchery worktree:list
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "demo"
  [ -d "${TESTDIR}/.worktrees/demo" ]

  # The worktree is reachable under an address of its own.
  run curl -sfk "https://demo.${PROJNAME}.ddev.site/"
  [ "$status" -eq 0 ]

  # And it is part of what DDEV reports about the project.
  run ddev describe
  echo "$output" | grep -q "demo.${PROJNAME}.ddev.site"

  ddev branchery worktree:remove demo >/dev/null
  [ ! -d "${TESTDIR}/.worktrees/demo" ]
  run git worktree list
  echo "$output" | grep -vq "demo"
}

# The way a program drives this: hand the work to the background, ask after it
# until it is over, and read a document rather than a screen of steps. None of
# it is testable anywhere but here.
@test "an operation can be handed to the background and asked after" {
  set -eu -o pipefail
  cd "${TESTDIR}"
  install_addon
  ddev restart -y >/dev/null

  local job
  job="$(ddev branchery worktree:fork detached --detach --format=json \
    | php -r 'echo json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR)["job"];')"
  [ -n "${job}" ]

  # While it works it is one of the operations running.
  run ddev branchery jobs:list --format=json
  [ "$status" -eq 0 ]
  echo "$output" | grep -qF "${job}"

  # Waiting is asked for and not looped: DDEV hands one exit code back for
  # every failure, so a code meaning "still working" would arrive as the code
  # meaning "it failed". With --wait the exit code is the answer.
  run ddev branchery jobs:show "${job}" --wait --format=json
  [ "$status" -eq 0 ]
  echo "$output" | php -r '$d = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
    exit($d["status"] === "done" ? 0 : 1);'
  [ -d "${TESTDIR}/.worktrees/detached" ]

  # And an operation asked for a document answers with one and nothing else.
  run ddev branchery worktree:remove detached --format=json
  [ "$status" -eq 0 ]
  echo "$output" | php -r '$d = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
    exit($d["ok"] === true && $d["command"] === "worktree:remove" && $d["error"] === null && $d["warnings"] === [] ? 0 : 1);'
  [ ! -d "${TESTDIR}/.worktrees/detached" ]
}

# Which of its lines a build survives, and what is left behind by one it does
# not. Both only happen against a real project.
@test "a recipe says which of its lines the build survives" {
  set -eu -o pipefail
  cd "${TESTDIR}"
  install_addon
  ddev restart -y >/dev/null

  # A line that fails and says the build survives it: the worktree is finished
  # past it and serves, and the operation says what it could not do.
  printf 'docroot: public\ninstall:\n  - exec: exit 3\n    optional: true\n' > .ddev/branchery.yaml
  run ddev branchery worktree:fork lenient
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "⚠"
  [ -d "${TESTDIR}/.worktrees/lenient" ]
  run curl -sfk "https://lenient.${PROJNAME}.ddev.site/"
  [ "$status" -eq 0 ]
  run ddev branchery worktree:list
  ! echo "$output" | grep -q "build unfinished"

  # The same line without that word: the build stops, the worktree stays
  # behind unfinished, and the way on is named where the failure is read.
  printf 'docroot: public\ninstall:\n  - exec: exit 3\n' > .ddev/branchery.yaml
  run ddev branchery worktree:fork strict
  [ "$status" -ne 0 ]
  echo "$output" | grep -qF 'worktree:provision strict'

  run ddev branchery worktree:list
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "build unfinished"

  # What a program is told about the same failure. Only what the console wrote:
  # DDEV says a word of its own on the error channel and in colour.
  local document code=0
  document="$(ddev branchery worktree:provision strict --format=json 2>/dev/null)" || code=$?
  [ "${code}" -ne 0 ]
  echo "${document}" | php -r '$d = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
    exit($d["ok"] === false && $d["resume"] === "ddev branchery worktree:provision strict" ? 0 : 1);'

  # And it is a finished worktree once the line that stopped it is gone.
  printf 'docroot: public\n' > .ddev/branchery.yaml
  ddev branchery worktree:provision strict >/dev/null
  run ddev branchery worktree:list
  [ "$status" -eq 0 ]
  ! echo "$output" | grep -q "build unfinished"
}

# The operations below only ever run against a real project, which is why they
# are the ones that break unnoticed. They share one worktree: what is checked
# is that each does its work and leaves the worktree serving.
@test "carries a worktree through every operation" {
  set -eu -o pipefail
  cd "${TESTDIR}"
  install_addon
  ddev restart -y >/dev/null

  ddev branchery worktree:fork demo >/dev/null
  run curl -sfk "https://demo.${PROJNAME}.ddev.site/"
  [ "$status" -eq 0 ]

  # A version of its own means an FPM pool of its own, and the worktree has to
  # keep answering through it.
  local other
  other="$(ddev exec bash -c "ls /usr/sbin/php-fpm* | grep -oE '[0-9]+\\.[0-9]+' | sort -V -u | head -1")"
  ddev branchery worktree:php demo "${other}" >/dev/null
  run ddev branchery worktree:list
  echo "$output" | grep -q "${other}"
  run curl -sfk "https://demo.${PROJNAME}.ddev.site/"
  [ "$status" -eq 0 ]

  # And through a restart, which is when the pool is started by the entry point
  # rather than by the application. It used to fail there without saying so, and
  # the server block written all the same sent every request to a socket nobody
  # had bound.
  ddev restart -y >/dev/null
  run curl -sfk "https://demo.${PROJNAME}.ddev.site/"
  [ "$status" -eq 0 ]
  run ddev exec --raw -- pgrep -f "/etc/php/${other}/fpm/php-fpm.conf"
  [ "$status" -eq 0 ]
  run ddev exec --raw -- test -S "/run/php/php-fpm-${other}.sock"
  [ "$status" -eq 0 ]

  # Fetching the data again: the database is made anew rather than added to,
  # so anything put in it in the meantime is gone afterwards.
  db_sql branchery_demo "create table marker (id int)" >/dev/null 2>&1
  ddev branchery database:sync demo >/dev/null
  run db_tables branchery_demo
  echo "$output" | grep -vq "marker"

  # Provisioning again keeps the data; provisioning fresh does not. Both have to
  # end with a worktree that serves -- the failure this guards against left one
  # behind with neither database nor configuration.
  db_sql branchery_demo "create table marker (id int)" >/dev/null 2>&1
  ddev branchery worktree:provision demo >/dev/null
  run db_tables branchery_demo
  echo "$output" | grep -q "marker"

  ddev branchery worktree:provision demo --fresh >/dev/null
  run db_tables branchery_demo
  echo "$output" | grep -vq "marker"
  run curl -sfk "https://demo.${PROJNAME}.ddev.site/"
  [ "$status" -eq 0 ]

  # A database whose worktree is gone is not dropped behind the developer's
  # back; it is listed, and only removed when that is asked for.
  db_create branchery_orphan >/dev/null 2>&1
  run ddev branchery database:prune
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "branchery_orphan"
  run db_databases
  echo "$output" | grep -q "branchery_orphan"

  ddev branchery database:prune --drop >/dev/null
  run db_databases
  echo "$output" | grep -vq "branchery_orphan"
  echo "$output" | grep -q "branchery_demo"

  # And nothing of it is left when it goes.
  ddev branchery worktree:remove demo >/dev/null
  [ ! -d "${TESTDIR}/.worktrees/demo" ]
  run db_databases
  echo "$output" | grep -vq "branchery_demo"
}

# The one operation that could take work away without saying so: a branch that
# exists here and on the remote used to be pointed back at the remote when a
# worktree was made for it, throwing away every unpushed commit silently.
@test "a worktree of an existing branch keeps what was never pushed" {
  set -eu -o pipefail
  cd "${TESTDIR}"
  install_addon
  ddev restart -y >/dev/null

  # A bare repository to be the remote. Its address is the host's, because only
  # this test pushes to it.
  git init -q --bare "${TESTDIR}/.origin.git"
  echo '.origin.git/' >> .gitignore
  git add .gitignore
  git -c user.email=test@example.com -c user.name=Test commit -qm "ignore the remote"
  git remote add origin "${TESTDIR}/.origin.git"
  git push -q origin main

  # A branch both ends know, and one commit on it that only this end has.
  git branch keepsake main
  git push -q origin keepsake
  git worktree add -q "${TESTDIR}/tmpwt" keepsake
  echo 'precious' > "${TESTDIR}/tmpwt/PRECIOUS.md"
  git -C "${TESTDIR}/tmpwt" add PRECIOUS.md
  git -C "${TESTDIR}/tmpwt" -c user.email=test@example.com -c user.name=Test commit -qm "never pushed"
  git worktree remove --force "${TESTDIR}/tmpwt"
  git fetch -q origin

  run git cat-file -e keepsake:PRECIOUS.md
  [ "$status" -eq 0 ]

  ddev branchery worktree:add keepsake >/dev/null

  # Still on the branch, and in the worktree that was just made of it.
  run git cat-file -e keepsake:PRECIOUS.md
  [ "$status" -eq 0 ]
  [ -f "${TESTDIR}/.worktrees/keepsake/PRECIOUS.md" ]

  # The list of commits says which of them the remote has: the one made here
  # and never pushed, and nothing else.
  run curl -sfk "https://${PROJNAME}.ddev.site:8041/api/worktrees/keepsake/commits"
  [ "$status" -eq 0 ]
  echo "$output" | php -r '$read = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
    $unpushed = array_column(array_filter($read["commits"], fn ($c) => !$c["pushed"]), "subject");
    exit($unpushed === ["never pushed"] ? 0 : 1);'

  # A branch cut from one the remote has follows nothing yet, and everything
  # on it is on the remote all the same: nothing of it is "not pushed".
  ddev branchery worktree:fork cutting >/dev/null
  run curl -sfk "https://${PROJNAME}.ddev.site:8041/api/worktrees/cutting/commits"
  [ "$status" -eq 0 ]
  echo "$output" | php -r '$read = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
    exit($read["upstream"] === null && $read["commits"] !== [] && count(array_filter($read["commits"], fn ($c) => !$c["pushed"])) === 0 ? 0 : 1);'
}

# The path every developer walks after the first day: they have it, and a newer
# one arrives. DDEV refuses to overwrite a file that does not carry its own
# signature, and the state it must not touch is what the worktrees are made of.
@test "an update replaces what it installed and keeps the state" {
  set -eu -o pipefail
  cd "${TESTDIR}"
  install_addon
  ddev restart -y >/dev/null

  ddev branchery worktree:fork demo >/dev/null
  local before
  before="$(cat "${TESTDIR}/.ddev/branchery/var/metadata/demo.json")"

  # An edited entry point stands in for the version before. It carries the
  # #ddev-generated line, which is the whole of what lets an update replace it:
  # a shipped file that lost the line is one DDEV leaves alone and says so.
  echo '# from the version before' >> "${TESTDIR}/.ddev/web-entrypoint.d/branchery.sh"

  # And an application beside the project stands in for what an older Branchery
  # put there. It travels in the image now, and a copy left behind is a version
  # nobody runs.
  mkdir -p "${TESTDIR}/.ddev/branchery/app/src"
  echo '<?php // the version before' > "${TESTDIR}/.ddev/branchery/app/src/Container.php"

  run ddev add-on get "${DIR}"
  [ "$status" -eq 0 ]
  echo "$output" | grep -vq "NOT overwriting"

  # What is installed is the new one again...
  run grep -c 'from the version before' "${TESTDIR}/.ddev/web-entrypoint.d/branchery.sh"
  [ "$output" -eq 0 ]
  # ...what an older version installed is gone...
  [ ! -d "${TESTDIR}/.ddev/branchery/app" ]

  # ...and everything the worktrees are made of is where it was.
  [ "$(cat "${TESTDIR}/.ddev/branchery/var/metadata/demo.json")" = "$before" ]
  [ -d "${TESTDIR}/.worktrees/demo" ]
  [ -L "${TESTDIR}/.ddev/branchery/var/docroots/demo" ]

  # One command, and the project is on the new version. It used to take two.
  ddev restart -y >/dev/null
  run curl -sfk "https://demo.${PROJNAME}.ddev.site/"
  [ "$status" -eq 0 ]
}

# A name that is already taken is refused before anything is created. The worst
# outcome is not the refusal but a half-made worktree beside the one that was
# already there.
@test "refuses a name that is taken, and creates nothing" {
  set -eu -o pipefail
  cd "${TESTDIR}"
  install_addon
  ddev restart -y >/dev/null

  ddev branchery worktree:fork demo >/dev/null
  run ddev branchery worktree:fork demo
  [ "$status" -ne 0 ]

  run git worktree list
  [ "$(echo "$output" | grep -c demo)" -eq 1 ]
}

# What the install leaves in the repository, and what it keeps out. The
# installed files are committed with the project, which is what DDEV's own
# convention says of an add-on. What stays out is the working state.
@test "installs what a clone needs and ignores the rest" {
  set -eu -o pipefail
  cd "${TESTDIR}"

  # A project that is itself a git worktree or a submodule has a .git file, not
  # a directory, and is a project all the same.
  mv "${TESTDIR}/.git" "${TESTDIR}.gitdir"
  printf 'gitdir: %s\n' "${TESTDIR}.gitdir" > "${TESTDIR}/.git"
  run git status --porcelain
  [ "$status" -eq 0 ]

  run ddev add-on get "${DIR}"
  [ "$status" -eq 0 ]

  # Nothing that was tracked has been changed.
  run bash -c "git status --porcelain | grep -v '^??' | wc -l"
  [ "$output" -eq 0 ]

  # The entry point is for the history, the state is not.
  run git check-ignore -q .ddev/web-entrypoint.d/branchery.sh
  [ "$status" -ne 0 ]
  run git check-ignore -q .ddev/branchery/var/docroots
  [ "$status" -eq 0 ]
  run git check-ignore -q .worktrees/anything
  [ "$status" -eq 0 ]

  # And a project that had the rule of an earlier version, which named the
  # state a directory higher, is put right by installing again: the add-on's own
  # directory holds nothing but that state, so nothing of it reaches git.
  printf '%s\n' '# Created by Branchery. Working state, not source.' '/var/' '/.gitignore' \
    > "${TESTDIR}/.ddev/branchery/.gitignore"
  ddev add-on get "${DIR}" >/dev/null
  [ ! -f "${TESTDIR}/.ddev/branchery/.gitignore" ]
  run bash -c "git status --porcelain .ddev/branchery"
  [ -z "$output" ]

  # "#ddev-generated" says DDEV wrote the file, and DDEV reports a file bearing
  # it that it does not know as unexpected -- to the developer, about their own
  # repository. Every file this add-on writes rather than ships has to do
  # without it, and one that gained it would read as a warning about nothing.
  run ddev utility check-custom-config
  [ "$status" -eq 0 ]
  echo "$output" | grep -vq "unexpected"
}

# The domain is the machine's, and nothing may spell out DDEV's default: a
# project on another TLD would otherwise be told an address that is not its
# own, and served under one that is.
@test "follows the project's TLD" {
  set -eu -o pipefail
  cd "${TESTDIR}"

  run bash -c "grep -rn 'ddev\.site' '${DIR}/web-entrypoint.d' | grep -v 'DDEV_TLD:-ddev.site'"
  [ "$status" -ne 0 ]

  # What the install says and writes, on a project that chose another domain.
  # Only the configuration is changed: starting it under that name would need
  # the hosts file, and nothing here is started again.
  ddev config --project-tld=example.test
  run ddev add-on get "${DIR}"
  [ "$status" -eq 0 ]
  echo "$output" | grep -q "https://${PROJNAME}.example.test:8041"
  grep -q "${PROJNAME}.example.test" "${TESTDIR}/.ddev/config.branchery.yaml"

  # And what the scripts write, told the domain the way the container is. The
  # entry goes to whichever server is in charge, and asking the other one for it
  # is how this test passed for years while saying nothing about Apache.
  ddev exec --raw -- sudo env "DDEV_SITENAME=${PROJNAME}" DDEV_TLD=example.test bash /mnt/ddev_config/web-entrypoint.d/branchery.sh vhosts
  run ddev exec --raw -- cat "$(vhost_file)"
  [ "$status" -eq 0 ]
  echo "$output" | grep -qF "$(vhost_hostname "${PROJNAME}.example.test")"
}

@test "removal takes its files with it" {
  set -eu -o pipefail
  cd "${TESTDIR}"
  ddev add-on get "${DIR}" >/dev/null
  ddev add-on remove branchery
  [ ! -f "${TESTDIR}/.ddev/docker-compose.branchery.yaml" ]
  [ ! -f "${TESTDIR}/.ddev/config.branchery.yaml" ]
  [ ! -f "${TESTDIR}/.ddev/web-entrypoint.d/branchery.sh" ]
}
