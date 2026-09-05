#!/usr/bin/env bats

# What a release has to be right about before an image is built: the compose
# file names the tag being cut and so does the manual's footer, and what the
# add-on ships is what an update clears away first. Needs neither Docker nor
# DDEV -- the tag is checked through the script, which is handed files of this
# test's own so that what it says about a version is not tied to the one in the
# tree, and the shipped files are read out of install.yaml as it stands.

setup() {
  export DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")/.." >/dev/null 2>&1 && pwd)"
  export CHECK="${DIR}/tools/check-compose-tag.sh"
  export COMPOSE="$(mktemp -t compose-XXXXXX.yaml)"
  export GUIDES="$(mktemp -t guides-XXXXXX.xml)"
  printf 'services:\n  branchery:\n    image: ${BRANCHERY_DOCKER_IMAGE:-ghcr.io/example/add-on:v1.2.3}\n' > "${COMPOSE}"
  printf '<guides><project title="Example" version="v1.2.3"/></guides>\n' > "${GUIDES}"
}

teardown() {
  rm -f "${COMPOSE}" "${GUIDES}"
}

@test "accepts the tag both files name" {
  run "${CHECK}" v1.2.3 "${COMPOSE}" "${GUIDES}"
  [ "$status" -eq 0 ]
}

@test "refuses a tag the compose file does not name" {
  run "${CHECK}" v1.2.4 "${COMPOSE}" "${GUIDES}"
  [ "$status" -ne 0 ]
  echo "$output" | grep -q "v1.2.4"
  echo "$output" | grep -q "v1.2.3"
}

@test "refuses a manual whose footer says another version" {
  printf '<guides><project title="Example" version="v1.2.2"/></guides>\n' > "${GUIDES}"
  run "${CHECK}" v1.2.3 "${COMPOSE}" "${GUIDES}"
  [ "$status" -ne 0 ]
  echo "$output" | grep -q "v1.2.2"
}

@test "refuses a compose file without a default image" {
  printf 'services: {}\n' > "${COMPOSE}"
  run "${CHECK}" v1.2.3 "${COMPOSE}" "${GUIDES}"
  [ "$status" -ne 0 ]
}

# And the file that is actually shipped: the check has to read it, or the
# workflow step passes for the wrong reason.
@test "reads the shipped compose file" {
  local image
  image="$(sed -n 's/.*BRANCHERY_DOCKER_IMAGE:-\([^}]*\)}.*/\1/p' "${DIR}/docker-compose.branchery.yaml" | head -1)"
  run "${CHECK}" "${image##*:}"
  [ "$status" -eq 0 ]
  run "${CHECK}" v0.0.0-not-this-one
  [ "$status" -ne 0 ]
}

# The two lists in install.yaml that have to agree, asked of the file rather
# than remembered. DDEV replaces a file it still ships, by its own
# "#ddev-generated" line; what it cannot do is take away one that a later
# release stopped shipping -- and inside a shipped directory that is the whole
# risk, because the entry point calls those scripts by name. So the install
# clears every such directory before the copy, and a new one written into
# project_files alone is one that would install once and never update.
#
# Only in that direction: what the removal names and project_files does not is
# what an older, file-based Branchery left behind, and it is meant to be there.
@test "every shipped directory is one the install clears away first" {
  local install="${DIR}/install.yaml"

  # Everything the install does before it copies, which is where the clearing
  # stands. Read as the text it is: this is one shell script in a YAML file.
  local before
  before="$(awk '/^project_files:/ { exit } { print }' "${install}")"

  local shipped
  shipped="$(awk '/^project_files:/ { on = 1; next } on && /^[^ ]/ { exit } on && /^ *- / { print $2 }' "${install}")"
  [ -n "${shipped}" ]

  local entry
  for entry in ${shipped}; do
    # Only the directories. A single file is replaced where it stands, and one
    # that stops being shipped is one file left in a project -- not an entry
    # point calling into something that is no longer there.
    case "${entry}" in
      */) ;;
      *) continue ;;
    esac

    if ! printf '%s' "${before}" | grep -qF "/.ddev/${entry%/}\""; then
      echo "install.yaml ships ${entry} but does not clear .ddev/${entry%/} before the copy" >&2
      return 1
    fi
  done
}
