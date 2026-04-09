export type AdminUser = {
    id: string;
    name: string;
    email: string;
    photoUrl: string | null;
    role: string;
    banned: boolean;
    bannedAt: string | null;
    bannedReason: string | null;
    bannedUntil: string | null;
    createdAt: string;
    updatedAt: string | null;
};

export type DashboardMetrics = {
    totalUsers: number;
    totalTitles: number;
    totalGroups: number;
    totalNews: number;
    totalEvents: number;
    usersByRole: Record<string, number>;
    bannedUsers: number;
};

export type BanUserRequest = {
    reason: string;
    bannedUntil?: string | null;
};

export type ChangeRoleRequest = {
    role: string;
};
