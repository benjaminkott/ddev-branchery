#!/usr/bin/env bash
#
# Put this working copy of the add-on into a DDEV project, without going through
# a release. Temporary helper -- not part of the add-on.
#
#   tools/deploy.sh                 the projects there are to choose from
#   tools/deploy.sh some-project    install into it and rebuild
#   tools/deploy.sh --app           only the image, not the installed files
#   tools/deploy.sh --no-build      skip "npm run build" and take public/ as it is
#   tools/deploy.sh --no-cache      rebuild the image from scratch
#
# A released add-on pulls an image by its tag; a working copy has no tag, so
# this builds the image and gives it the very name the project already asks for.
# Nothing is written into the project: an override would live in
# .ddev/.env.branchery, which the developer would then have to keep out of their
# own repository.
#
# Docker does not fetch a tag it already has, so the build stands in for the
# release until "docker pull <image>" puts the real one back. The name is the
# machine's: another project asking for the same tag gets this build too.
#
# The restart is not optional: a container is bound to the image it was made
# from, so a newly built image reaches the project only when it is replaced.
#
# The two modes differ only in what is copied before the image is built. "full"
# runs "ddev add-on get" against a clean copy, which is the real install path.
# "--app" leaves the installation where it is and only builds the image again.

set -euo pipefail

SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PROJECT=""
MODE="full"
BUILD="yes"
CACHE=""

for argument in "$@"; do
    case "${argument}" in
        --app) MODE="app" ;;
        --no-build) BUILD="no" ;;
        --no-cache) CACHE="--no-cache" ;;
        -h|--help) awk 'NR>2 { if (!/^#/) exit; sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"; exit 0 ;;
        -*) echo "Unknown option: ${argument}" >&2; exit 1 ;;
        *) PROJECT="${argument}" ;;
    esac
done

# The names DDEV knows. Nothing here guesses a project: without one, and with
# one that is not there, the answer is the choice rather than a shrug.
projects() {
    ddev list -j 2>/dev/null | python3 -c '
import json, sys
for line in sys.stdin:
    try:
        raw = json.loads(line).get("raw")
    except ValueError:
        continue
    if isinstance(raw, list):
        for project in raw:
            print("  %-24s %s" % (project["name"], project.get("status", "")))
        break
' 2>/dev/null || true
}

if [ -z "${PROJECT}" ]; then
    echo "Which project? Name one of these:" >&2
    projects >&2
    exit 1
fi

# Where the project is, asked of DDEV rather than guessed from the name: the
# directory and the project name are not required to match.
APPROOT="$(ddev describe "${PROJECT}" -j 2>/dev/null \
    | python3 -c 'import json,sys; print(json.load(sys.stdin)["raw"]["approot"])' 2>/dev/null || true)"

if [ -z "${APPROOT}" ] || [ ! -d "${APPROOT}/.ddev" ]; then
    echo "No DDEV project \"${PROJECT}\". There is:" >&2
    projects >&2
    exit 1
fi

echo "→ ${PROJECT} at ${APPROOT}"

if [ "${BUILD}" = "yes" ]; then
    echo "→ building the interface"
    npm --prefix "${SOURCE}/branchery/app" run build
fi

if [ "${MODE}" = "full" ]; then
    # A clean copy to install from: "ddev add-on get" takes a directory as it
    # finds it, and this working copy holds a good deal that has no business
    # in a .ddev.
    STAGE="$(mktemp -d)"
    trap 'rm -rf "${STAGE}"' EXIT

    echo "→ staging a clean copy"
    rsync -a --exclude='.git/' --exclude='node_modules/' --exclude='vendor/' \
             --exclude='.dev/' --exclude='.phpunit.cache/' --exclude='.php-cs-fixer.cache' \
             --exclude='.renderer/' --exclude='site/' \
             --exclude='phpunit.xml' "${SOURCE}/" "${STAGE}/"

    echo "→ ddev add-on get"
    ddev add-on get "${STAGE}" --project "${PROJECT}"
fi

# The name this project actually starts, which is what has to be built: the
# override where the developer set one, the compose file's default otherwise.
# Same order the running application reads them in.
IMAGE=""
# Asked of the file only where there is one: under "set -o pipefail" a sed that
# cannot open its input takes the whole script with it.
if [ -f "${APPROOT}/.ddev/.env.branchery" ]; then
    IMAGE="$(sed -n 's/^BRANCHERY_DOCKER_IMAGE=//p' "${APPROOT}/.ddev/.env.branchery" | head -1)"
fi
[ -n "${IMAGE}" ] || IMAGE="$(sed -n 's/.*BRANCHERY_DOCKER_IMAGE:-\([^}]*\)}.*/\1/p' \
    "${APPROOT}/.ddev/docker-compose.branchery.yaml" | head -1)"
[ -n "${IMAGE}" ] || { echo "No image named in ${APPROOT}/.ddev/docker-compose.branchery.yaml" >&2; exit 1; }

# An override this script wrote before it knew better. Left in place it would go
# on naming an image from another day.
if [ -f "${APPROOT}/.ddev/.env.branchery" ] && grep -q 'Written by deploy.sh' "${APPROOT}/.ddev/.env.branchery"; then
    rm -f "${APPROOT}/.ddev/.env.branchery"
    echo "→ removed the override .ddev/.env.branchery from an earlier deploy"
fi

# Layer-cached by default: the composer step only runs again when composer.lock
# has moved. Pass --no-cache when it must not be.
echo "→ building ${IMAGE} from this working copy"
# shellcheck disable=SC2086 -- an empty CACHE must expand to no argument at all.
docker build ${CACHE} -t "${IMAGE}" "${SOURCE}/branchery"
echo "  this name now means the working copy on this machine, in every project"
echo "  asking for it -- \"docker pull ${IMAGE}\" puts the released one back"

echo "→ ddev restart"
ddev restart "${PROJECT}"

echo "✓ https://${PROJECT}.ddev.site:8041"
