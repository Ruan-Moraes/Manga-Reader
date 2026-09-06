import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';

import { implementationChecksum, validateFeatureIntegrity, validateReconciliationSummary } from './sdd-integrity.mjs';

const checksum = 'a'.repeat(64);
const artifact = status => ({
    metadata: { id: 'MOB-FEAT-001', status },
    content: '### AC-001 — Um\n\n### AC-002 — Dois\n',
});
const tasks = open =>
    `| Critério | Tasks | Evidência |\n| --- | --- | --- |\n| AC-001 | TASK-001 | teste |\n| AC-002 | TASK-002 | teste |\n\n- [${open ? ' ' : 'x'}] TASK-001 — executar`;
const review = verdict =>
    `- Implementação/revisão: working-tree sha256:${checksum}\n- Verdict: \`${verdict}\`\n\n| Critério | Resultado |\n| --- | --- |\n| AC-001 | pass |\n| AC-002 | pass |`;
const evidence = new Set(['MOB-FEAT-001/AC-001', 'MOB-FEAT-001/AC-002']);

function validate(status, overrides = {}) {
    const errors = [];
    validateFeatureIntegrity({
        artifact: artifact(status),
        tasksContent: tasks(status === 'verification-pending'),
        reviewContent: review(status === 'verification-pending' ? 'verification-pending' : 'approved'),
        driftContent: '# Drift',
        evidenceReferences: evidence,
        expectedChecksum: checksum,
        errors,
        ...overrides,
    });
    return errors;
}

test('aceita implemented concluída e verification-pending aberta', () => {
    assert.deepEqual(validate('implemented'), []);
    assert.deepEqual(validate('verification-pending'), []);
});

test('não exige evidência de execução antes de a spec entrar em execução', () => {
    assert.deepEqual(validate('draft', { tasksContent: null, reviewContent: null, driftContent: null, evidenceReferences: new Set() }), []);
    assert.deepEqual(validate('approved', { tasksContent: null, reviewContent: null, driftContent: null, evidenceReferences: new Set() }), []);
});

test('rejeita task aberta em implemented e fechada em verification-pending', () => {
    assert.ok(validate('implemented', { tasksContent: tasks(true) }).some(error => error.includes('não permite task aberta')));
    assert.ok(validate('verification-pending', { tasksContent: tasks(false) }).some(error => error.includes('exige ao menos uma task aberta')));
});

test('rejeita AC sem evidência, linha única, drift, verdict ou checksum', () => {
    assert.ok(validate('implemented', { evidenceReferences: new Set() }).some(error => error.includes('sem evidência')));
    assert.ok(validate('implemented', { tasksContent: '| AC-001 | TASK |' }).some(error => error.includes('AC-002')));
    assert.ok(validate('implemented', { driftContent: null }).some(error => error.includes('drift-audit')));
    assert.ok(validate('implemented', { reviewContent: review('verification-pending') }).some(error => error.includes('verdict approved')));
    assert.ok(validate('implemented', { expectedChecksum: 'b'.repeat(64) }).some(error => error.includes('checksum')));
});

test('checksum cobre recursos e configuração, mas não é autorreferente às evidências que o registram', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'mobile-sdd-'));
    mkdirSync(resolve(root, 'src'), { recursive: true });
    mkdirSync(resolve(root, 'assets'), { recursive: true });
    mkdirSync(resolve(root, 'docs', 'specs', 'feature'), { recursive: true });
    writeFileSync(resolve(root, 'src', 'app.ts'), 'export const app = true;');
    writeFileSync(resolve(root, 'assets', 'label.json'), '{"label":"one"}');
    writeFileSync(resolve(root, 'package.json'), '{"name":"fixture"}');
    writeFileSync(resolve(root, 'docs', 'specs', 'feature', 'review.md'), 'checksum antigo');
    writeFileSync(resolve(root, 'docs', 'specs', 'feature', 'drift-audit.md'), 'checksum antigo');
    const initial = implementationChecksum(root);

    writeFileSync(resolve(root, 'docs', 'specs', 'feature', 'review.md'), 'checksum novo');
    writeFileSync(resolve(root, 'docs', 'specs', 'feature', 'drift-audit.md'), 'checksum novo');
    assert.equal(implementationChecksum(root), initial);
    writeFileSync(resolve(root, 'assets', 'label.json'), '{"label":"two"}');
    assert.notEqual(implementationChecksum(root), initial);
});

test('valida supersession corrente e contadores derivados da reconciliação', () => {
    const content = `| Baselines observados | 1 |\n| Verdicts \`match\` | 1 |\n| Verdicts \`mismatch\` | 0 |\n| Verdicts \`undocumented\` | 0 |\n\n## MOB-BASE-001\n| OBS-001 | x | \`match\` | — |`;
    const errors = [];
    validateReconciliationSummary({ content, observedBaselineIds: ['MOB-BASE-001'], errors });
    assert.deepEqual(errors, []);

    validateReconciliationSummary({ content: `${content}\n## MOB-BASE-007\n`, observedBaselineIds: ['MOB-BASE-001'], errors });
    assert.ok(errors.some(error => error.includes('não atual')));
});
