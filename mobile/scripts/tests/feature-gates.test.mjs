import assert from 'node:assert/strict';
import test from 'node:test';

import { validateFeatureGates } from '../lib/feature-gates.mjs';

const feature = (id, { gate = 'open', blockedBy = [], status = 'draft', tasks = false } = {}) => ({
    metadata: { id, type: 'feature', status, implementation_gate: gate, blocked_by: blockedBy },
    tasks,
});

function validate(artifacts) {
    const errors = [];

    validateFeatureGates({ artifacts, errors, tasksExist: artifact => artifact.tasks });

    return errors;
}

test('aceita feature aberta sem dependências', () => {
    assert.deepEqual(validate([feature('MOB-FEAT-001')]), []);
});

test('rejeita feature bloqueada sem blocked_by', () => {
    assert.ok(validate([feature('MOB-FEAT-001', { gate: 'blocked' })]).some(error => error.includes('feature bloqueada exige blocked_by')));
});

test('rejeita dependência inexistente e autorreferência', () => {
    const errors = validate([
        feature('MOB-FEAT-001', { gate: 'blocked', blockedBy: ['MOB-FEAT-999'] }),
        feature('MOB-FEAT-002', { gate: 'blocked', blockedBy: ['MOB-FEAT-002'] }),
    ]);

    assert.ok(errors.some(error => error.includes("feature inexistente 'MOB-FEAT-999'")));
    assert.ok(errors.some(error => error.includes('não pode depender de si mesma')));
});

test('rejeita ciclo de dependências', () => {
    const errors = validate([
        feature('MOB-FEAT-001', { gate: 'blocked', blockedBy: ['MOB-FEAT-002'] }),
        feature('MOB-FEAT-002', { gate: 'blocked', blockedBy: ['MOB-FEAT-001'] }),
    ]);

    assert.ok(errors.some(error => error.includes('ciclo em blocked_by')));
});

test('rejeita tasks e execução enquanto bloqueada', () => {
    const dependency = feature('MOB-FEAT-001');

    const tasksErrors = validate([dependency, feature('MOB-FEAT-002', { gate: 'blocked', blockedBy: ['MOB-FEAT-001'], tasks: true })]);
    const statusErrors = validate([dependency, feature('MOB-FEAT-002', { gate: 'blocked', blockedBy: ['MOB-FEAT-001'], status: 'in-progress' })]);

    assert.ok(tasksErrors.some(error => error.includes('não pode possuir tasks.md')));
    assert.ok(statusErrors.some(error => error.includes("não pode ter status 'in-progress'")));
});

test('aceita aprovação humana sem tasks enquanto bloqueada', () => {
    assert.deepEqual(validate([feature('MOB-FEAT-001'), feature('MOB-FEAT-002', { gate: 'blocked', blockedBy: ['MOB-FEAT-001'], status: 'approved' })]), []);
});

test('rejeita desbloqueio antes das dependências implementadas', () => {
    const errors = validate([feature('MOB-FEAT-001', { status: 'approved' }), feature('MOB-FEAT-002', { gate: 'open', blockedBy: ['MOB-FEAT-001'] })]);

    assert.ok(errors.some(error => error.includes("dependência implementada ou em verificação 'MOB-FEAT-001'")));
});

test('aceita cadeia desbloqueada com dependências implementadas', () => {
    assert.deepEqual(
        validate([
            feature('MOB-FEAT-001', { status: 'implemented' }),
            feature('MOB-FEAT-002', { gate: 'open', blockedBy: ['MOB-FEAT-001'], status: 'approved' }),
        ]),
        [],
    );
});

test('aceita verification-pending como dependência executada', () => {
    assert.deepEqual(
        validate([
            feature('MOB-FEAT-001', { status: 'verification-pending' }),
            feature('MOB-FEAT-002', { gate: 'open', blockedBy: ['MOB-FEAT-001'], status: 'implemented' }),
        ]),
        [],
    );
});
