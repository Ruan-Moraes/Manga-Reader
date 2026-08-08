const ALLOWED_GATES = new Set(['open', 'blocked']);

export function validateFeatureGates({ artifacts, errors, tasksExist = () => false }) {
    const features = artifacts.filter(artifact => artifact.metadata.type === 'feature');

    const byId = new Map(features.map(feature => [feature.metadata.id, feature]));

    for (const feature of features) {
        const { id, implementation_gate: gate, blocked_by: blockedBy } = feature.metadata;

        if (!ALLOWED_GATES.has(gate)) {
            errors.push(`${id}: implementation_gate '${gate}' inválido`);

            continue;
        }

        if (!Array.isArray(blockedBy)) {
            errors.push(`${id}: blocked_by deve ser uma lista`);

            continue;
        }

        if (gate === 'blocked' && blockedBy.length === 0) errors.push(`${id}: feature bloqueada exige blocked_by`);

        for (const dependencyId of blockedBy) {
            if (dependencyId === id) {
                errors.push(`${id}: feature não pode depender de si mesma`);

                continue;
            }
            if (!byId.has(dependencyId)) errors.push(`${id}: blocked_by aponta para feature inexistente '${dependencyId}'`);
        }

        if (gate === 'open') {
            for (const dependencyId of blockedBy) {
                const dependency = byId.get(dependencyId);

                if (dependency && dependency.metadata.status !== 'implemented') {
                    errors.push(`${id}: gate aberto exige dependência implemented '${dependencyId}'`);
                }
            }
        }

        if (gate === 'blocked' && ['in-progress', 'implemented'].includes(feature.metadata.status)) {
            errors.push(`${id}: feature bloqueada não pode ter status '${feature.metadata.status}'`);
        }

        if (gate === 'blocked' && tasksExist(feature)) errors.push(`${id}: feature bloqueada não pode possuir tasks.md`);
    }

    const visiting = new Set();
    const visited = new Set();

    function visit(id, trail) {
        if (visiting.has(id)) {
            const cycleStart = trail.indexOf(id);

            errors.push(`ciclo em blocked_by: ${[...trail.slice(cycleStart), id].join(' -> ')}`);

            return;
        }

        if (visited.has(id)) return;

        visiting.add(id);

        const feature = byId.get(id);

        for (const dependencyId of feature?.metadata.blocked_by ?? []) {
            if (byId.has(dependencyId)) visit(dependencyId, [...trail, id]);
        }

        visiting.delete(id);
        visited.add(id);
    }

    for (const id of byId.keys()) visit(id, []);
}
