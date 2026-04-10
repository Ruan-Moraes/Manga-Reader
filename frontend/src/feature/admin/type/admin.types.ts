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

export type AdminTitle = {
    id: string;
    name: string;
    type: string;
    cover: string | null;
    synopsis: string | null;
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
    name: string;
    type: string;
    cover?: string;
    synopsis?: string;
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
    title: string;
    subtitle: string | null;
    excerpt: string | null;
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
    title: string;
    category: string;
    subtitle?: string;
    excerpt?: string;
    content?: string[];
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
    title: string;
    subtitle: string | null;
    description: string | null;
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
    title: string;
    startDate: string;
    endDate: string;
    timeline: string;
    status: string;
    type: string;
    subtitle?: string;
    description?: string;
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
    name: string;
    username: string;
    logo: string | null;
    description: string | null;
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
