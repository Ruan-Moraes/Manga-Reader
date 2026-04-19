import type {
    AdminGroup,
    GroupMember as AdminGroupMember,
} from '@feature/admin/type/admin.types';
import type { PageResponse } from '@shared/service/http';

import { buildPage } from '../pageFactory';

let adminGroupCounter = 0;
let adminGroupMemberCounter = 0;

export const buildAdminGroupMember = (
    overrides: Partial<AdminGroupMember> = {},
): AdminGroupMember => {
    adminGroupMemberCounter += 1;

    return {
        userId: `admin-group-member-${adminGroupMemberCounter}`,
        userName: `Membro Admin ${adminGroupMemberCounter}`,
        userEmail: `membro${adminGroupMemberCounter}@grupo.com`,
        type: 'staff',
        role: 'Tradutor(a)',
        joinedAt: '2025-09-01T10:00:00Z',
        ...overrides,
    };
};

export const adminGroupMemberPresets = {
    leader: () => buildAdminGroupMember({ role: 'Líder' }),
    translator: () => buildAdminGroupMember({ role: 'Tradutor(a)' }),
    reviewer: () => buildAdminGroupMember({ role: 'Revisor(a)' }),
    qc: () => buildAdminGroupMember({ role: 'QC' }),
    cleaner: () => buildAdminGroupMember({ role: 'Cleaner' }),
    typesetter: () => buildAdminGroupMember({ role: 'Typesetter' }),
    incomplete: () =>
        buildAdminGroupMember({ type: null, role: null, joinedAt: null }),
};

export const buildAdminGroup = (
    overrides: Partial<AdminGroup> = {},
): AdminGroup => {
    adminGroupCounter += 1;

    return {
        id: `admin-group-${adminGroupCounter}`,
        name: `Grupo Admin ${adminGroupCounter}`,
        username: `grupo-admin-${adminGroupCounter}`,
        logo: `/logos/admin-group-${adminGroupCounter}.png`,
        description: 'Grupo administrado de scanlation.',
        status: 'active',
        totalTitles: 25,
        membersCount: 6,
        rating: 4.5,
        popularity: 80,
        platformJoinedAt: '2024-01-15T00:00:00Z',
        members: [],
        ...overrides,
    };
};

export const adminGroupPresets = {
    active: () => buildAdminGroup({ status: 'active' }),
    inactive: () => buildAdminGroup({ status: 'inactive' }),
    hiatus: () => buildAdminGroup({ status: 'hiatus' }),

    empty: () => buildAdminGroup({ members: [], membersCount: 0 }),
    full: () =>
        buildAdminGroup({
            members: [
                adminGroupMemberPresets.leader(),
                adminGroupMemberPresets.translator(),
                adminGroupMemberPresets.reviewer(),
                adminGroupMemberPresets.qc(),
                adminGroupMemberPresets.cleaner(),
                adminGroupMemberPresets.typesetter(),
            ],
            membersCount: 6,
        }),

    minimal: () =>
        buildAdminGroup({
            logo: null,
            description: null,
            platformJoinedAt: null,
        }),

    massive: () =>
        buildAdminGroup({
            totalTitles: 500,
            membersCount: 50,
            rating: 5,
            popularity: 100,
        }),

    rookie: () =>
        buildAdminGroup({
            totalTitles: 0,
            membersCount: 1,
            rating: 0,
            popularity: 0,
        }),
};

export const buildAdminGroupList = (count = 10): AdminGroup[] =>
    Array.from({ length: count }, () => buildAdminGroup());

export const buildAdminGroupPage = (
    items: AdminGroup[] = buildAdminGroupList(),
    page = 0,
    size = 20,
): PageResponse<AdminGroup> => buildPage(items, page, size);
