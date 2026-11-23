import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createStartupHook } from './create-startup-hook.mjs';

const names = ['SHA256SUMS', 'compose.yaml', 'configure-docker.mjs', 'deployment-config.mjs', 'deployment-preflight.mjs',
  'metadata-check.mjs', 'metadata-guard.sh', 'prepare-docker-and-start.sh', 'published.json', 'start-private-test.sh'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const encode = bytes => Buffer.from(bytes).toString('base64');

// This startup script contains only code, public image digests and a manifest.
// The private database settings are sealed to a key generated inside the VM.
export function createProvisionStartup(bundle, cryptoSource, smokeSource) {
  const hook = createStartupHook(bundle);
  const files = names.map(name => [name, readFileSync(join(bundle, name))]);
  const sealed = Buffer.from(cryptoSource);
  const smoke = Buffer.from(smokeSource);
  if (!sealed.length || sealed.length > 65536 || !smoke.length || smoke.length > 65536) throw Error('Invalid startup code');
  const payload = [...files, ['sealed-settings.mjs', sealed], ['identity-smoke.mjs', smoke], ['startup-hook.sh', Buffer.from(hook)]]
    .map(([name, bytes]) => `printf '%s' '${encode(bytes)}' | base64 -d > "$ROOT/${name}"`).join('\n');
  return `#!/bin/bash
set -Eeuo pipefail
umask 077
ROOT=/var/lib/toonlira-translation-test
exec >/dev/ttyS0 2>&1
[ "$(id -u)" = 0 ] && [ "$(uname -m)" = x86_64 ]
grep -q '^ID=cos$' /etc/os-release
grep -Eq '^VERSION_ID="?125"?$' /etc/os-release
[ "$(docker version --format '{{.Server.Version}}')" = 27.5.1 ]
[ -z "$(docker ps -q)" ]
metadata() { curl --fail --silent --show-error --max-time 5 -H 'Metadata-Flavor: Google' "http://metadata.google.internal/computeMetadata/v1/$1"; }
[ "$(metadata project/project-id)" = toonlira-rm ]
[ "$(metadata instance/name)" = tl-translate-test-1103 ]
INSTANCE_ID=$(metadata instance/id)
[[ "$INSTANCE_ID" =~ ^[0-9]{10,}$ ]]
if [ ! -e "$ROOT" ]; then
  mkdir -m 700 "$ROOT"
${payload}
  chmod 600 "$ROOT"/*
  touch "$ROOT/.installed"
fi
[ -d "$ROOT" ] && [ ! -L "$ROOT" ] && [ -f "$ROOT/.installed" ] && [ ! -L "$ROOT/.installed" ]
[ "$(sha256sum "$ROOT/sealed-settings.mjs" | cut -d' ' -f1)" = '${digest(sealed)}' ]
[ "$(sha256sum "$ROOT/startup-hook.sh" | cut -d' ' -f1)" = '${digest(Buffer.from(hook))}' ]
[ "$(sha256sum "$ROOT/identity-smoke.mjs" | cut -d' ' -f1)" = '${digest(smoke)}' ]
mkdir -p "$ROOT/docker-auth"
chmod 700 "$ROOT/docker-auth"
export DOCKER_CONFIG="$ROOT/docker-auth"
printf '%s\\n' '{"credHelpers":{"southamerica-east1-docker.pkg.dev":"gcr"}}' > "$DOCKER_CONFIG/config.json"
BUDGET_IMAGE='southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-translate-test-1103/budget@sha256:4bc74f9892f1d176e75682435c8af8f80a0f3097cf62651ba42d15da40d1b38c'
docker pull "$BUDGET_IMAGE" >/dev/null
node_tool() {
 docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges --user 0:0 \\
  --mount "type=bind,src=$ROOT,dst=/state" --entrypoint node "$BUDGET_IMAGE" /state/sealed-settings.mjs "$@"
}
if [ ! -e "$ROOT/settings.env" ]; then
 if [ ! -e "$ROOT/bootstrap-private.pem" ] && [ ! -e "$ROOT/bootstrap-public.pem" ]; then
   node_tool generate /state/bootstrap-private.pem /state/bootstrap-public.pem
 fi
 [ -f "$ROOT/bootstrap-private.pem" ] && [ ! -L "$ROOT/bootstrap-private.pem" ] && [ "$(stat -c %a "$ROOT/bootstrap-private.pem")" = 600 ]
 [ -f "$ROOT/bootstrap-public.pem" ] && [ ! -L "$ROOT/bootstrap-public.pem" ]
 printf 'TOONLIRA_PUBLIC_KEY_V1 %s %s\\n' "$INSTANCE_ID" "$(base64 -w0 "$ROOT/bootstrap-public.pem")"
 for ((attempt=0; attempt<60; attempt++)); do
   if metadata instance/attributes/toonlira-envelope > "$ROOT/envelope.tmp" 2>/dev/null && [ -s "$ROOT/envelope.tmp" ] && [ "$(stat -c %s "$ROOT/envelope.tmp")" -le 65536 ]; then
     mv "$ROOT/envelope.tmp" "$ROOT/envelope.json"
     node_tool open /state/bootstrap-private.pem /state/envelope.json /state/settings.env
     break
   fi
   rm -f "$ROOT/envelope.tmp"
   sleep 10
 done
fi
[ -f "$ROOT/settings.env" ] && [ ! -L "$ROOT/settings.env" ] && [ "$(stat -c %a "$ROOT/settings.env")" = 600 ]
GATE=$(metadata instance/attributes/toonlira-proxy-egress 2>/dev/null || true)
case "$GATE" in enabled) export TOONLIRA_HOLD_PROXY_EGRESS=0;; *) export TOONLIRA_HOLD_PROXY_EGRESS=1;; esac
bash "$ROOT/startup-hook.sh"
PROXY=$(docker ps -q --filter label=com.docker.compose.project=toonlira-translation-test --filter label=com.docker.compose.service=proxy)
[ -n "$PROXY" ]
[ "$(docker exec "$PROXY" sha256sum /srv/legal/terms/index.html | cut -d' ' -f1)" = 'aa3b0f056e3b9ad8e581a91526cf2ba07d8033fe9210882e482b264f9c17762d' ]
[ "$(docker exec "$PROXY" sha256sum /srv/legal/privacy/index.html | cut -d' ' -f1)" = '9a4ecc91ae629abc5c90c5b4141da269372937113e06adb9c154fe3a94184b72' ]
docker run --rm --network toonlira-translation-test_private --read-only --cap-drop ALL --security-opt no-new-privileges --user 0:0 \
 --mount "type=bind,src=$ROOT/identity-smoke.mjs,dst=/probe/smoke.mjs,readonly" --entrypoint node "$BUDGET_IMAGE" /probe/smoke.mjs
if [ "$TOONLIRA_HOLD_PROXY_EGRESS" = 1 ]; then
 iptables -w -C DOCKER-USER -s 172.30.243.2/32 -j DROP
fi
printf 'TOONLIRA_PRIVATE_READY_V1 %s\\n' "$INSTANCE_ID"
if [ "$TOONLIRA_HOLD_PROXY_EGRESS" = 1 ]; then
 for ((attempt=0; attempt<90; attempt++)); do
   GATE=$(metadata instance/attributes/toonlira-proxy-egress 2>/dev/null || true)
   if [ "$GATE" = enabled ]; then
     iptables -w -D DOCKER-USER -s 172.30.243.2/32 -j DROP
     printf 'TOONLIRA_PROXY_EGRESS_READY_V1 %s\\n' "$INSTANCE_ID"
     exit 0
   fi
   sleep 10
 done
 exit 1
fi
printf 'TOONLIRA_PROXY_EGRESS_READY_V1 %s\\n' "$INSTANCE_ID"
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [bundle, sealedPath, smokePath, output] = process.argv.slice(2);
    if (!bundle || !sealedPath || !smokePath || !output || process.argv.length !== 6) throw Error('Invalid arguments');
    writeFileSync(output, createProvisionStartup(bundle, readFileSync(sealedPath), readFileSync(smokePath)), { flag: 'wx', mode: 0o600 });
    process.stdout.write('provision-startup-created\n');
  } catch {
    process.stderr.write('provision-startup-failed\n');
    process.exitCode = 1;
  }
}
