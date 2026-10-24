import { api, createFileDownloadAdapter } from '@/shared/api';

export async function exportMyData(uri: string, signal: AbortSignal): Promise<void> {
    await api.get('/users/me/data-export', { adapter: createFileDownloadAdapter(uri), signal });
}

export async function clearMyTrackedHistory(): Promise<void> {
    await api.delete('/users/me/tracked-history');
}
