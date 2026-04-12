import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type {
    AdminPayment,
    FinancialSummary,
    RevenueTimeSeries,
    UpdatePaymentStatusRequest,
} from '../type/admin.types';

export const getAdminPayments = async (
    page = 0,
    size = 20,
    status?: string,
    sort = 'createdAt',
    direction = 'desc',
): Promise<PageResponse<AdminPayment>> => {
    const response = await api.get<ApiResponse<PageResponse<AdminPayment>>>(
        API_URLS.ADMIN_PAYMENTS,
        { params: { page, size, status, sort, direction } },
    );
    return response.data.data;
};

export const getAdminPaymentDetail = async (
    paymentId: string,
): Promise<AdminPayment> => {
    const response = await api.get<ApiResponse<AdminPayment>>(
        `${API_URLS.ADMIN_PAYMENTS}/${paymentId}`,
    );
    return response.data.data;
};

export const updatePaymentStatus = async (
    paymentId: string,
    data: UpdatePaymentStatusRequest,
): Promise<AdminPayment> => {
    const response = await api.patch<ApiResponse<AdminPayment>>(
        `${API_URLS.ADMIN_PAYMENTS}/${paymentId}/status`,
        data,
    );
    return response.data.data;
};

export const getFinancialSummary = async (): Promise<FinancialSummary> => {
    const response = await api.get<ApiResponse<FinancialSummary>>(
        API_URLS.ADMIN_PAYMENTS_SUMMARY,
    );
    return response.data.data;
};

export const getRevenueSeries = async (
    months = 12,
): Promise<RevenueTimeSeries> => {
    const response = await api.get<ApiResponse<RevenueTimeSeries>>(
        API_URLS.ADMIN_PAYMENTS_REVENUE_SERIES,
        { params: { months } },
    );
    return response.data.data;
};
