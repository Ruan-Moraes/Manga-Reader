import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

function listFiles(root) {
    if (!existsSync(root)) return [];

    return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
        const path = resolve(root, entry.name);

        return entry.isDirectory()
            ? listFiles(path)
            : [path];
    });
}

export function implementationChecksum(mobileRoot) {
    const files = [resolve(mobileRoot, 'assets'), resolve(mobileRoot, 'docs'), resolve(mobileRoot, 'scripts'), resolve(mobileRoot, 'src')]
        .flatMap(listFiles)
        .filter(path => !path.endsWith('/review.md') && !path.endsWith('/drift-audit.md'))
        .concat(
            ['app.json', 'babel.config.js', 'eslint.config.mjs', 'jest.config.js', 'package.json', 'tsconfig.json']
                .map(path => resolve(mobileRoot, path))
                .filter(existsSync),
        )
        .sort();

    const hash = createHash('sha256');

    for (const path of files) {
        hash.update(relative(mobileRoot, path).replaceAll('\\', '/'));
        hash.update('\0');
        hash.update(readFileSync(path));
        hash.update('\0');
    }

    return hash.digest('hex');
}

function traceabilityRows(content, acceptanceId) {
    return content
        .split('\n')
        .filter(line => line.startsWith('|'))
        .filter(line => line.split('|')[1]?.trim() === acceptanceId);
}

export function validateFeatureIntegrity({
    artifact,
    tasksContent,
    reviewContent,
    driftContent,
    evidenceReferences,
    expectedChecksum,
    commitExists = () => true,
    errors,
}) {
    const id = artifact.metadata.id;

    const status = artifact.metadata.status;

    const acceptanceIds = [...artifact.content.matchAll(/^### (AC-\d{3})\b/gm)].map(match => match[1]);

    const requiresExecutionEvidence = ['implemented', 'verification-pending'].includes(status);

    for (const acceptanceId of acceptanceIds) {
        if (tasksContent !== null && traceabilityRows(tasksContent, acceptanceId).length !== 1) {
            errors.push(`${id}/${acceptanceId}: tasks.md exige exatamente uma linha de rastreabilidade`);
        }

        if (reviewContent !== null && traceabilityRows(reviewContent, acceptanceId).length !== 1) {
            errors.push(`${id}/${acceptanceId}: review.md exige exatamente uma linha de resultado`);
        }

        if (requiresExecutionEvidence && !evidenceReferences.has(`${id}/${acceptanceId}`)) {
            errors.push(`${id}/${acceptanceId}: critério sem evidência classificada no coverage.json`);
        }
    }

    const hasOpenTask = tasksContent !== null && /^- \[ \] TASK-\d+/m.test(tasksContent);

    if (status === 'implemented' && hasOpenTask) errors.push(`${id}: status implemented não permite task aberta`);
    if (status === 'verification-pending' && !hasOpenTask) errors.push(`${id}: verification-pending exige ao menos uma task aberta`);

    if (['implemented', 'verification-pending'].includes(status) && driftContent === null) {
        errors.push(`${id}: status ${status} exige drift-audit.md persistido`);
    }

    if (reviewContent !== null && ['implemented', 'verification-pending'].includes(status)) {
        const expectedVerdict = status === 'implemented' ? 'approved' : 'verification-pending';

        if (!new RegExp(`Verdict:\\s*${'`'}${expectedVerdict}${'`'}`, 'i').test(reviewContent)) {
            errors.push(`${id}: status ${status} exige verdict ${expectedVerdict}`);
        }

        const reference = reviewContent.match(/^- Implementação\/revisão:\s*(.+)$/m)?.[1] ?? '';
        const commitSha = reference.match(/\bcommit\s+([0-9a-f]{40})\b/i)?.[1];

        const commitReference = Boolean(commitSha);

        const checksumReference = reference.match(/\bworking-tree\s+sha256:([0-9a-f]{64})\b/i);

        if (!commitReference && !checksumReference) {
            errors.push(`${id}: review exige commit imutável ou checksum sha256 da working tree`);
        } else if (checksumReference && expectedChecksum && checksumReference[1].toLowerCase() !== expectedChecksum) {
            errors.push(`${id}: checksum da review diverge da implementação atual`);
        } else if (commitSha && !commitExists(commitSha)) {
            errors.push(`${id}: commit da review não existe no repositório`);
        }
    }
}

export function validateReconciliationSummary({ content, observedBaselineIds, errors }) {
    const sections = [...content.matchAll(/^## (MOB-BASE-\d+)\b/gm)].map(match => match[1]);

    const unexpected = sections.filter(id => !observedBaselineIds.includes(id));

    for (const id of unexpected)
        errors.push(`${id}: baseline não atual aparece na reconciliação corrente`);

    for (const id of observedBaselineIds)
        if (!sections.includes(id))
            errors.push(`${id}: baseline atual ausente da reconciliação`);

    const verdicts = [...content.matchAll(/\|\s*`(match|mismatch|undocumented)`\s*\|/g)].map(match => match[1]);

    const derived = {
        'Baselines observados': observedBaselineIds.length,
        'Verdicts `match`': verdicts.filter(verdict => verdict === 'match').length,
        'Verdicts `mismatch`': verdicts.filter(verdict => verdict === 'mismatch').length,
        'Verdicts `undocumented`': verdicts.filter(verdict => verdict === 'undocumented').length,
    };

    for (const [label, expected] of Object.entries(derived)) {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const reported = Number(content.match(new RegExp(`^\\|\\s*${escaped}\\s*\\|\\s*(\\d+)\\s*\\|$`, 'm'))?.[1]);

        if (!Number.isFinite(reported) || reported !== expected) {
            errors.push(`reconciliação: contador '${label}' é ${reported || 0}, esperado ${expected}`);
        }
    }
}
