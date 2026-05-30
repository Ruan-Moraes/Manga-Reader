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

import type { LocalizedString, LocalizedStringList } from '@shared/type/i18n';

export type AdminTitle = {
    id: string;
    name: LocalizedString;
    type: string;
    cover: string | null;
    synopsis: LocalizedString;
    genres: string[];
    status: string | null;
    author: string | null;
    artist: string | null;
    publisher: string | null;
    adult: boolean;
    ratingAverage: number | null;
    ratingCount: number | null;
    chaptersCount: number;
    createdAt: string;
    updatedAt: string | null;
};

export type CreateTitleRequest = {
    name: LocalizedString;
    type: string;
    cover?: string;
    synopsis?: LocalizedString;
    genres?: string[];
    status?: string;
    author?: string;
    artist?: string;
    publisher?: string;
    adult: boolean;
};

export type UpdateTitleRequest = Partial<CreateTitleRequest>;

export type AdminNews = {
    id: string;
    title: LocalizedString;
    subtitle: LocalizedString;
    excerpt: LocalizedString;
    content: LocalizedStringList;
    coverImage: string | null;
    category: string;
    tags: string[];
    authorName: string | null;
    source: string | null;
    readTime: number;
    views: number;
    isExclusive: boolean;
    isFeatured: boolean;
    publishedAt: string;
    updatedAt: string | null;
};

export type CreateNewsRequest = {
    title: LocalizedString;
    category: string;
    subtitle?: LocalizedString;
    excerpt?: LocalizedString;
    content?: LocalizedStringList;
    coverImage?: string;
    tags?: string[];
    authorName?: string;
    authorAvatar?: string;
    source?: string;
    readTime: number;
    isExclusive: boolean;
    isFeatured: boolean;
};

export type UpdateNewsRequest = Partial<CreateNewsRequest>;

export type AdminEvent = {
    id: string;
    title: LocalizedString;
    subtitle: LocalizedString;
    description: LocalizedString;
    image: string | null;
    startDate: string;
    endDate: string;
    timezone: string | null;
    timeline: string;
    status: string;
    type: string;
    locationLabel: string | null;
    locationCity: string | null;
    locationIsOnline: boolean;
    organizerName: string | null;
    priceLabel: string | null;
    participants: number;
    interested: number;
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string | null;
};

export type CreateEventRequest = {
    title: LocalizedString;
    startDate: string;
    endDate: string;
    timeline: string;
    status: string;
    type: string;
    subtitle?: LocalizedString;
    description?: LocalizedString;
    image?: string;
    timezone?: string;
    locationLabel?: string;
    locationAddress?: string;
    locationCity?: string;
    locationIsOnline: boolean;
    locationMapLink?: string;
    organizerName?: string;
    organizerContact?: string;
    priceLabel?: string;
    isFeatured: boolean;
    schedule?: string[];
    specialGuests?: string[];
};

export type UpdateEventRequest = Partial<CreateEventRequest>;

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

export type TopTitle = {
    id: string;
    name: string;
    cover: string | null;
    type: string | null;
    rankingScore: number | null;
    ratingAverage: number | null;
    ratingCount: number | null;
};

export type ContentMetrics = {
    titlesByStatus: Record<string, number>;
    eventsByStatus: Record<string, number>;
    topTitles: TopTitle[];
};

export type AdminPayment = {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string | null;
    description: string | null;
    referenceType: string | null;
    referenceId: string | null;
    paidAt: string | null;
    createdAt: string;
    updatedAt: string | null;
};

export type UpdatePaymentStatusRequest = {
    status: string;
};

export type FinancialSummary = {
    totalPayments: number;
    totalRevenue: number;
    pendingRevenue: number;
    countsByStatus: Record<string, number>;
    amountsByStatus: Record<string, number>;
};

export type AdminSubscription = {
    id: string;
    userId: string;
    planPeriod: string;
    planPriceInCents: number;
    startDate: string;
    endDate: string;
    status: string;
    createdAt: string;
};

export type SubscriptionSummary = {
    totalActive: number;
    totalExpired: number;
    totalCancelled: number;
};

export type UpdateSubscriptionStatusRequest = {
    status: string;
};

export type AdminTag = {
    value: number;
    label: LocalizedString;
};

export type CreateTagRequest = {
    label: LocalizedString;
};

export type UpdateTagRequest = {
    label: LocalizedString;
};

export type AdminPlan = {
    id: string;
    period: string;
    priceInCents: number;
    description: string;
    features: string[];
    active: boolean;
    prices?: Record<string, number>;
};

export type CreatePlanRequest = {
    period: string;
    priceInCents: number;
    description: LocalizedString;
    features?: LocalizedStringList;
    prices?: Record<string, number>;
};

export type UpdatePlanRequest = {
    priceInCents?: number;
    description?: LocalizedString;
    features?: LocalizedStringList;
    active?: boolean;
    prices?: Record<string, number>;
};

export type GrantSubscriptionRequest = {
    userId: string;
    planId: string;
};

export type SubscriptionAuditLogEntry = {
    id: string;
    subscriptionId: string;
    userId: string;
    action: string;
    performedBy: string | null;
    details: string | null;
    createdAt: string;
};

export type MonthlyRevenueEntry = {
    yearMonth: string;
    revenue: number;
    count: number;
    growthPercent: number;
};

export type RevenueTimeSeries = {
    entries: MonthlyRevenueEntry[];
    totalRevenue: number;
    totalTransactions: number;
};

export type MonthlyGrowthEntry = {
    yearMonth: string;
    newSubscriptions: number;
    cancelledSubscriptions: number;
    netGrowth: number;
};

export type SubscriptionGrowth = {
    entries: MonthlyGrowthEntry[];
    totalNew: number;
    totalCancelled: number;
};
