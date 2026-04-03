import { api } from '@shared/service/http';
import type { ApiResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

export type PublishWorkRequest = {
    name: string;
    email: string;
    workType: string;
    workTitle: string;
    synopsis: string;
    portfolioLink?: string;
    message: string;
};

export const submitPublishWorkContact = async (
    data: PublishWorkRequest,
): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
        API_URLS.CONTACT_PUBLISH_WORK,
        data,
    );

    return response.data.data;
};
