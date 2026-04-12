import type { AdminUser } from '@feature/admin/type/admin.types';
import type { PageResponse } from '@shared/service/http';

import { buildPage } from '../pageFactory';

let adminUserCounter = 0;

export const buildAdminUser = (
    overrides: Partial<AdminUser> = {},
): AdminUser => {
    adminUserCounter += 1;

    return {
        id: `admin-user-${adminUserCounter}`,
        name: `Admin User ${adminUserCounter}`,
        email: `admin${adminUserCounter}@teste.com`,
        photoUrl: `/avatars/admin-${adminUserCounter}.png`,
        role: 'MEMBER',
        banned: false,
        bannedAt: null,
        bannedReason: null,
        bannedUntil: null,
        createdAt: '2025-06-01T10:00:00Z',
        updatedAt: '2025-06-01T10:00:00Z',
        ...overrides,
    };
};

export const adminUserPresets = {
    member: () => buildAdminUser({ role: 'MEMBER' }),
    moderator: () => buildAdminUser({ role: 'MODERATOR' }),
    admin: () => buildAdminUser({ role: 'ADMIN' }),

    notBanned: () =>
        buildAdminUser({
            banned: false,
            bannedAt: null,
            bannedReason: null,
            bannedUntil: null,
        }),
    bannedPermanent: () =>
        buildAdminUser({
            banned: true,
            bannedAt: '2026-03-01T10:00:00Z',
            bannedReason: 'Violacao grave dos termos.',
            bannedUntil: null,
        }),
    bannedTemporary: () =>
        buildAdminUser({
            banned: true,
            bannedAt: '2026-04-01T10:00:00Z',
            bannedReason: 'Spam repetido.',
            bannedUntil: '2026-05-01T10:00:00Z',
        }),

    withoutPhoto: () => buildAdminUser({ photoUrl: null }),
    neverUpdated: () => buildAdminUser({ updatedAt: null }),

    longName: () =>
        buildAdminUser({
            name: 'Nome muito longo de usuario para testar overflow no UI',
        }),
};

export const buildAdminUserList = (count = 10): AdminUser[] =>
    Array.from({ length: count }, () => buildAdminUser());

export const buildAdminUserPage = (
    users: AdminUser[] = buildAdminUserList(),
    page = 0,
    size = 20,
): PageResponse<AdminUser> => buildPage(users, page, size);
