import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const LAYERS = ['shared', 'entities', 'features', 'widgets', 'pages', 'application', 'app'];
const CANONICAL_SLICED_LAYERS = new Set(['entities', 'features', 'widgets', 'pages']);

function listRuntimeFiles(root) {
    if (!existsSync(root)) return [];
    return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
        const path = resolve(root, entry.name);
        if (entry.isDirectory()) return listRuntimeFiles(path);
        return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
    });
}

function parseLayerAndSlice(path) {
    const match = path.match(/^(?:src\/(shared|entities|features|widgets|pages|application)|(?:(app)))(?:\/([^/]+))?/);
    if (!match) return null;
    const layer = match[1] ?? match[2];
    const segment = match[3];
    return { layer, slice: ['application', 'shared', 'app'].includes(layer) ? layer : (segment ?? layer) };
}

function resolveImportPath(mobileRoot, sourcePath, importPath) {
    if (importPath.startsWith('@/src/')) return importPath.replace('@/', '');
    if (!importPath.startsWith('.')) return null;
    return relative(mobileRoot, resolve(dirname(resolve(mobileRoot, sourcePath)), importPath)).replaceAll('\\', '/');
}

export function validateFsdBoundaries({ mobileRoot, files = [resolve(mobileRoot, 'src'), resolve(mobileRoot, 'app')].flatMap(listRuntimeFiles) }) {
    const errors = [];

    for (const absolutePath of files) {
        const sourcePath = relative(mobileRoot, absolutePath).replaceAll('\\', '/');
        const source = sourcePath.includes('.integration.test.') ? { layer: 'app', slice: 'app' } : parseLayerAndSlice(sourcePath);
        if (!source) continue;
        const content = readFileSync(absolutePath, 'utf8');
        const imports = [...content.matchAll(/(?:from\s+|import\s*\()(['"])([^'"]+)\1/g)].map(match => match[2]);

        for (const importPath of imports) {
            const targetPath = resolveImportPath(mobileRoot, sourcePath, importPath);
            if (!targetPath) continue;
            const target = parseLayerAndSlice(targetPath);
            if (!target) continue;
            const sourceRank = LAYERS.indexOf(source.layer);
            const targetRank = LAYERS.indexOf(target.layer);

            if (targetRank > sourceRank) {
                errors.push(`${sourcePath}: import invertido '${importPath}'`);
                continue;
            }

            if (source.layer === target.layer && source.slice !== target.slice) {
                const entityCrossReference = source.layer === 'entities' && targetPath === `src/entities/${target.slice}/@x/${source.slice}`;
                if (!entityCrossReference) errors.push(`${sourcePath}: import horizontal '${importPath}'`);
            }

            if (CANONICAL_SLICED_LAYERS.has(target.layer) && (source.layer !== target.layer || source.slice !== target.slice)) {
                const publicPath = `@/src/${target.layer}/${target.slice}`;
                const normalizedPublicPath = publicPath.replace('@/', '');
                const entityCrossReference =
                    source.layer === 'entities' && target.layer === 'entities' && targetPath === `${normalizedPublicPath}/@x/${source.slice}`;
                const targetsPublicApi = targetPath === normalizedPublicPath || targetPath === `${normalizedPublicPath}/index`;
                if (!targetsPublicApi && !entityCrossReference) errors.push(`${sourcePath}: deep import '${importPath}'; use '${publicPath}'`);
            }
        }
    }

    return errors;
}
