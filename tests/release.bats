#!/usr/bin/env bats

# The one check a release has to pass before an image is built: the compose
# file names the tag being cut, and so does the manual's footer. Needs neither
# Docker nor DDEV, only the script -- which is handed files of this test's own,
# so that what it says about a version is not tied to the one in the tree.

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
