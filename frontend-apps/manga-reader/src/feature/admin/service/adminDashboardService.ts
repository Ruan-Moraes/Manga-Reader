import { api } from '@shared/service/http';
import type { ApiResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type { ContentMetrics, DashboardMetrics } from '../type/admin.types';

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
    const response = await api.get<ApiResponse<DashboardMetrics>>(
        API_URLS.ADMIN_DASHBOARD_METRICS,
    );
    return response.data.data;
};

export const getContentMetrics = async (): Promise<ContentMetrics> => {
    const response = await api.get<ApiResponse<ContentMetrics>>(
        API_URLS.ADMIN_DASHBOARD_CONTENT_METRICS,
    );
    return response.data.data;
};
