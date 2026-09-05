#!/usr/bin/env bash
#ddev-generated
## Applies the PHP version of each worktree.
##
## The source is .ddev/branchery/var/php.map ("<worktree>=<version>"). For every
## version that deviates from the project default, an additional PHP-FPM pool
## runs on its own socket; the web server gets an entry for that worktree which
## points the handler there.
##
## Two halves: what is written -- the server blocks, and which worktrees ask for
## an entry at all -- is decided by functions that take what they need and print
## what they make. Applying it is what happens below the line further down. That
## is what lets the first half be read by a test: no server, no pools, no root.
## See tests/scripts.bats.
set -euo pipefail

STATE="/var/www/html/.ddev/branchery/var"
MAP="${STATE}/php.map"
DOCROOTS="${STATE}/docroots"

# The addresses hang under the project's own name.
tld="${DDEV_SITENAME:-ddev}.${DDEV_TLD:-ddev.site}"

log() { printf '[php-versions] %s\n' "$*"; }

# Which worktrees ask for a PHP of their own, out of the map: one
# "<worktree> <version>" to a line, in the map's order. Every rule about what
# counts is here and nothing else is.
wanted() {
    local map="$1" docroots="$2" default="$3"
    [ -f "$map" ] || return 0

    local worktree version
    while IFS='=' read -r worktree version; do
        worktree="$(printf '%s' "${worktree:-}" | tr -d '[:space:]')"
        version="$(printf '%s' "${version:-}" | tr -d '[:space:]')"
        [ -n "$worktree" ] && [ -n "$version" ] || continue
        case "$worktree" in \#*) continue ;; esac
        # A worktree the map has outlived: its line says nothing about anything.
        # Asked of the link and not of what it points at: a docroot the build has
        # not made yet -- "public" before composer ran -- is a link that leads
        # nowhere, and the version is chosen a step before that. Skipped here, the
        # worktree is served by the project's PHP until something applies this again.
        [ -e "${docroots}/${worktree}" ] || [ -L "${docroots}/${worktree}" ] || continue
        # The project's own version is what the wildcard already serves.
        [ "$version" = "$default" ] && continue
        printf '%s %s\n' "$worktree" "$version"
    done < "$map"
}

# Called again for a pool that is already up, this changes nothing: the entry
# point runs on every container start, and every worktree asks for its version.
#
# Says so when nothing listens afterwards. It used to say the opposite -- the
# exit code of php-fpm went into a pipe -- so a pool that never bound its socket
# still got a server block, and every request to that worktree was a 502.
start_fpm() {
    local version="$1"
    local socket="/run/php/php-fpm-${version}.sock"
    local pool="/etc/php/${version}/fpm/pool.d/www.conf"
    local master="/etc/php/${version}/fpm/php-fpm.conf"

    [ -x "/usr/sbin/php-fpm${version}" ] || { log "PHP ${version} has no php-fpm in this image."; return 1; }
    [ -f "$pool" ] || { log "No pool configuration for PHP ${version}."; return 1; }

    # A socket of its own, in the one directory under /run that belongs to the
    # project's user: a socket straight under root's /run is one the entry point
    # cannot bind. Plus an explicit user, so the pool can also be started as root.
    sed -i \
        -e "s|^listen = .*|listen = ${socket}|" \
        -e "s|^;\?user = .*|user = ${WEB_USER}|" \
        -e "s|^;\?group = .*|group = ${WEB_GROUP}|" \
        "$pool"
    grep -q '^user = ' "$pool" || printf 'user = %s\ngroup = %s\n' "$WEB_USER" "$WEB_GROUP" >> "$pool"

    if pgrep -f "$master" >/dev/null 2>&1; then
        [ -S "$socket" ] && return 0
        # Up, but on the socket an earlier version of this script put it on.
        # Nothing reaches it there, so it goes and comes back where the server
        # blocks below point.
        log "PHP ${version} FPM runs without ${socket}; starting it again."
        pkill -f "$master" || true
        for _ in 1 2 3 4 5 6 7 8 9 10; do
            pgrep -f "$master" >/dev/null 2>&1 || break
            sleep 0.5
        done
    fi

    rm -f "$socket"
    if ! "/usr/sbin/php-fpm${version}" -D; then
        log "PHP ${version} FPM did not start."
        return 1
    fi
    # -D returns once the master is up; the socket follows within a moment.
    for _ in 1 2 3 4 5 6 7 8 9 10; do
        [ -S "$socket" ] && break
        sleep 0.2
    done
    if [ ! -S "$socket" ]; then
        log "PHP ${version} FPM started but did not bind ${socket}."
        return 1
    fi
    log "PHP ${version} FPM started (${socket})."
}

nginx_block() {
    local worktree="$1" version="$2"
    cat <<EOF
# ${worktree} runs with PHP ${version}
server {
    listen 80;
    listen 443 ssl;
    ssl_certificate /etc/ssl/certs/master.crt;
    ssl_certificate_key /etc/ssl/certs/master.key;

    server_name ${worktree}.${tld};
    root ${DOCROOTS}/${worktree};

    include /etc/nginx/monitoring.conf;
    index index.php index.html;
    sendfile off;
    error_log /dev/stdout info;
    access_log /var/log/nginx/access.log;

    location / {
        absolute_redirect off;
        try_files \$uri \$uri/ /index.php\$is_args\$args;
    }

    location ~ \\.php\$ {
        try_files \$uri =404;
        fastcgi_split_path_info ^(.+\\.php)(/.+)\$;
        fastcgi_pass unix:/run/php/php-fpm-${version}.sock;
        fastcgi_buffers 16 16k;
        fastcgi_buffer_size 32k;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_read_timeout 10m;
        fastcgi_param SERVER_NAME \$host;
        fastcgi_param HTTPS \$fcgi_https;
    }

    include /mnt/ddev_config/nginx/*.conf;
}
EOF
}

apache_block() {
    local worktree="$1" version="$2"
    # Cover both views: the web server evaluates <Directory> against the path
    # the docroot is reached through, while the files live in the worktree.
    for path in "${DOCROOTS}/${worktree}" "/var/www/html/.worktrees/${worktree}"; do
        cat <<EOF
<Directory "${path}">
    <FilesMatch "\\.ph(ar|p|tml)\$">
        SetHandler "proxy:unix:/run/php/php-fpm-${version}.sock|fcgi://localhost"
    </FilesMatch>
</Directory>
EOF
    done
}

# Which web server actually serves this project -- not "which configuration
# directory is there": DDEV's web image carries nginx and Apache both, so that
# question always answers nginx and an Apache project would be handed a
# configuration nothing reads. DDEV names the one in charge in the environment.
webserver() {
    case "${DDEV_WEBSERVER_TYPE:-}" in
        nginx*) echo nginx ;;
        apache*) echo apache ;;
        *)
            if pgrep -x apache2 >/dev/null 2>&1; then
                echo apache
            elif pgrep -x nginx >/dev/null 2>&1; then
                echo nginx
            fi
            ;;
    esac
}

# Read rather than run: a test sources this for the functions above and applies
# nothing. Everything below this line touches the container.
[ "${BRANCHERY_SCRIPT_READ_ONLY:-}" = "1" ] && return 0

DEFAULT_PHP="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')"
WEB_USER="$(stat -c %U /var/www/html)"
WEB_GROUP="$(stat -c %G /var/www/html)"

server="$(webserver)"
case "$server" in
    nginx)
        target="/etc/nginx/sites-enabled/zy-branchery-php.conf"
        rm -f /etc/apache2/sites-enabled/zz-branchery-php.conf
        ;;
    apache)
        target="/etc/apache2/sites-enabled/zz-branchery-php.conf"
        rm -f /etc/nginx/sites-enabled/zy-branchery-php.conf
        ;;
    *) exit 0 ;;
esac

: > "${target}.tmp"
started=""
failed=""

while read -r worktree version; do
    # A worktree whose pool is not up gets no entry: without one it is caught
    # by the wildcard and served with the project's PHP, which answers.
    case " $started " in
        *" $version "*) ;;
        *)
            case " $failed " in
                *" $version "*)
                    log "No entry for ${worktree}: PHP ${version} is not up."
                    continue
                    ;;
            esac
            if start_fpm "$version"; then
                started="${started} ${version}"
            else
                failed="${failed} ${version}"
                log "No entry for ${worktree}: PHP ${version} is not up, the project's PHP serves it until it is."
                continue
            fi
            ;;
    esac

    if [ "$server" = nginx ]; then
        nginx_block "$worktree" "$version" >> "${target}.tmp"
    else
        apache_block "$worktree" "$version" >> "${target}.tmp"
    fi
done < <(wanted "$MAP" "$DOCROOTS" "$DEFAULT_PHP")

mv "${target}.tmp" "$target"

if [ "$server" = nginx ]; then
    if pgrep -x nginx >/dev/null 2>&1 && nginx -t >/dev/null 2>&1; then
        nginx -s reload
        log "nginx reloaded."
    fi
elif pgrep -x apache2 >/dev/null 2>&1; then
    if apachectl -t >/dev/null 2>&1; then
        apachectl graceful 2>&1 | grep -vF "Could not reliably determine" || true
        log "Apache reloaded."
    fi
fi
