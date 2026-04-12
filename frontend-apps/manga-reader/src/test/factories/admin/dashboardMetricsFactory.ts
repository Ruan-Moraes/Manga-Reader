import type {
    ContentMetrics,
    DashboardMetrics,
    FinancialSummary,
    TopTitle,
} from '@feature/admin/type/admin.types';

let topTitleCounter = 0;

export const buildDashboardMetrics = (
    overrides: Partial<DashboardMetrics> = {},
): DashboardMetrics => ({
    totalUsers: 1500,
    totalTitles: 850,
    totalGroups: 45,
    totalNews: 320,
    totalEvents: 28,
    usersByRole: {
        MEMBER: 1430,
        MODERATOR: 60,
        ADMIN: 10,
    },
    bannedUsers: 25,
    ...overrides,
});

export const dashboardMetricsPresets = {
    empty: (): DashboardMetrics =>
        buildDashboardMetrics({
            totalUsers: 0,
            totalTitles: 0,
            totalGroups: 0,
            totalNews: 0,
            totalEvents: 0,
            usersByRole: { MEMBER: 0, MODERATOR: 0, ADMIN: 0 },
            bannedUsers: 0,
        }),
    realistic: (): DashboardMetrics => buildDashboardMetrics(),
    massive: (): DashboardMetrics =>
        buildDashboardMetrics({
            totalUsers: 1_000_000,
            totalTitles: 50_000,
            totalGroups: 5000,
            totalNews: 25_000,
            totalEvents: 1500,
            usersByRole: {
                MEMBER: 990_000,
                MODERATOR: 9000,
                ADMIN: 1000,
            },
            bannedUsers: 12_500,
        }),
    onlyAdmins: (): DashboardMetrics =>
        buildDashboardMetrics({
            totalUsers: 5,
            usersByRole: { MEMBER: 0, MODERATOR: 0, ADMIN: 5 },
            bannedUsers: 0,
        }),
};

export const buildTopTitle = (overrides: Partial<TopTitle> = {}): TopTitle => {
    topTitleCounter += 1;

    return {
        id: `top-title-${topTitleCounter}`,
        name: `Top ${topTitleCounter}`,
        cover: `/covers/top-${topTitleCounter}.jpg`,
        type: 'MANGA',
        rankingScore: 100 - topTitleCounter,
        ratingAverage: 4.9 - topTitleCounter * 0.05,
        ratingCount: 5000 - topTitleCounter * 100,
        ...overrides,
    };
};

export const topTitlePresets = {
    minimal: (): TopTitle =>
        buildTopTitle({
            cover: null,
            type: null,
            rankingScore: null,
            ratingAverage: null,
            ratingCount: null,
        }),
    chartTopper: (): TopTitle =>
        buildTopTitle({
            rankingScore: 100,
            ratingAverage: 5,
            ratingCount: 9999,
        }),
};

export const buildContentMetrics = (
    overrides: Partial<ContentMetrics> = {},
): ContentMetrics => ({
    titlesByStatus: {
        ongoing: 450,
        completed: 300,
        hiatus: 80,
        cancelled: 20,
    },
    eventsByStatus: {
        upcoming: 15,
        ongoing: 5,
        ended: 8,
    },
    topTitles: Array.from({ length: 5 }, () => buildTopTitle()),
    ...overrides,
});

export const contentMetricsPresets = {
    empty: (): ContentMetrics =>
        buildContentMetrics({
            titlesByStatus: {},
            eventsByStatus: {},
            topTitles: [],
        }),
    realistic: (): ContentMetrics => buildContentMetrics(),
    onlyOngoing: (): ContentMetrics =>
        buildContentMetrics({
            titlesByStatus: { ongoing: 100 },
            eventsByStatus: { ongoing: 5 },
        }),
    fullTopList: (): ContentMetrics =>
        buildContentMetrics({
            topTitles: Array.from({ length: 10 }, () => buildTopTitle()),
        }),
};

export const buildFinancialSummary = (
    overrides: Partial<FinancialSummary> = {},
): FinancialSummary => ({
    totalPayments: 850,
    totalRevenue: 42_500.5,
    pendingRevenue: 1250.0,
    countsByStatus: {
        PENDING: 25,
        COMPLETED: 800,
        FAILED: 15,
        REFUNDED: 10,
    },
    amountsByStatus: {
        PENDING: 1250.0,
        COMPLETED: 42500.5,
        FAILED: 750.0,
        REFUNDED: 500.0,
    },
    ...overrides,
});

export const financialSummaryPresets = {
    empty: (): FinancialSummary =>
        buildFinancialSummary({
            totalPayments: 0,
            totalRevenue: 0,
            pendingRevenue: 0,
            countsByStatus: {
                PENDING: 0,
                COMPLETED: 0,
                FAILED: 0,
                REFUNDED: 0,
            },
            amountsByStatus: {
                PENDING: 0,
                COMPLETED: 0,
                FAILED: 0,
                REFUNDED: 0,
            },
        }),
    onlyPending: (): FinancialSummary =>
        buildFinancialSummary({
            totalPayments: 10,
            totalRevenue: 0,
            pendingRevenue: 500,
            countsByStatus: {
                PENDING: 10,
                COMPLETED: 0,
                FAILED: 0,
                REFUNDED: 0,
            },
            amountsByStatus: {
                PENDING: 500,
                COMPLETED: 0,
                FAILED: 0,
                REFUNDED: 0,
            },
        }),
    healthy: (): FinancialSummary => buildFinancialSummary(),
    massive: (): FinancialSummary =>
        buildFinancialSummary({
            totalPayments: 100_000,
            totalRevenue: 5_000_000.5,
            pendingRevenue: 50_000.0,
            countsByStatus: {
                PENDING: 1000,
                COMPLETED: 95_000,
                FAILED: 2000,
                REFUNDED: 2000,
            },
            amountsByStatus: {
                PENDING: 50_000,
                COMPLETED: 5_000_000.5,
                FAILED: 100_000,
                REFUNDED: 100_000,
            },
        }),
    highRefund: (): FinancialSummary =>
        buildFinancialSummary({
            countsByStatus: {
                PENDING: 5,
                COMPLETED: 100,
                FAILED: 5,
                REFUNDED: 50,
            },
            amountsByStatus: {
                PENDING: 250,
                COMPLETED: 5000,
                FAILED: 250,
                REFUNDED: 2500,
            },
        }),
};
