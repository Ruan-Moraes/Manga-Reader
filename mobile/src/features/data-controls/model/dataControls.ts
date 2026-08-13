import type { QueryClient } from '@tanstack/react-query';

import type { RegenerableCacheAdapter } from '@/src/shared/cache';
import { imageCache } from '@/src/shared/cache';
import type { JsonExportAdapter } from '@/src/shared/files';
import { jsonExport, measureControlledStorage } from '@/src/shared/files';
import { clearLocalData, type LocalDataSummary } from '@/src/shared/storage';

import { clearMyTrackedHistory, exportMyData } from '../api/dataControlsApi';

export const dataControlQueryKeys = {
    history: ['history'] as const,
    readChapters: ['read-chapters'] as const,
    activities: ['activities'] as const,
    analytics: ['analytics'] as const,
};

export const DATA_CONTROL_CONFIRMATIONS = {
    cache: {
        titleKey: 'dataControls.cache.confirmTitle',
        bodyKey: 'dataControls.cache.confirmBody',
        removesKeys: ['dataControls.cache.queries', 'dataControls.cache.images', 'dataControls.cache.temporary'],
        preservesKeys: ['dataControls.cache.session', 'dataControls.cache.preferences', 'dataControls.cache.pending'],
    },
    history: {
        titleKey: 'dataControls.history.confirmTitle',
        bodyKey: 'dataControls.history.confirmBody',
        removesKeys: ['dataControls.history.history', 'dataControls.history.readChapters', 'dataControls.history.activities'],
        preservesKeys: ['dataControls.history.readingProgress', 'dataControls.cache.session', 'dataControls.cache.preferences'],
    },
    offline: {
        titleKey: 'dataControls.offline.confirmTitle',
        bodyKey: 'dataControls.offline.confirmBody',
        removesKeys: ['dataControls.offline.projects'],
        preservesKeys: ['dataControls.cache.session', 'dataControls.cache.preferences'],
    },
} as const;

export interface DataControlDependencies {
    queryClient: Pick<QueryClient, 'clear' | 'invalidateQueries' | 'refetchQueries' | 'removeQueries'>;
    images?: RegenerableCacheAdapter;
    exports?: JsonExportAdapter;
    getExport?: () => Promise<unknown>;
    deleteHistory?: () => Promise<void>;
}

export type DataControlResult = 'completed' | 'cancelled' | 'unavailable';

export class CacheCleanupError extends Error {
    constructor(readonly failedCategories: readonly ('images' | 'temporary' | 'queries')[]) {
        super('dataControls.error.cachePartial');
        this.name = 'CacheCleanupError';
    }
}

export async function clearApplicationCache(confirmed: boolean, dependencies: DataControlDependencies): Promise<DataControlResult> {
    if (!confirmed) return 'cancelled';

    const images = dependencies.images ?? imageCache;
    const exports = dependencies.exports ?? jsonExport;
    const results = await Promise.allSettled([images.clear(), exports.clearTemporaryFiles()]);
    dependencies.queryClient.clear();
    const queryRefetch = await Promise.allSettled([dependencies.queryClient.refetchQueries({ type: 'active' })]);
    const failedCategories: ('images' | 'temporary' | 'queries')[] = results.flatMap((result, index) =>
        result.status === 'rejected' ? [index === 0 ? ('images' as const) : ('temporary' as const)] : [],
    );
    if (queryRefetch[0].status === 'rejected') failedCategories.push('queries');
    if (failedCategories.length > 0) throw new CacheCleanupError(failedCategories);
    return 'completed';
}

export async function shareAccountExport(authenticated: boolean, dependencies: DataControlDependencies, date?: Date): Promise<DataControlResult> {
    if (!authenticated) return 'unavailable';

    const data = await (dependencies.getExport ?? exportMyData)();
    const result = await (dependencies.exports ?? jsonExport).share(data, date);
    return result.status === 'cancelled' ? 'cancelled' : 'completed';
}

export async function clearDataControlTemporaries(exports: JsonExportAdapter = jsonExport): Promise<void> {
    await exports.clearTemporaryFiles();
}

export async function clearTrackedHistory(authenticated: boolean, confirmed: boolean, dependencies: DataControlDependencies): Promise<DataControlResult> {
    if (!authenticated) return 'unavailable';
    if (!confirmed) return 'cancelled';

    await (dependencies.deleteHistory ?? clearMyTrackedHistory)();
    const trackedKeys = [dataControlQueryKeys.history, dataControlQueryKeys.readChapters, dataControlQueryKeys.activities, dataControlQueryKeys.analytics];
    const invalidations = await Promise.allSettled(
        trackedKeys.map(queryKey => dependencies.queryClient.invalidateQueries({ queryKey, refetchType: 'all' }, { throwOnError: true })),
    );
    const failedKeys = invalidations.flatMap((result, index) => (result.status === 'rejected' ? [trackedKeys[index]] : []));
    const recoveries = await Promise.allSettled(
        failedKeys.map(queryKey => dependencies.queryClient.refetchQueries({ queryKey, type: 'active' }, { throwOnError: true })),
    );
    recoveries.forEach((result, index) => {
        if (result.status === 'rejected') dependencies.queryClient.removeQueries({ queryKey: failedKeys[index], exact: false });
    });
    return 'completed';
}

export async function clearRegisteredLocalData(confirmed: boolean, summary: LocalDataSummary): Promise<DataControlResult> {
    if (!confirmed) return 'cancelled';
    if (summary.participantIds.length === 0 || summary.totalBytes <= 0) return 'unavailable';
    await clearLocalData(summary.participantIds);
    return 'completed';
}

export { measureControlledStorage };
