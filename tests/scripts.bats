#!/usr/bin/env bats
#
# What the two scripts in the web container write, read without a web container.
#
# They are the most fragile thing this add-on ships: sed on pool configurations,
# pgrep and pkill on php-fpm masters, server blocks for two web servers. The
# comments in them read as a list of past outages -- an exit code that went into
# a pipe, a pool that got a server block without ever binding its socket -- and
# every one of those was found by a developer, in a project, at the wrong
# moment. Each script now writes what it writes in functions that take what they
# need and print what they make, and this reads them.
#
# What is not covered here is the applying half. That needs a container, and
# tests/test.bats walks it.

setup() {
    SCRIPTS="${BATS_TEST_DIRNAME}/../branchery/scripts"
    export BRANCHERY_SCRIPT_READ_ONLY=1
    export DDEV_SITENAME=blog
    export DDEV_TLD=ddev.site
    WORK="$(mktemp -d)"
}

teardown() {
    rm -rf "$WORK"
}

# The generating half of a script, with nothing applied.
vhosts() {
    # shellcheck disable=SC1090
    source "${SCRIPTS}/apply-vhosts.sh"
}

versions() {
    # shellcheck disable=SC1090
    source "${SCRIPTS}/apply-php-versions.sh"
}

@test "the nginx server name matches a worktree under the project's domain" {
    run bash -c 'source "$0"; nginx_config' "${SCRIPTS}/apply-vhosts.sh"

    [ "$status" -eq 0 ]
    [[ "$output" == *'server_name ~^(?<worktree>[a-z0-9-]+)\.blog\.ddev\.site$;'* ]]
    [[ "$output" == *'root /var/www/html/.ddev/branchery/var/docroots/$worktree;'* ]]
}

@test "the nginx configuration hands PHP to the project's own pool" {
    run bash -c 'source "$0"; nginx_config' "${SCRIPTS}/apply-vhosts.sh"

    [[ "$output" == *'fastcgi_pass unix:/run/php-fpm.sock;'* ]]
}

@test "the Apache configuration serves both ports and only one of them with SSL" {
    run bash -c 'source "$0"; apache_config' "${SCRIPTS}/apply-vhosts.sh"

    [ "$status" -eq 0 ]
    [[ "$output" == *'<VirtualHost *:80>'* ]]
    [[ "$output" == *'<VirtualHost *:443>'* ]]
    [[ "$output" == *'SSLCertificateFile /etc/ssl/certs/master.crt'* ]]
    # The name is the wildcard's, and every worktree is a directory under it.
    [[ "$output" == *'ServerAlias *.blog.ddev.site'* ]]
    [[ "$output" == *'VirtualDocumentRoot /var/www/html/.ddev/branchery/var/docroots/%1'* ]]
}

@test "a worktree on the project's own version asks for nothing" {
    mkdir -p "${WORK}/docroots/my-fix"
    printf 'my-fix=8.3\n' > "${WORK}/php.map"

    run bash -c 'source "$0"; wanted "$1" "$2" 8.3' "${SCRIPTS}/apply-php-versions.sh" "${WORK}/php.map" "${WORK}/docroots"

    [ "$status" -eq 0 ]
    [ -z "$output" ]
}

@test "a worktree on another version asks for an entry" {
    mkdir -p "${WORK}/docroots/my-fix"
    printf 'my-fix=8.4\n' > "${WORK}/php.map"

    run bash -c 'source "$0"; wanted "$1" "$2" 8.3' "${SCRIPTS}/apply-php-versions.sh" "${WORK}/php.map" "${WORK}/docroots"

    [ "$output" = "my-fix 8.4" ]
}

@test "a line the map has outlived is passed over" {
    mkdir -p "${WORK}/docroots/here"
    printf 'gone=8.4\nhere=8.4\n' > "${WORK}/php.map"

    run bash -c 'source "$0"; wanted "$1" "$2" 8.3' "${SCRIPTS}/apply-php-versions.sh" "${WORK}/php.map" "${WORK}/docroots"

    [ "$output" = "here 8.4" ]
}

@test "blank lines, comments and stray spaces are not worktrees" {
    mkdir -p "${WORK}/docroots/my-fix"
    printf '\n# what this is\n  my-fix = 8.4 \n\n' > "${WORK}/php.map"

    run bash -c 'source "$0"; wanted "$1" "$2" 8.3' "${SCRIPTS}/apply-php-versions.sh" "${WORK}/php.map" "${WORK}/docroots"

    [ "$output" = "my-fix 8.4" ]
}

# The docroots are symlinks into the worktree, and the version is chosen one
# step before the build creates what they point at.
@test "a docroot link that leads nowhere yet is still a worktree" {
    mkdir -p "${WORK}/docroots"
    ln -s "${WORK}/nothing/public" "${WORK}/docroots/my-fix"
    printf 'my-fix=8.4\n' > "${WORK}/php.map"

    run bash -c 'source "$0"; wanted "$1" "$2" 8.3' "${SCRIPTS}/apply-php-versions.sh" "${WORK}/php.map" "${WORK}/docroots"

    [ "$output" = "my-fix 8.4" ]
}

@test "a map that is not there asks for nothing rather than failing" {
    run bash -c 'source "$0"; wanted "$1" "$2" 8.3' "${SCRIPTS}/apply-php-versions.sh" "${WORK}/nothing.map" "${WORK}/docroots"

    [ "$status" -eq 0 ]
    [ -z "$output" ]
}

@test "the nginx entry points that worktree at the pool of its own version" {
    run bash -c 'source "$0"; nginx_block my-fix 8.4' "${SCRIPTS}/apply-php-versions.sh"

    [ "$status" -eq 0 ]
    [[ "$output" == *'server_name my-fix.blog.ddev.site;'* ]]
    [[ "$output" == *'fastcgi_pass unix:/run/php/php-fpm-8.4.sock;'* ]]
}

@test "the Apache entry covers both views of the same files" {
    run bash -c 'source "$0"; apache_block my-fix 8.4' "${SCRIPTS}/apply-php-versions.sh"

    [ "$status" -eq 0 ]
    # The web server evaluates <Directory> against the path the docroot is
    # reached through; the files live in the worktree.
    [[ "$output" == *'<Directory "/var/www/html/.ddev/branchery/var/docroots/my-fix">'* ]]
    [[ "$output" == *'<Directory "/var/www/html/.worktrees/my-fix">'* ]]
    [[ "$output" == *'proxy:unix:/run/php/php-fpm-8.4.sock|fcgi://localhost'* ]]
}

@test "which server is in charge is what DDEV says, not what is installed" {
    run env DDEV_WEBSERVER_TYPE=apache-fpm bash -c 'source "$0"; webserver' "${SCRIPTS}/apply-vhosts.sh"
    [ "$output" = "apache" ]

    run env DDEV_WEBSERVER_TYPE=nginx-fpm bash -c 'source "$0"; webserver' "${SCRIPTS}/apply-vhosts.sh"
    [ "$output" = "nginx" ]
}
