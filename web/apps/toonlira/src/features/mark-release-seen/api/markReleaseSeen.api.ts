import { API_URLS } from '@shared/constant/API_URLS';
import { api, type ApiResponse } from '@shared/service/http';

export const markReleaseSeen = async (chapterId: string): Promise<void> => {
    await api.put(`${API_URLS.RELEASES}/${chapterId}/seen`);
};

export const markReleaseDaySeen = async (date: string, timeZone: string): Promise<number> => {
    const response = await api.put<ApiResponse<{ markedCount: number }>>(
        `${API_URLS.RELEASES}/days/${date}/seen`,
        undefined,
        { params: { timeZone } },
    );
    return response.data.data.markedCount;
};
