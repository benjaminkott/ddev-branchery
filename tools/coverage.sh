#!/usr/bin/env bash
#
# What the PHP suite reaches, as a number, and a floor it may not fall below.
#
#   tools/coverage.sh           print the number and hold it to the floor
#   tools/coverage.sh --print   print it and hold it to nothing
#
# Not a target. A target is a number people write tests against, and the tests
# somebody writes to move a number are the tests nobody reads afterwards. This
# is here for the other direction: a change that quietly stops covering
# something says so, once, in the run that made it.
#
# The floor is raised by hand, and only after the number has actually moved --
# it is a record of where this has been, not a promise about where it is going.
#
# Needs a coverage driver. pcov is the cheap one and the workflow installs it;
# without either this says so and stops rather than reporting nothing as zero.

set -euo pipefail

APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/../branchery/app" && pwd)"

# Where it has been. Raised by hand when the number has risen and stayed.
FLOOR=52

cd "${APP}"

if ! php -m | grep -qiE '^(pcov|xdebug)$'; then
    echo "No coverage driver: install pcov (pecl install pcov) or xdebug." >&2
    exit 1
fi

report="$(php -d pcov.enabled=1 -d pcov.directory="${APP}/src" \
    vendor/bin/phpunit --coverage-clover=php://stdout --no-output 2>/dev/null)"

# Out of the clover document, which counts the statements themselves rather
# than the lines a file happens to have -- a docblock is not a thing to cover.
covered="$(printf '%s' "${report}" | grep -o 'coveredstatements="[0-9]*"' | tail -1 | grep -o '[0-9]*')"
total="$(printf '%s' "${report}" | grep -o ' statements="[0-9]*"' | tail -1 | grep -o '[0-9]*')"

if [ -z "${covered}" ] || [ -z "${total}" ] || [ "${total}" -eq 0 ]; then
    echo "The coverage report carried no counts; nothing to hold to." >&2
    exit 1
fi

percent=$(( covered * 100 / total ))
printf 'Lines covered: %d%% (%d/%d)\n' "${percent}" "${covered}" "${total}"

if [ "${1:-}" = "--print" ]; then
    exit 0
fi

if [ "${percent}" -lt "${FLOOR}" ]; then
    printf '\nThis is below the floor of %d%%. Something stopped being covered.\n' "${FLOOR}" >&2
    printf 'Cover it, or lower the floor in tools/coverage.sh and say in the commit why.\n' >&2
    exit 1
fi
