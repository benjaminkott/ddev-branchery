#!/usr/bin/env bash
# The compose file names the image a project pulls, and the tag being cut is the
# image that will exist. Written by hand in different places, a release whose
# compose file still asks for the version before installs the old one --
# silently, because that tag exists too. The manual says a version in a third
# place, and fails more quietly: the site simply describes a version nobody runs.
#
#   tools/check-compose-tag.sh v0.2.0 [docker-compose.branchery.yaml [guides.xml]]
#
# The two files are arguments so the test suite can hand it files of its own;
# without them it reads the shipped ones.
set -euo pipefail

tag="${1:?the tag about to be pushed, such as v0.2.0}"
compose="${2:-$(dirname "${BASH_SOURCE[0]}")/../docker-compose.branchery.yaml}"
guides="${3:-$(dirname "${BASH_SOURCE[0]}")/../branchery/docs/guides.xml}"

image="$(sed -n 's/.*BRANCHERY_DOCKER_IMAGE:-\([^}]*\)}.*/\1/p' "${compose}" | head -1)"
[ -n "${image}" ] || { echo "No default image in ${compose}" >&2; exit 1; }

if [ "${image##*:}" != "${tag}" ]; then
    echo "${compose} defaults to ${image}, but the tag being released is ${tag}." >&2
    echo "A project installing this release would pull the other one." >&2
    exit 1
fi
echo "${compose} asks for ${tag}."

version="$(sed -n 's/.*<project[^>]*version="\([^"]*\)".*/\1/p' "${guides}" | head -1)"
[ -n "${version}" ] || { echo "No project version in ${guides}" >&2; exit 1; }

if [ "${version}" != "${tag}" ]; then
    echo "${guides} says ${version}, but the tag being released is ${tag}." >&2
    echo "Every page of the manual would carry the wrong version in its footer." >&2
    exit 1
fi
echo "${guides} says ${tag}."
