import { API_URLS } from '@shared/constant/API_URLS';
import { api } from '@shared/service/http';

export const hideActivityEvent = async (eventId: string): Promise<void> => {
    await api.delete(`${API_URLS.USERS}/me/activity-feed/${eventId}`);
};
