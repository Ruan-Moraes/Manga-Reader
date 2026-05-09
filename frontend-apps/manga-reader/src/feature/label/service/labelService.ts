import { api } from '@shared/service/http';
import type { ApiResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type { DomainLabelOption, DomainLabelAdminOption } from '../type/label.types';

export const getDomainLabels = async (type: string): Promise<DomainLabelOption[]> => {
    const response = await api.get<ApiResponse<DomainLabelOption[]>>(API_URLS.LABELS, {
        params: { type },
    });
    return response.data.data;
};

export const getDomainLabelsAdmin = async (type: string): Promise<DomainLabelAdminOption[]> => {
    const response = await api.get<ApiResponse<DomainLabelAdminOption[]>>(
        `${API_URLS.LABELS}/admin`,
        { params: { type } },
    );
    return response.data.data;
};
