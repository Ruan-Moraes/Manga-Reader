#!/bin/bash
# Dedicated COS VM only. The network firewall must remain closed to public
# ingress until independent synthetic verification and review are complete.
set -Eeuo pipefail
umask 077
ROOT=${1:-/var/lib/toonlira-translation-test}
[ "$(id -u)" = 0 ] && [[ "$ROOT" = /* ]] && [ -d "$ROOT" ]
[ "$(uname -m)" = x86_64 ]
grep -q '^ID=cos$' /etc/os-release
grep -Eq '^VERSION_ID="?125"?$' /etc/os-release
[ "$(docker version --format '{{.Server.Version}}')" = 27.5.1 ]
[ "$(docker info --format '{{.CgroupVersion}}')" = 2 ]
# A daemon restart must not leave the proxy running while network rules change.
[ "$(docker info --format '{{.LiveRestoreEnabled}}')" = false ]
[ -z "$(docker ps -q --filter label=com.docker.compose.project=toonlira-translation-test)" ]
awk '$1=="MemTotal:" {seen=1;if($2<15728640)exit 1} END{if(!seen)exit 2}' /proc/meminfo
awk '$1=="SwapTotal:" {seen=1;if($2!=0)exit 1} END{if(!seen)exit 2}' /proc/meminfo
for file in compose.yaml settings.env published.json deployment-preflight.mjs deployment-config.mjs metadata-check.mjs metadata-guard.sh; do
    [ -f "$ROOT/$file" ] && [ ! -L "$ROOT/$file" ]
done
[ "$(stat -c %a "$ROOT/settings.env")" = 600 ]
command -v docker-credential-gcr >/dev/null
mkdir -p "$ROOT/docker-auth"
chmod 700 "$ROOT/docker-auth"
export DOCKER_CONFIG="$ROOT/docker-auth"
printf '%s\n' '{"credHelpers":{"southamerica-east1-docker.pkg.dev":"gcr"}}' > "$DOCKER_CONFIG/config.json"

# These images are fixed to the publication receipt and are pulled before the
# launcher runs; no credentials are copied into an application container.
BUDGET_IMAGE='southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-translate-test-1103/budget@sha256:4bc74f9892f1d176e75682435c8af8f80a0f3097cf62651ba42d15da40d1b38c'
LAUNCHER_IMAGE='southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-translate-test-1103/launcher@sha256:0aaa59da2dfbf8bb234a86625bd85d325b3339dabe71a366054832370f059240'
docker pull "$BUDGET_IMAGE" >/dev/null
docker pull "$LAUNCHER_IMAGE" >/dev/null
PUBLIC_IP=$(curl --fail --silent --show-error --max-time 5 -H 'Metadata-Flavor: Google' \
  http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)
[[ "$PUBLIC_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]
docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges --user 0:0 \
  --env-file "$ROOT/settings.env" -e "VM_PUBLIC_IP=$PUBLIC_IP" \
  --mount "type=bind,src=$ROOT,dst=/input,readonly" --entrypoint node "$BUDGET_IMAGE" \
  /input/deployment-preflight.mjs

# Read digest values without evaluating the environment file as shell code.
image() {
    key=$1
    value=$(awk -F= -v key="$key" '$1==key {count++; sub(/^[^=]*=/, ""); print} END {if(count!=1)exit 1}' "$ROOT/settings.env")
    [[ "$value" =~ ^southamerica-east1-docker\.pkg\.dev/toonlira-rm/toonlira-translate-test-1103/(gateway|postgres|proxy|rate)@sha256:[0-9a-f]{64}$ ]]
    printf '%s' "$value"
}
for key in GATEWAY_IMAGE POSTGRES_IMAGE PROXY_IMAGE RATE_IMAGE; do
    digest=$(image "$key")
    docker pull "$digest" >/dev/null
    [ "$(docker image inspect --format '{{.Architecture}}' "$digest")" = amd64 ]
done

compose() {
    docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges \
      --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
      --mount "type=bind,src=$ROOT,dst=/input,readonly" "$LAUNCHER_IMAGE" \
      --env-file /input/settings.env --project-name toonlira-translation-test -f /input/compose.yaml "$@"
}
quarantine=0
failure() {
    status=$?
    trap - ERR
    # Leave quarantine in place if a stop fails; never erase operational data.
    if [ "$quarantine" = 1 ]; then compose stop proxy >/dev/null 2>&1 || true; fi
    printf '%s\n' private-test-start-failed >&2
    exit "$status"
}
trap failure ERR
bash "$ROOT/metadata-guard.sh"
# Refuse to remove a pre-existing rule that this invocation does not own.
for destination in 172.30.242.2 172.30.243.2; do
    if iptables -w -C DOCKER-USER -d "$destination/32" -p tcp -m multiport --dports 80,443 -j DROP 2>/dev/null; then
        printf '%s\n' 'existing quarantine rule requires inspection' >&2; false
    fi
done
quarantine=1
for destination in 172.30.242.2 172.30.243.2; do
    iptables -w -I DOCKER-USER 1 -d "$destination/32" -p tcp -m multiport --dports 80,443 -j DROP
done
compose up -d --no-build --pull never postgres gateway rate proxy >/dev/null
gateway=$(compose ps -q gateway)
proxy=$(compose ps -q proxy)
[ -n "$gateway" ] && [ -n "$proxy" ]
[ "$(docker inspect --format '{{(index .NetworkSettings.Networks "toonlira-translation-test_private").IPAddress}}' "$proxy")" = 172.30.242.2 ]
[ "$(docker inspect --format '{{(index .NetworkSettings.Networks "toonlira-translation-test_proxy_egress").IPAddress}}' "$proxy")" = 172.30.243.2 ]
for network in toonlira-translation-test_private toonlira-translation-test_proxy_egress toonlira-translation-test_provider_egress; do
    [ "$(docker network inspect --format '{{.EnableIPv6}}' "$network")" = false ]
done
probe() {
    target=$1; mode=$2
    docker run --rm --pull=never --read-only --cap-drop ALL --security-opt no-new-privileges --user 0:0 \
      --network "container:$target" --mount "type=bind,src=$ROOT/metadata-check.mjs,dst=/probe/metadata-check.mjs,readonly" \
      --entrypoint node "$BUDGET_IMAGE" /probe/metadata-check.mjs "$mode"
}
probe "$gateway" allow
probe "$proxy" deny
probe "$proxy" dns
for destination in 172.30.242.2 172.30.243.2; do
    iptables -w -D DOCKER-USER -d "$destination/32" -p tcp -m multiport --dports 80,443 -j DROP
done
quarantine=0
trap - ERR
printf '%s\n' private-test-started-pending-external-review
