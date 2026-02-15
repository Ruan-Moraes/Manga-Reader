import { simulateDelay } from '@shared/service/mockApi';
import { mockGroups, membersPool, groupNameById } from '@mock/data/groups';

import { type GroupStatus, type Group } from '../type/group.types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getGroups = async (): Promise<Group[]> => {
    await simulateDelay();
    return mockGroups;
};

export const getGroupById = async (
    groupId: string,
): Promise<Group | undefined> => {
    await simulateDelay();
    return mockGroups.find(g => g.id === groupId);
};

export const getGroupsByTitleId = async (
    titleId: string,
): Promise<Group[]> => {
    await simulateDelay();
    return mockGroups.filter(g => g.translatedTitleIds.includes(titleId));
};

export const getMemberById = async (memberId: string) => {
    await simulateDelay();

    const member = membersPool.find(m => m.id === memberId);
    if (!member) return null;

    return {
        ...member,
        groups: member.groups.filter(g => groupNameById.has(g.id)),
    };
};

export const getAllGenres = (): string[] =>
    Array.from(new Set(mockGroups.flatMap(g => g.genres))).sort();

export const getGroupStatusLabel = (status: GroupStatus): string => {
    if (status === 'active') return 'Ativo';
    if (status === 'inactive') return 'Inativo';
    return 'Hiato';
};
