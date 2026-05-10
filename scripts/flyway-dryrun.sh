#!/usr/bin/env bash
# flyway-dryrun.sh — validate Flyway migrations against a target database
# without applying them.
#
# Usage:
#   ./scripts/flyway-dryrun.sh <jdbc-url> <user> <password>
#
# Example:
#   ./scripts/flyway-dryrun.sh jdbc:postgresql://staging-db.internal:5432/mangareader app_user "$STAGING_PWD"
#
# Runs:
#   1. flyway:info     — list pending vs applied migrations
#   2. flyway:validate — checksum + chronology check vs schema_history
#
# Pre-deploy step: run against a clone of prod *before* a release.
# Catches version collisions, checksum drift, missing migrations.

set -euo pipefail

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <jdbc-url> <user> <password>" >&2
    exit 1
fi

JDBC_URL="$1"
DB_USER="$2"
DB_PASSWORD="$3"

cd "$(dirname "$0")/../backend"

echo "==> flyway:info"
mvn -q flyway:info \
    -Dflyway.url="$JDBC_URL" \
    -Dflyway.user="$DB_USER" \
    -Dflyway.password="$DB_PASSWORD"

echo
echo "==> flyway:validate"
mvn -q flyway:validate \
    -Dflyway.url="$JDBC_URL" \
    -Dflyway.user="$DB_USER" \
    -Dflyway.password="$DB_PASSWORD"

echo
echo "✓ Migrations validated. Safe to flyway:migrate."
