#!/usr/bin/env bash
# What a release says, taken from the tag that cut it.
#
# The message of the annotated tag is written by hand at the moment of the
# release and is the only account of it that exists; generating notes from
# commit subjects beside it would be a second list to keep in step, and reading
# worse than the sentences somebody wrote on purpose.
#
#   tools/release-notes.sh v0.2.0 [repository]
#
# The first line of the message is the tag's subject and is dropped: the release
# is titled by its tag, and a title repeated as the first line of the body reads
# as a mistake.
set -euo pipefail

tag="${1:?the tag being released, such as v0.2.0}"
cd "${2:-$(dirname "${BASH_SOURCE[0]}")/..}"

git rev-parse -q --verify "refs/tags/${tag}" >/dev/null \
    || { echo "There is no tag ${tag} here." >&2; exit 1; }

# A lightweight tag carries no message at all, and the release would be created
# with an empty body -- which is the one shape of this that fails silently.
if [ "$(git cat-file -t "refs/tags/${tag}")" != "tag" ]; then
    echo "${tag} is a lightweight tag and carries no message." >&2
    echo "A release is cut with \"git tag -a\", so that what it says is written down." >&2
    exit 1
fi

notes="$(git tag -l --format='%(contents:body)' "${tag}")"
# Trailers are the sign-off and whatever else git puts at the foot of a message.
# They belong in the repository, not on a release page. Taken off the end and
# then read back through a substitution, which is what drops the blank lines
# they leave behind.
notes="$(printf '%s' "${notes%$(git tag -l --format='%(trailers)' "${tag}")}")"

if [ -z "$(printf '%s' "${notes}" | tr -d '[:space:]')" ]; then
    echo "The message of ${tag} is a subject and nothing else." >&2
    echo "The body of it is what the release page says; write one." >&2
    exit 1
fi

printf '%s\n' "${notes}"
