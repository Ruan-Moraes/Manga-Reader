import { api } from '@shared/service/http';
import type { ApiResponse } from '@shared/service/http';
import type { BehaviorEvent } from '@entities/behavior-event';

export const sendBehaviorEvents = async (events: BehaviorEvent[]): Promise<string[]> => {
    const response = await api.post<ApiResponse<{ acceptedEventIds: string[] }>>('/api/behavior-events/batch', { events });
    return response.data.data.acceptedEventIds;
};

export const recordQualifiedTitleView = async (titleId: string): Promise<void> => {
    await api.post('/api/users/me/history', { titleId });
};

export type BehaviorTrackingConfig = {
    enabled: boolean;
    titleViewSeconds: number;
    bounceMinSeconds: number;
    chapterStartSeconds: number;
    chapterCompletionPercent: number;
    maxBatchSize: number;
};

export const getBehaviorTrackingConfig = async (): Promise<BehaviorTrackingConfig> => {
    const response = await api.get<ApiResponse<BehaviorTrackingConfig>>('/api/behavior-events/config');
    return response.data.data;
};
