import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type {
    AdminSubscription,
    SubscriptionSummary,
    UpdateSubscriptionStatusRequest,
    AdminPlan,
    CreatePlanRequest,
    UpdatePlanRequest,
    GrantSubscriptionRequest,
    SubscriptionAuditLogEntry,
    SubscriptionGrowth,
} from '../type/admin.types';

export const getAdminSubscriptions = async (
    page = 0,
    size = 20,
    status?: string,
    sort = 'createdAt',
    direction = 'desc',
): Promise<PageResponse<AdminSubscription>> => {
    const response = await api.get<
        ApiResponse<PageResponse<AdminSubscription>>
    >(API_URLS.ADMIN_SUBSCRIPTIONS, {
        params: { page, size, status, sort, direction },
    });
    return response.data.data;
};

export const getSubscriptionSummary =
    async (): Promise<SubscriptionSummary> => {
        const response = await api.get<ApiResponse<SubscriptionSummary>>(
            API_URLS.ADMIN_SUBSCRIPTIONS_SUMMARY,
        );
        return response.data.data;
    };

export const updateSubscriptionStatus = async (
    subscriptionId: string,
    data: UpdateSubscriptionStatusRequest,
): Promise<AdminSubscription> => {
    const response = await api.patch<ApiResponse<AdminSubscription>>(
        `${API_URLS.ADMIN_SUBSCRIPTIONS}/${subscriptionId}/status`,
        data,
    );
    return response.data.data;
};

// ── Plans ──────────────────────────────────────────────────────────

export const getAdminPlans = async (
    page = 0,
    size = 20,
): Promise<PageResponse<AdminPlan>> => {
    const response = await api.get<ApiResponse<PageResponse<AdminPlan>>>(
        API_URLS.ADMIN_SUBSCRIPTION_PLANS,
        { params: { page, size } },
    );
    return response.data.data;
};

export const createPlan = async (
    data: CreatePlanRequest,
): Promise<AdminPlan> => {
    const response = await api.post<ApiResponse<AdminPlan>>(
        API_URLS.ADMIN_SUBSCRIPTION_PLANS,
        data,
    );
    return response.data.data;
};

export const updatePlan = async (
    planId: string,
    data: UpdatePlanRequest,
): Promise<AdminPlan> => {
    const response = await api.patch<ApiResponse<AdminPlan>>(
        `${API_URLS.ADMIN_SUBSCRIPTION_PLANS}/${planId}`,
        data,
    );
    return response.data.data;
};

// ── Grant / Revoke ─────────────────────────────────────────────────

export const grantSubscription = async (
    data: GrantSubscriptionRequest,
): Promise<AdminSubscription> => {
    const response = await api.post<ApiResponse<AdminSubscription>>(
        `${API_URLS.ADMIN_SUBSCRIPTIONS}/grant`,
        data,
    );
    return response.data.data;
};

export const revokeSubscription = async (
    subscriptionId: string,
): Promise<AdminSubscription> => {
    const response = await api.post<ApiResponse<AdminSubscription>>(
        `${API_URLS.ADMIN_SUBSCRIPTIONS}/${subscriptionId}/revoke`,
    );
    return response.data.data;
};

// ── Audit Logs ─────────────────────────────────────────────────────

export const getSubscriptionAuditLogs = async (
    subscriptionId: string,
    page = 0,
    size = 20,
): Promise<PageResponse<SubscriptionAuditLogEntry>> => {
    const response = await api.get<
        ApiResponse<PageResponse<SubscriptionAuditLogEntry>>
    >(`${API_URLS.ADMIN_SUBSCRIPTIONS}/${subscriptionId}/logs`, {
        params: { page, size },
    });
    return response.data.data;
};

// ── Growth Series ──────────────────────────────────────────────────

export const getSubscriptionGrowth = async (
    months = 12,
): Promise<SubscriptionGrowth> => {
    const response = await api.get<ApiResponse<SubscriptionGrowth>>(
        API_URLS.ADMIN_SUBSCRIPTIONS_GROWTH_SERIES,
        { params: { months } },
    );
    return response.data.data;
};
