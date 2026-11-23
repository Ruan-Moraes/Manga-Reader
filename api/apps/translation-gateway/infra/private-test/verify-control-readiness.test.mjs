import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyControls } from './verify-control-readiness.mjs';
const url = 'https://example.run.app';
const id = '1234567890123456789';
function fixture() {
  const env = Object.entries({ TARGET_INSTANCE_ID: id, TARGET_INSTANCE: 'tl-translate-test-1103', TARGET_PROJECT: 'toonlira-rm', TARGET_ZONE: 'southamerica-east1-a' }).map(([name, value]) => ({ name, value }));
  return { expectedProbeCidr: '192.0.2.5/32', vm: { id, name: 'tl-translate-test-1103', status: 'RUNNING', zone: 'https://compute.googleapis.com/zones/southamerica-east1-a', labels: { toonlira_test: 'translation' } },
    ip: { id: '2222222222222222222', name: 'tl-translate-test-1103', description: 'toonlira-translation-test-20261103', addressType: 'EXTERNAL', address: '192.0.2.1', status: 'IN_USE', users: ['https://compute.googleapis.com/zones/southamerica-east1-a/instances/tl-translate-test-1103'] },
    denyFirewall: { id: '3333333333333333333', name: 'tl-translate-deny-1103', description: 'toonlira-translation-test-20261103', network: 'https://compute.googleapis.com/global/networks/default', direction: 'INGRESS', priority: 900, disabled: false, sourceRanges: ['0.0.0.0/0'], targetTags: ['tl-translation-test-1103'], denied: [{ IPProtocol: 'all' }] },
    allowFirewall: { id: '4444444444444444444', name: 'tl-translate-https-1103', description: 'toonlira-translation-test-20261103', network: 'https://compute.googleapis.com/global/networks/default', direction: 'INGRESS', priority: 800, disabled: true, sourceRanges: ['192.0.2.5/32'], targetTags: ['tl-translation-test-1103'], allowed: [{ IPProtocol: 'tcp', ports: ['80', '443'] }] },
    controller: { spec: { template: { spec: { containers: [{ env }] } } }, status: { url, conditions: [{ type: 'Ready', status: 'True' }] } },
    controllerIam: { bindings: [{ role: 'roles/run.invoker', members: ['serviceAccount:tl-test-budget-push@toonlira-rm.iam.gserviceaccount.com'] }] },
    subscription: { state: 'ACTIVE', pushConfig: { pushEndpoint: url, oidcToken: { audience: url, serviceAccountEmail: 'tl-test-budget-push@toonlira-rm.iam.gserviceaccount.com' } } },
    workflow: { state: 'ACTIVE', userEnvVars: { VM_ID: id, IP_ID: '2222222222222222222', IP_ADDRESS: '192.0.2.1', DENY_FW_ID: '3333333333333333333', ALLOW_FW_ID: '4444444444444444444' } },
    scheduler: { state: 'ENABLED', schedule: '0 12-23 6 12 *', timeZone: 'America/Sao_Paulo', httpTarget: {
      uri: 'https://workflowexecutions.googleapis.com/v1/projects/toonlira-rm/locations/southamerica-east1/workflows/tl-translation-expiry-1103/executions', httpMethod: 'POST',
      oauthToken: { serviceAccountEmail: 'tl-test-scheduler@toonlira-rm.iam.gserviceaccount.com' }, body: Buffer.from(JSON.stringify({ argument: '{"dryRun": false}' })).toString('base64') } } };
}
test('accepts matching synthetic control identities', () => assert.equal(verifyControls(fixture()), true));
test('rejects placeholder, mismatched workflow and public invoker', () => {
  const placeholder = fixture(); placeholder.controller.spec.template.spec.containers[0].env[0].value = '1';
  const mismatch = fixture(); mismatch.workflow.userEnvVars.VM_ID = '9876543210987654321';
  const publicControl = fixture(); publicControl.controllerIam.bindings[0].members.push('allUsers');
  const inactive = fixture(); inactive.scheduler.state = 'PAUSED';
  const enabledEarly = fixture(); enabledEarly.allowFirewall.disabled = false;
  for (const item of [placeholder, mismatch, publicControl, inactive, enabledEarly]) assert.throws(() => verifyControls(item));
});


test('accepts an explicitly restricted enabled probe but never assumes it', () => {
  const item = fixture(); item.allowFirewall.disabled = false;
  assert.throws(() => verifyControls(item));
  item.expectedAllowEnabled = true;
  assert.equal(verifyControls(item), true);
  item.allowFirewall.sourceRanges = ['0.0.0.0/0'];
  assert.throws(() => verifyControls(item));
});
