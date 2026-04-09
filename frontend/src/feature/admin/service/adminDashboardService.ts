import { api } from '@shared/service/http';
import type { ApiResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type { DashboardMetrics } from '../type/admin.types';

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
    const response = await api.get<ApiResponse<DashboardMetrics>>(
        API_URLS.ADMIN_DASHBOARD_METRICS,
    );
    return response.data.data;
};
