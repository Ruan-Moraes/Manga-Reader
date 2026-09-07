import type { Group } from './group.types';

/**
 * Total de "seguidores" de um grupo. Membro (equipe de tradução) e apoiador
 * (SUPPORTER) são vínculos mutuamente exclusivos por usuário no backend — um
 * membro já é considerado seguidor automaticamente, então o total soma os dois.
 */
export const getGroupFollowersCount = (group: Pick<Group, 'members' | 'supporters'>): number =>
    (group.members?.length ?? 0) + (group.supporters?.length ?? 0);
