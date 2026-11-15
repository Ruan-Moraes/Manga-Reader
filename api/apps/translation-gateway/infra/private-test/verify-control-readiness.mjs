import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isIP } from 'node:net';

// Read-only evidence check. It is not a replacement for triggering the stop
// path, checking IAM inheritance, inspecting actual billing, or testing expiry.
export function verifyControls({ vm, ip, denyFirewall, allowFirewall, controller, controllerIam, subscription, workflow, scheduler, expectedProbeCidr, expectedAllowEnabled = false }) {
  const id = String(vm?.id ?? '');
  if (!/^[0-9]{10,}$/.test(id) || vm.name !== 'tl-translate-test-1103' || vm.status !== 'RUNNING'
      || vm.labels?.toonlira_test !== 'translation' || !vm.zone?.endsWith('/zones/southamerica-east1-a')) throw Error('Invalid VM');
  const env = controller?.spec?.template?.spec?.containers?.[0]?.env ?? [];
  const values = Object.fromEntries(env.map(({ name, value }) => [name, value]));
  for (const [key, value] of Object.entries({ TARGET_INSTANCE_ID: id, TARGET_INSTANCE: vm.name,
    TARGET_PROJECT: 'toonlira-rm', TARGET_ZONE: 'southamerica-east1-a' })) {
    if (values[key] !== value || env.filter(item => item.name === key).length !== 1) throw Error('Controller target mismatch');
  }
  const status = controller?.status;
  if (!status?.url || !status.conditions?.some(c => c.type === 'Ready' && c.status === 'True')) throw Error('Controller not ready');
  const bindings = controllerIam?.bindings ?? [];
  const invokers = bindings.filter(b => b.role === 'roles/run.invoker').flatMap(b => b.members ?? []);
  if (invokers.length !== 1 || invokers[0] !== 'serviceAccount:tl-test-budget-push@toonlira-rm.iam.gserviceaccount.com'
      || bindings.some(b => b.members?.some(m => ['allUsers', 'allAuthenticatedUsers'].includes(m)))) throw Error('Controller IAM mismatch');
  const push = subscription?.pushConfig;
  if (subscription.state !== 'ACTIVE' || push?.pushEndpoint !== status.url || push?.oidcToken?.audience !== status.url
      || push?.oidcToken?.serviceAccountEmail !== 'tl-test-budget-push@toonlira-rm.iam.gserviceaccount.com') throw Error('Push mismatch');
  const ipId = String(ip?.id ?? '');
  const denyId = String(denyFirewall?.id ?? '');
  const allowId = String(allowFirewall?.id ?? '');
  if (![ipId, denyId, allowId].every(value => /^[0-9]{10,}$/.test(value)) || ip.name !== vm.name
      || ip.description !== 'toonlira-translation-test-20261103' || ip.addressType !== 'EXTERNAL' || isIP(ip.address) !== 4
      || ip.status !== 'IN_USE' || !ip.users?.some(user => user.endsWith(`/zones/southamerica-east1-a/instances/${vm.name}`))) throw Error('IP mismatch');
  if (typeof expectedAllowEnabled !== 'boolean') throw Error('Invalid firewall expectation');
  if (typeof expectedProbeCidr !== 'string' || !expectedProbeCidr.endsWith('/32') || isIP(expectedProbeCidr.slice(0, -3)) !== 4) throw Error('Invalid probe source');
  function firewall(rule, name, priority, disabled, source) {
    return rule?.name === name && rule.description === 'toonlira-translation-test-20261103'
      && rule.network?.endsWith('/global/networks/default') && rule.direction === 'INGRESS' && rule.priority === priority
      && Boolean(rule.disabled) === disabled && JSON.stringify(rule.sourceRanges) === JSON.stringify([source])
      && JSON.stringify(rule.targetTags) === '["tl-translation-test-1103"]';
  }
  if (!firewall(denyFirewall, 'tl-translate-deny-1103', 900, false, '0.0.0.0/0')
      || !denyFirewall.denied?.some(rule => rule.IPProtocol === 'all')
      || !firewall(allowFirewall, 'tl-translate-https-1103', 800, !expectedAllowEnabled, expectedProbeCidr)
      || !allowFirewall.allowed?.some(rule => rule.IPProtocol === 'tcp' && ['80', '443'].every(port => rule.ports?.includes(port)) && rule.ports.length === 2)) throw Error('Firewall mismatch');
  if (workflow?.state !== 'ACTIVE' || workflow.userEnvVars?.VM_ID !== id || workflow.userEnvVars?.IP_ID !== ipId || workflow.userEnvVars?.IP_ADDRESS !== ip.address
      || workflow.userEnvVars?.DENY_FW_ID !== denyId || workflow.userEnvVars?.ALLOW_FW_ID !== allowId) throw Error('Workflow target mismatch');
  const target = scheduler?.httpTarget;
  const expectedUrl = 'https://workflowexecutions.googleapis.com/v1/projects/toonlira-rm/locations/southamerica-east1/workflows/tl-translation-expiry-1103/executions';
  let body;
  try { body = JSON.parse(Buffer.from(target.body, 'base64').toString('utf8')); } catch { throw Error('Invalid schedule payload'); }
  if (scheduler.state !== 'ENABLED' || scheduler.schedule !== '0 12-23 6 12 *' || scheduler.timeZone !== 'America/Sao_Paulo'
      || target.uri !== expectedUrl || target.httpMethod !== 'POST'
      || target.oauthToken?.serviceAccountEmail !== 'tl-test-scheduler@toonlira-rm.iam.gserviceaccount.com'
      || body.argument !== '{"dryRun": false}') throw Error('Schedule mismatch');
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw Error('Expected evidence file');
    verifyControls(JSON.parse(readFileSync(process.argv[2], 'utf8')));
    process.stdout.write('control-targets-match\n');
  } catch {
    process.stderr.write('control-target-verification-failed\n');
    process.exitCode = 1;
  }
}
