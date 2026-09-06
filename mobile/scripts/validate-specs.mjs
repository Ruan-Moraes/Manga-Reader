import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

import { validateCoverage } from './spec-coverage.mjs';
import { validateFeatureGates } from './feature-gates.mjs';
import { implementationChecksum, validateFeatureIntegrity, validateReconciliationSummary } from './sdd-integrity.mjs';

const log = (...messages) => process.stdout.write(`${messages.join(' ')}\n`);
const logError = (...messages) => process.stderr.write(`${messages.join(' ')}\n`);

const mobileRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const docsRoot = resolve(mobileRoot, 'docs');
const specsRoot = resolve(docsRoot, 'specs');
const decisionsRoot = resolve(docsRoot, 'decisions');
const registryPath = resolve(specsRoot, 'registry.md');
const coveragePath = resolve(specsRoot, 'coverage.json');
const reconciliationPath = resolve(docsRoot, 'active', 'sdd-baseline-reconciliation.md');
const commitExists = sha => {
    try {
        execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], { cwd: resolve(mobileRoot, '..'), stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
};

const allowedStatuses = {
    baseline: new Set(['observed', 'superseded']),
    feature: new Set(['draft', 'approved', 'in-progress', 'verification-pending', 'implemented', 'superseded']),
    decision: new Set(['proposed', 'accepted', 'superseded']),
};

const requiredHeadings = {
    baseline: ['## Contexto', '## Comportamento observado', '## Evidências', '## Desconhecidos', '## Conflitos com intenção futura', '## Não garantias'],
    feature: [
        '## Objetivo',
        '## Contexto e contratos relacionados',
        '## Requisitos e regras',
        '## Casos de erro',
        '## Critérios de aceite',
        '## Estratégia de evidência',
        '## Gate de implementação',
        '## Fora de escopo',
        '## Aprovação humana',
    ],
    decision: ['## Contexto', '## Decisão', '## Alternativas consideradas', '## Consequências', '## Relações'],
};

const errors = [];

function listFiles(directory, predicate) {
    if (!existsSync(directory)) return [];

    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = resolve(directory, entry.name);

        if (entry.isDirectory()) return listFiles(path, predicate);

        return predicate(path) ? [path] : [];
    });
}

function parseScalar(value) {
    const trimmed = value.trim();

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const body = trimmed.slice(1, -1).trim();

        return body ? body.split(',').map(item => item.trim().replace(/^['"]|['"]$/g, '')) : [];
    }

    return trimmed.replace(/^['"]|['"]$/g, '');
}

function parseRegistryRelations(value) {
    if (!value || value === '—') return [];

    return value
        .split(',')
        .map(item => item.trim().replaceAll('`', ''))
        .filter(Boolean);
}

function parseArtifact(path) {
    const content = readFileSync(path, 'utf8');
    const match = content.match(/^---\n([\s\S]*?)\n---\n/);
    const displayPath = relative(mobileRoot, path);

    if (!match) {
        errors.push(`${displayPath}: frontmatter YAML ausente`);

        return null;
    }

    const metadata = {};

    const frontmatterLines = match[1].split('\n');

    for (let index = 0; index < frontmatterLines.length; index += 1) {
        const line = frontmatterLines[index];
        const separator = line.indexOf(':');

        if (separator < 1) continue;

        const key = line.slice(0, separator).trim();
        const rawValue = line.slice(separator + 1);

        if (rawValue.trim() === '') {
            const items = [];

            while (frontmatterLines[index + 1]?.match(/^\s+-\s+(.+)$/)) {
                index += 1;
                items.push(
                    frontmatterLines[index]
                        .replace(/^\s+-\s+/, '')
                        .trim()
                        .replace(/^['"]|['"]$/g, ''),
                );
            }

            metadata[key] = items;
        } else {
            metadata[key] = parseScalar(rawValue);
        }
    }

    for (const field of ['id', 'type', 'title', 'status', 'created', 'updated', 'supersedes', 'superseded_by']) {
        if (!(field in metadata)) errors.push(`${displayPath}: campo '${field}' ausente`);
    }

    if (metadata.type === 'feature') {
        for (const field of ['implementation_gate', 'blocked_by']) {
            if (!(field in metadata)) errors.push(`${displayPath}: campo '${field}' ausente`);
        }
    }

    if (!allowedStatuses[metadata.type]?.has(metadata.status)) {
        errors.push(`${displayPath}: status '${metadata.status}' inválido para tipo '${metadata.type}'`);
    }

    const prefixes = { baseline: 'MOB-BASE-', feature: 'MOB-FEAT-', decision: 'MOB-DEC-' };

    if (prefixes[metadata.type] && !String(metadata.id).startsWith(prefixes[metadata.type])) {
        errors.push(`${displayPath}: ID '${metadata.id}' não corresponde ao tipo '${metadata.type}'`);
    }

    for (const heading of requiredHeadings[metadata.type] ?? []) {
        if (!content.includes(heading)) errors.push(`${displayPath}: seção obrigatória '${heading}' ausente`);
    }

    return { content, metadata, path, specPath: relative(specsRoot, path).replaceAll('\\', '/') };
}

const artifactPaths = [
    ...listFiles(resolve(specsRoot, 'baseline'), path => /MOB-BASE-\d+.*\.md$/.test(path)),
    ...listFiles(decisionsRoot, path => /MOB-DEC-\d+.*\.md$/.test(path)),
    ...listFiles(resolve(specsRoot, 'features'), path => path.endsWith('/spec.md')),
];

const artifacts = artifactPaths.map(parseArtifact).filter(Boolean);

const byId = new Map();

for (const artifact of artifacts) {
    const id = artifact.metadata.id;

    if (byId.has(id)) errors.push(`ID duplicado: ${id}`);

    byId.set(id, artifact);
}

validateFeatureGates({
    artifacts,
    errors,
    tasksExist: artifact => existsSync(resolve(artifact.path, '..', 'tasks.md')),
});

if (!existsSync(reconciliationPath)) {
    errors.push('docs/active/sdd-baseline-reconciliation.md: relatório ausente');
} else {
    const reconciliation = readFileSync(reconciliationPath, 'utf8');
    const observedBaselines = artifacts.filter(item => item.metadata.type === 'baseline' && item.metadata.status === 'observed');

    validateReconciliationSummary({
        content: reconciliation,
        observedBaselineIds: observedBaselines.map(artifact => artifact.metadata.id),
        errors,
    });

    for (const artifact of observedBaselines) {
        const section = reconciliation.match(new RegExp(`^## ${artifact.metadata.id}\\b([\\s\\S]*?)(?=^## |\\Z)`, 'm'))?.[1] ?? '';
        const observations = [...artifact.content.matchAll(/^### (OBS-\d{3})\b/gm)].map(match => match[1]);

        if (!section) {
            errors.push(`${artifact.metadata.id}: seção ausente no relatório de reconciliação`);
            continue;
        }

        for (const observation of observations) {
            const rows = section.split('\n').filter(line => new RegExp(`^\\|\\s*${observation}\\s*\\|`).test(line));
            if (rows.length !== 1) {
                errors.push(`${artifact.metadata.id}/${observation}: relatório exige exatamente uma linha de reconciliação`);
            } else if (!rows[0].includes('| `match` |')) {
                errors.push(`${artifact.metadata.id}/${observation}: verdict de reconciliação não é match`);
            }
        }
    }
}

let coverageSummary = { classified: 0, behavior: 0, evidence: 0 };
let coverageManifest = { entries: [], patterns: [] };

try {
    coverageManifest = JSON.parse(readFileSync(coveragePath, 'utf8'));
    coverageSummary = validateCoverage({ mobileRoot, coverage: coverageManifest, artifactsById: byId, errors });
} catch (error) {
    errors.push(`docs/specs/coverage.json: não foi possível ler o manifesto (${error.message})`);
}

const registry = readFileSync(registryPath, 'utf8');

const registryRows = new Map();

for (const line of registry.split('\n')) {
    const cells = line
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim());

    if (!cells[0]?.startsWith('MOB-')) continue;
    if (registryRows.has(cells[0])) errors.push(`${cells[0]}: linha duplicada no registry`);

    registryRows.set(cells[0], {
        type: cells[1],
        status: cells[3],
        gate: cells[4],
        blockedBy: parseRegistryRelations(cells[5]),
        path: cells[6],
        supersedes: parseRegistryRelations(cells[8]),
        supersededBy: parseRegistryRelations(cells[9]),
    });
}

for (const artifact of artifacts) {
    const { id, type, status } = artifact.metadata;

    const row = registryRows.get(id);

    if (!row) {
        errors.push(`${id}: ausente do registry`);

        continue;
    }

    if (row.type !== type) errors.push(`${id}: tipo no registry '${row.type}' diverge de '${type}'`);

    if (row.status !== status) errors.push(`${id}: status no registry '${row.status}' diverge de '${status}'`);

    if (type === 'feature' && row.gate !== artifact.metadata.implementation_gate) {
        errors.push(`${id}: gate no registry '${row.gate}' diverge de '${artifact.metadata.implementation_gate}'`);
    }

    if (type === 'feature' && JSON.stringify(row.blockedBy) !== JSON.stringify(artifact.metadata.blocked_by)) {
        errors.push(`${id}: blocked_by no registry diverge do frontmatter`);
    }

    if (row.path !== artifact.specPath) errors.push(`${id}: caminho no registry '${row.path}' diverge de '${artifact.specPath}'`);

    if (JSON.stringify(row.supersedes) !== JSON.stringify(artifact.metadata.supersedes)) {
        errors.push(`${id}: supersedes no registry diverge do frontmatter`);
    }

    if (JSON.stringify(row.supersededBy) !== JSON.stringify(artifact.metadata.superseded_by)) {
        errors.push(`${id}: superseded by no registry diverge do frontmatter`);
    }
}

for (const [id, row] of registryRows) {
    if (!byId.has(id)) errors.push(`${id}: registry aponta para artefato inexistente '${row.path}'`);
}

for (const artifact of artifacts) {
    for (const relation of ['supersedes', 'superseded_by']) {
        for (const relatedId of artifact.metadata[relation] ?? []) {
            const related = byId.get(relatedId);

            if (!related) {
                errors.push(`${artifact.metadata.id}: relação '${relation}' aponta para ID inexistente '${relatedId}'`);

                continue;
            }

            const inverse = relation === 'supersedes' ? 'superseded_by' : 'supersedes';

            if (!(related.metadata[inverse] ?? []).includes(artifact.metadata.id)) {
                errors.push(`${artifact.metadata.id}: relação '${relation}' com '${relatedId}' não é recíproca`);
            }
        }
    }

    if (artifact.metadata.type !== 'feature') continue;

    const acceptanceIds = [...artifact.content.matchAll(/^### (AC-\d{3})\b/gm)].map(match => match[1]);

    if (new Set(acceptanceIds).size !== acceptanceIds.length) errors.push(`${artifact.metadata.id}: critérios AC duplicados`);
    if (acceptanceIds.length === 0) errors.push(`${artifact.metadata.id}: nenhum critério AC-* encontrado`);

    const featureDirectory = resolve(artifact.path, '..');
    const tasksPath = resolve(featureDirectory, 'tasks.md');
    const reviewPath = resolve(featureDirectory, 'review.md');

    const requiresApproval = ['approved', 'in-progress', 'verification-pending', 'implemented'].includes(artifact.metadata.status);
    const requiresTasks = artifact.metadata.implementation_gate === 'open' && requiresApproval;

    if (artifact.metadata.status === 'draft' && existsSync(tasksPath)) {
        errors.push(`${artifact.metadata.id}: spec draft não pode possuir tasks.md`);
    }

    if (requiresApproval && (/Aprovador:\s*pendente/i.test(artifact.content) || /Data:\s*pendente/i.test(artifact.content))) {
        errors.push(`${artifact.metadata.id}: status '${artifact.metadata.status}' exige aprovação humana preenchida`);
    }

    if (requiresTasks && !existsSync(tasksPath)) {
        errors.push(`${artifact.metadata.id}: status '${artifact.metadata.status}' exige tasks.md`);
    }

    if (existsSync(tasksPath)) {
        const tasks = readFileSync(tasksPath, 'utf8');

        for (const id of acceptanceIds) if (!tasks.includes(id)) errors.push(`${artifact.metadata.id}: ${id} não aparece em tasks.md`);
    }

    if (['implemented', 'verification-pending'].includes(artifact.metadata.status) && !existsSync(reviewPath)) {
        errors.push(`${artifact.metadata.id}: status ${artifact.metadata.status} exige review.md`);
    }

    if (existsSync(reviewPath)) {
        const review = readFileSync(reviewPath, 'utf8');

        for (const id of acceptanceIds) if (!review.includes(id)) errors.push(`${artifact.metadata.id}: ${id} não aparece em review.md`);

        if (artifact.metadata.status === 'implemented' && !/Verdict:\s*`approved`/i.test(review)) {
            errors.push(`${artifact.metadata.id}: status implemented exige verdict approved`);
        }
    }

    const evidenceReferences = new Set(
        [...(coverageManifest.entries ?? []), ...(coverageManifest.patterns ?? [])]
            .filter(mapping => mapping.category === 'evidence')
            .flatMap(mapping => mapping.observations ?? []),
    );
    const driftPath = resolve(featureDirectory, 'drift-audit.md');
    validateFeatureIntegrity({
        artifact,
        tasksContent: existsSync(tasksPath) ? readFileSync(tasksPath, 'utf8') : null,
        reviewContent: existsSync(reviewPath) ? readFileSync(reviewPath, 'utf8') : null,
        driftContent: existsSync(driftPath) ? readFileSync(driftPath, 'utf8') : null,
        evidenceReferences,
        expectedChecksum: implementationChecksum(mobileRoot),
        commitExists,
        errors,
    });
}

if (errors.length > 0) {
    logError('Spec validation failed:\n');

    for (const error of errors) logError(`- ${error}`);

    process.exitCode = 1;
} else {
    log(
        `Spec validation passed: ${artifacts.length} normative artifacts registered; ${coverageSummary.classified} files classified; ${coverageSummary.behavior} behavior files and ${coverageSummary.evidence} evidence files mapped.`,
    );
}
