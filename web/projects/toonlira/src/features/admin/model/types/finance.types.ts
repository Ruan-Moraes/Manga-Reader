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
