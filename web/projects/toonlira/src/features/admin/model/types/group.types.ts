import type { LocalizedString } from '@shared/type/i18n';

export type GroupMember = {
    userId: string;
    userName: string;
    userEmail: string;
    type: string | null;
    role: string | null;
    joinedAt: string | null;
};

export type AdminGroup = {
    id: string;
    name: LocalizedString;
    username: string;
    logo: string | null;
    description: LocalizedString;
    status: string;
    totalTitles: number;
    membersCount: number;
    rating: number;
    popularity: number;
    platformJoinedAt: string | null;
    members: GroupMember[];
};

export type ChangeGroupMemberRoleRequest = {
    role: string;
};
