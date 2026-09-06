import { existsSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const allowedCategories = new Set(['behavior', 'evidence', 'infrastructure', 'resource', 'governance']);

function normalize(path) {
    return path.replaceAll('\\', '/').replace(/^\.\//, '');
}

function globRegex(pattern) {
    let source = '';

    for (let index = 0; index < pattern.length; index++) {
        const character = pattern[index];

        if (character === '*' && pattern[index + 1] === '*') {
            if (pattern[index + 2] === '/') {
                source += '(?:.*/)?';
                index += 2;
            } else {
                source += '.*';
                index += 1;
            }
        } else if (character === '*') {
            source += '[^/]*';
        } else if (character === '?') {
            source += '[^/]';
        } else {
            source += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
        }
    }

    return new RegExp(`^${source}$`);
}

const alwaysSkippedDirectories = new Set(['node_modules', '.expo', 'coverage', '.git']);

function listFiles(root, baseRoot = root) {
    if (!existsSync(root)) return [];

    return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
        const path = resolve(root, entry.name);

        if (entry.isDirectory()) {
            if (alwaysSkippedDirectories.has(entry.name)) return [];

            return listFiles(path, baseRoot);
        }

        return [normalize(relative(baseRoot, path))];
    });
}

function validateReference(reference, entry, artifactsById, errors) {
    const match = reference.match(/^(MOB-(?:BASE|FEAT)-\d+)\/(OBS|AC)-\d{3}$/);

    if (!match) {
        errors.push(`${entry.path}: referência comportamental inválida '${reference}'`);

        return;
    }

    const [, artifactId, markerType] = match;
    const artifact = artifactsById.get(artifactId);

    if (!artifact) {
        errors.push(`${entry.path}: referência aponta para artefato inexistente '${artifactId}'`);

        return;
    }

    if (!(entry.specs ?? []).includes(artifactId)) {
        errors.push(`${entry.path}: referência '${reference}' não aparece em specs`);
    }

    if (artifact.metadata.type === 'baseline' && markerType !== 'OBS') {
        errors.push(`${entry.path}: baseline '${artifactId}' exige referência OBS-*`);
    }

    if (artifact.metadata.type === 'feature' && markerType !== 'AC') {
        errors.push(`${entry.path}: feature '${artifactId}' exige referência AC-*`);
    }

    const marker = reference.slice(reference.indexOf('/') + 1);

    if (!new RegExp(`^### ${marker}\\b`, 'm').test(artifact.content)) {
        errors.push(`${entry.path}: '${reference}' não existe no artefato`);
    }
}

function validateMapping(mapping, artifactsById, errors) {
    if (!allowedCategories.has(mapping.category)) {
        errors.push(`${mapping.path ?? mapping.pattern}: categoria '${mapping.category}' inválida`);
    }

    if (!Array.isArray(mapping.specs) || mapping.specs.length === 0) {
        errors.push(`${mapping.path ?? mapping.pattern}: ao menos um ID relacionado é obrigatório`);
    }

    for (const specId of mapping.specs ?? []) {
        if (!artifactsById.has(specId)) errors.push(`${mapping.path ?? mapping.pattern}: ID relacionado inexistente '${specId}'`);
    }

    if (mapping.category === 'behavior' || mapping.category === 'evidence') {
        if (!Array.isArray(mapping.observations) || mapping.observations.length === 0) {
            errors.push(`${mapping.path}: categoria '${mapping.category}' exige observations`);
        }

        for (const reference of mapping.observations ?? []) validateReference(reference, mapping, artifactsById, errors);
    } else {
        if (!mapping.rationale?.trim()) errors.push(`${mapping.path ?? mapping.pattern}: categoria '${mapping.category}' exige rationale`);

        for (const reference of mapping.observations ?? []) validateReference(reference, mapping, artifactsById, errors);
    }
}

export function validateCoverage({ mobileRoot, coverage, artifactsById, errors }) {
    if (coverage.version !== 1) errors.push(`docs/specs/coverage.json: versão '${coverage.version}' não suportada`);

    const files = listFiles(mobileRoot);

    const ignored = (coverage.ignored ?? []).map(pattern => ({ pattern, regex: globRegex(normalize(pattern)) }));

    const managedFiles = files.filter(path => !ignored.some(item => item.regex.test(path)));

    const entries = coverage.entries ?? [];

    const patterns = (coverage.patterns ?? []).map(mapping => ({ ...mapping, regex: globRegex(normalize(mapping.pattern)) }));

    const exact = new Map();
    const referencedBehavior = new Set();

    for (const entry of entries) {
        entry.path = normalize(entry.path);

        if (exact.has(entry.path)) errors.push(`${entry.path}: mapeamento exato duplicado`);

        exact.set(entry.path, entry);

        validateMapping(entry, artifactsById, errors);

        for (const reference of entry.observations ?? []) referencedBehavior.add(reference);

        if (!files.includes(entry.path)) errors.push(`${entry.path}: caminho mapeado inexistente`);
    }

    for (const pattern of patterns) {
        pattern.pattern = normalize(pattern.pattern);

        if (pattern.pattern.startsWith('src/')) {
            errors.push(`${pattern.pattern}: padrões amplos são proibidos para código runtime`);
        }

        validateMapping(pattern, artifactsById, errors);

        if (!managedFiles.some(path => pattern.regex.test(path))) {
            errors.push(`${pattern.pattern}: padrão não corresponde a nenhum arquivo`);
        }
    }

    for (const path of managedFiles) {
        const exactMatch = exact.get(path);
        const matches = exactMatch ? [exactMatch] : patterns.filter(pattern => pattern.regex.test(path));

        if (matches.length === 0) {
            errors.push(`${path}: arquivo sem classificação no coverage.json`);
            continue;
        }

        if (matches.length > 1) errors.push(`${path}: arquivo possui múltiplas classificações`);

        if (path.startsWith('src/') && !exact.has(path)) {
            errors.push(`${path}: código de src exige mapeamento individual`);
        }
    }

    for (const [artifactId, artifact] of artifactsById) {
        if (artifact.metadata.type !== 'baseline' || artifact.metadata.status === 'superseded') continue;

        const observationIds = [...artifact.content.matchAll(/^### (OBS-\d{3})\b/gm)].map(match => match[1]);

        for (const observationId of observationIds) {
            const reference = `${artifactId}/${observationId}`;

            if (!referencedBehavior.has(reference)) errors.push(`${reference}: observação sem arquivo relacionado no coverage.json`);
        }
    }

    return {
        classified: managedFiles.length,
        behavior: entries.filter(entry => entry.category === 'behavior').length,
        evidence: entries.filter(entry => entry.category === 'evidence').length,
    };
}
