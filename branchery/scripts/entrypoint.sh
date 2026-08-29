#!/usr/bin/env bash
#ddev-generated
## What has to be true in the web container before a worktree can be served.
##
## Shipped rather than written into the project: DDEV runs whatever it finds in
## .ddev/web-entrypoint.d/, and that file is committed with the project. Logic
## kept there would be a copy in every repository that installs this.
set -eu

log() { printf '[branchery] %s\n' "$*"; }

# DDEV runs the entry point as the project's user, while the application runs
# the same scripts through sudo. The pools, the server configuration and the
# path the link below stands on are root's to write, so both ends go through
# here and the outcome does not depend on which one asked.
as_root() {
    if [ "$(id -u)" = 0 ]; then "$@"; else sudo -n "$@"; fi
}

# The addresses and the PHP pools of the worktrees, as they stand right now.
# Neither may stop the container from coming up: a project whose worktrees
# cannot be configured is still a project its developer needs running.
as_root bash /mnt/ddev_config/branchery/scripts/apply-vhosts.sh || true
as_root bash /mnt/ddev_config/branchery/scripts/apply-php-versions.sh || true

# Git worktrees store absolute host paths; a symlink makes both views line up
# so that git works inside the container as well.
#
# Not fatal either way: the directory above the project is root's for every
# project outside /home, and a link that could not be made costs git inside the
# container its worktrees, not the developer their project. A Windows drive is
# nothing a link can stand for and is left alone.
if [ -n "${HOST_PROJECT_ROOT:-}" ] && [ "${HOST_PROJECT_ROOT}" != "/var/www/html" ]; then
    case "${HOST_PROJECT_ROOT}" in
        /*)
            if ! as_root mkdir -p "$(dirname "${HOST_PROJECT_ROOT}")" \
                || ! as_root ln -sfn /var/www/html "${HOST_PROJECT_ROOT}"; then
                log "Could not link ${HOST_PROJECT_ROOT} to /var/www/html; git will not find the worktrees by their host path inside the container."
            fi
            ;;
        *)
            log "${HOST_PROJECT_ROOT} is not an absolute POSIX path; the project is not linked under it."
            ;;
    esac
fi

git config --global --add safe.directory '*' 2>/dev/null || true
