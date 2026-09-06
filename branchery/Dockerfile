#ddev-generated
# Container for the worktree management.
#
# Deliberately lean: it only serves the interface and the REST API. The actual
# work (git, composer, databases, PHP pools) happens in the project's web
# container, which this container drives via "docker exec" -- all the tools and
# the right environment already exist there.
#
# This image is built once, by the workflow that cuts a release, and pulled by
# every project that installs the add-on. It used to be built in each of them
# from sources copied into .ddev, which is why an install ended in two commands
# and an update in a version nobody could tell apart from the one before it.
# What a project gets now is a tag, and a tag is a version.

FROM docker:29-cli AS dockercli

FROM php:8.4-cli AS build
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /build

# The package lists on their own first: as long as composer.lock does not
# change, this step comes from the cache on subsequent builds.
COPY app/composer.json app/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction --prefer-dist

# Then the sources, and the class map over them.
COPY app/ ./
RUN composer dump-autoload --no-dev --classmap-authoritative

FROM php:8.4-cli
COPY --from=dockercli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=build /build /opt/branchery
# The documentation travels with the application and not with the project.
# The interface does not render it any more -- it is a site of its own -- but
# "ddev branchery docs" prints these files as written, and a manual left behind
# while the application moved on describes something that is no longer there.
COPY docs/ /opt/branchery/docs/
# Which version this is. Read by the running application to say whether the
# project has since been updated to another one -- and last in the file, so
# that a new number does not invalidate every layer above it.
ARG BRANCHERY_VERSION=dev
RUN printf '%s\n' "${BRANCHERY_VERSION}" > /opt/branchery/VERSION
WORKDIR /opt/branchery
