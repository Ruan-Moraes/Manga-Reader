import { api } from '@/src/shared/api';

export async function exportMyData(): Promise<unknown> {
    const response = await api.get<unknown>('/users/me/data-export');
    return response.data;
}

export async function clearMyTrackedHistory(): Promise<void> {
    await api.delete('/users/me/tracked-history');
}
