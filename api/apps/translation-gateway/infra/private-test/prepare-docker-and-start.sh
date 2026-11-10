#!/bin/bash
# Dedicated COS test VM, with public ingress closed throughout this procedure.
# Invoke on each VM boot before starting any application containers.
set -Eeuo pipefail
umask 077
ROOT=${1:-/var/lib/toonlira-translation-test}
[ "$(id -u)" = 0 ] && [[ "$ROOT" = /* ]] && [ -d "$ROOT" ]
[ "$(uname -m)" = x86_64 ]
grep -q '^ID=cos$' /etc/os-release
grep -Eq '^VERSION_ID="?125"?$' /etc/os-release
[ "$(docker version --format '{{.Server.Version}}')" = 27.5.1 ]
[ -z "$(docker ps -q)" ]
for file in configure-docker.mjs start-private-test.sh; do
    [ -f "$ROOT/$file" ] && [ ! -L "$ROOT/$file" ]
done
[ -f /etc/docker/daemon.json ] && [ ! -L /etc/docker/daemon.json ]
command -v docker-credential-gcr >/dev/null
mkdir -p "$ROOT/docker-auth"
chmod 700 "$ROOT/docker-auth"
export DOCKER_CONFIG="$ROOT/docker-auth"
printf '%s\n' '{"credHelpers":{"southamerica-east1-docker.pkg.dev":"gcr"}}' > "$DOCKER_CONFIG/config.json"
BUDGET_IMAGE='southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-translate-test-1103/budget@sha256:4bc74f9892f1d176e75682435c8af8f80a0f3097cf62651ba42d15da40d1b38c'
docker pull "$BUDGET_IMAGE" >/dev/null
[ "$(docker image inspect --format '{{.Architecture}}' "$BUDGET_IMAGE")" = amd64 ]
live_restore=$(docker info --format '{{.LiveRestoreEnabled}}')
case "$live_restore" in true|false) ;; *) exit 1 ;; esac
docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges \
  --user 0:0 --mount type=bind,src=/etc/docker,dst=/config \
  --mount "type=bind,src=$ROOT/configure-docker.mjs,dst=/configure.mjs,readonly" \
  --entrypoint node "$BUDGET_IMAGE" /configure.mjs
# Restart even if the running daemon reports false: this validates and loads
# the file, and ensures this boot does not use stale daemon configuration.
[ -z "$(docker ps -q)" ]
systemctl restart docker
[ "$(docker info --format '{{.LiveRestoreEnabled}}')" = false ]
[ -z "$(docker ps -q)" ]
case "${TOONLIRA_HOLD_PROXY_EGRESS:-0}" in
  0) ;;
  1) if ! iptables -w -C DOCKER-USER -s 172.30.243.2/32 -j DROP 2>/dev/null; then
       iptables -w -I DOCKER-USER 1 -s 172.30.243.2/32 -j DROP
     fi ;;
  *) exit 1 ;;
esac
exec bash "$ROOT/start-private-test.sh" "$ROOT"
