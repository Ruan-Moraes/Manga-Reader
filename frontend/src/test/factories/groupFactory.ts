import type {
    Group,
    GroupMember,
    GroupRole,
    GroupStatus,
    GroupSummary,
    GroupSupporter,
    GroupWork,
    UserPost,
} from '@feature/group/type/group.types';

let groupCounter = 0;
let groupMemberCounter = 0;
let groupSupporterCounter = 0;
let groupWorkCounter = 0;
let userPostCounter = 0;

const ALL_GROUP_ROLES: GroupRole[] = [
    'Líder',
    'Tradutor(a)',
    'Revisor(a)',
    'QC',
    'Cleaner',
    'Typesetter',
];

export const buildUserPost = (overrides: Partial<UserPost> = {}): UserPost => {
    userPostCounter += 1;

    return {
        id: `post-${userPostCounter}`,
        summary: `Resumo do post ${userPostCounter}`,
        createdAt: '2026-03-20T10:00:00Z',
        titleName: `Titulo ${userPostCounter}`,
        link: `/posts/${userPostCounter}`,
        ...overrides,
    };
};

export const buildGroupMember = (
    overrides: Partial<GroupMember> = {},
): GroupMember => {
    groupMemberCounter += 1;

    return {
        id: `member-${groupMemberCounter}`,
        name: `Membro ${groupMemberCounter}`,
        avatar: `/avatars/member-${groupMemberCounter}.png`,
        bio: 'Bio do membro do grupo.',
        role: 'Tradutor(a)',
        joinedAt: '2025-08-10T10:00:00Z',
        groups: [{ id: 'group-1', name: 'Grupo Teste' }],
        recentPosts: [],
        ...overrides,
    };
};

export const groupMemberPresets = {
    leader: () => buildGroupMember({ role: 'Líder' }),
    translator: () => buildGroupMember({ role: 'Tradutor(a)' }),
    reviewer: () => buildGroupMember({ role: 'Revisor(a)' }),
    qc: () => buildGroupMember({ role: 'QC' }),
    cleaner: () => buildGroupMember({ role: 'Cleaner' }),
    typesetter: () => buildGroupMember({ role: 'Typesetter' }),

    withRecentPosts: () =>
        buildGroupMember({
            recentPosts: Array.from({ length: 3 }, () => buildUserPost()),
        }),
    withMultipleGroups: () =>
        buildGroupMember({
            groups: [
                { id: 'group-1', name: 'Grupo A' },
                { id: 'group-2', name: 'Grupo B' },
            ],
        }),
};

export const buildAllRoleMembers = (): GroupMember[] =>
    ALL_GROUP_ROLES.map(role => buildGroupMember({ role }));

export const buildGroupSupporter = (
    overrides: Partial<GroupSupporter> = {},
): GroupSupporter => {
    groupSupporterCounter += 1;

    return {
        id: `supporter-${groupSupporterCounter}`,
        name: `Apoiador ${groupSupporterCounter}`,
        avatar: `/avatars/supporter-${groupSupporterCounter}.png`,
        joinedAt: '2025-09-01T10:00:00Z',
        ...overrides,
    };
};

export const buildGroupWork = (
    overrides: Partial<GroupWork> = {},
): GroupWork => {
    groupWorkCounter += 1;

    return {
        id: `work-${groupWorkCounter}`,
        title: `Obra Traduzida ${groupWorkCounter}`,
        cover: `/covers/work-${groupWorkCounter}.jpg`,
        chapters: 25,
        status: 'ongoing',
        popularity: 80,
        updatedAt: '2026-03-25T10:00:00Z',
        genres: ['Action', 'Adventure'],
        ...overrides,
    };
};

export const groupWorkPresets = {
    ongoing: () => buildGroupWork({ status: 'ongoing' }),
    completed: () => buildGroupWork({ status: 'completed', chapters: 100 }),
    fresh: () => buildGroupWork({ chapters: 1, popularity: 5 }),
    blockbuster: () => buildGroupWork({ chapters: 500, popularity: 100 }),
};

export const buildGroup = (overrides: Partial<Group> = {}): Group => {
    groupCounter += 1;

    return {
        id: `group-${groupCounter}`,
        name: `Grupo Teste ${groupCounter}`,
        username: `grupo-teste-${groupCounter}`,
        logo: `/logos/group-${groupCounter}.png`,
        banner: `/banners/group-${groupCounter}.jpg`,
        description: 'Grupo de scanlation focado em manga seinen.',
        website: `https://grupo${groupCounter}.com`,
        totalTitles: 25,
        foundedYear: 2020,
        platformJoinedAt: '2024-01-15T00:00:00Z',
        status: 'active',
        members: [],
        supporters: [],
        genres: ['Action', 'Seinen'],
        focusTags: ['scanlation', 'manga'],
        rating: 4.5,
        popularity: 85,
        translatedWorks: [],
        translatedTitleIds: [],
        ...overrides,
    };
};

export const groupPresets = {
    active: () => buildGroup({ status: 'active' }),
    inactive: () => buildGroup({ status: 'inactive' }),
    hiatus: () => buildGroup({ status: 'hiatus' }),

    withoutMembers: () => buildGroup({ members: [] }),
    fullStaff: () =>
        buildGroup({
            members: buildAllRoleMembers(),
        }),

    bigGroup: () =>
        buildGroup({
            members: Array.from({ length: 10 }, () => buildGroupMember()),
            totalTitles: 200,
            popularity: 100,
        }),

    newGroup: () =>
        buildGroup({
            foundedYear: 2026,
            totalTitles: 0,
            translatedWorks: [],
            popularity: 0,
        }),

    legendary: () =>
        buildGroup({
            foundedYear: 2005,
            totalTitles: 500,
            rating: 5,
            popularity: 100,
            translatedWorks: Array.from({ length: 10 }, () => buildGroupWork()),
        }),

    withSupporters: () =>
        buildGroup({
            supporters: Array.from({ length: 5 }, () => buildGroupSupporter()),
        }),

    withWorks: () =>
        buildGroup({
            translatedWorks: Array.from({ length: 5 }, () => buildGroupWork()),
            translatedTitleIds: ['t1', 't2', 't3', 't4', 't5'],
        }),
};

export const buildGroupSummary = (
    overrides: Partial<GroupSummary> = {},
): GroupSummary => {
    const base = buildGroup();
    return {
        id: base.id,
        name: base.name,
        username: base.username,
        logo: base.logo,
        banner: base.banner,
        description: base.description,
        website: base.website,
        totalTitles: base.totalTitles,
        foundedYear: base.foundedYear,
        platformJoinedAt: base.platformJoinedAt,
        status: base.status,
        genres: base.genres,
        focusTags: base.focusTags,
        rating: base.rating,
        popularity: base.popularity,
        ...overrides,
    };
};

export const groupStatusValues: GroupStatus[] = [
    'active',
    'inactive',
    'hiatus',
];
export const groupRoleValues: GroupRole[] = ALL_GROUP_ROLES;

export const buildGroupList = (count = 10): Group[] =>
    Array.from({ length: count }, () => buildGroup());
