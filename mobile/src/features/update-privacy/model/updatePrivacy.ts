import type { QueryClient, QueryKey } from '@tanstack/react-query';

import { type HistoryVisibility, type PrivacyPatch, type PrivacySettings, usePrivacySettingsStore, validatePrivacyPatch } from '@/src/entities/user';

import { patchMyPrivacy } from '../api/privacyApi';
import { privacyMutationTransitions, usePrivacyMutationStore } from './privacyMutationStore';

const PROFILE_KEY = ['user'] as const;
const INVALIDATIONS: Record<keyof PrivacySettings, readonly QueryKey[]> = {
    commentVisibility: [PROFILE_KEY, ['comments']],
    viewHistoryVisibility: [PROFILE_KEY, ['history'], ['activities']],
    libraryVisibility: [PROFILE_KEY, ['library']],
    adultContentPreference: [['titles'], ['title'], ['search'], ['library'], ['feed'], ['chapters']],
    behaviorAnalyticsEnabled: [['analytics'], ['activities']],
};

let operationVersion = 0;
let patchTail: Promise<void> = Promise.resolve();
const activeControllers = new Set<AbortController>();
let failedInvalidations: { identityEpoch: number; operationVersion: number; queryKeys: QueryKey[] } | null = null;

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'Privacy update failed');

function safePatch(current: PrivacySettings, requested: PrivacyPatch): PrivacyPatch {
    const patch = validatePrivacyPatch({ ...requested });
    const nextHistory = patch.viewHistoryVisibility ?? current.viewHistoryVisibility;

    if (nextHistory === 'DO_NOT_TRACK' && patch.behaviorAnalyticsEnabled === true) {
        throw new Error('Behavior analytics cannot be enabled under DO_NOT_TRACK');
    }
    if (
        current.viewHistoryVisibility === 'DO_NOT_TRACK' &&
        patch.viewHistoryVisibility !== undefined &&
        patch.viewHistoryVisibility !== 'DO_NOT_TRACK' &&
        patch.behaviorAnalyticsEnabled === true
    ) {
        throw new Error('Leaving DO_NOT_TRACK and enabling analytics require separate actions');
    }
    if (patch.viewHistoryVisibility === 'DO_NOT_TRACK') return { ...patch, behaviorAnalyticsEnabled: false };
    return patch;
}

async function invalidateChanged(queryClient: QueryClient, patch: PrivacyPatch, identityEpoch: number, version: number): Promise<void> {
    const unique = new Map<string, QueryKey>();
    (Object.keys(patch) as (keyof PrivacySettings)[]).forEach(field =>
        INVALIDATIONS[field].forEach(queryKey => unique.set(JSON.stringify(queryKey), queryKey)),
    );
    const results = await Promise.allSettled([...unique.values()].map(queryKey => queryClient.invalidateQueries({ queryKey, exact: false })));
    const failed = results.flatMap((result, index) => (result.status === 'rejected' ? [{ queryKey: [...unique.values()][index], error: result.reason }] : []));
    const state = usePrivacySettingsStore.getState();
    if (state.identityEpoch !== identityEpoch || version !== operationVersion) return;
    failedInvalidations = failed.length ? { identityEpoch, operationVersion: version, queryKeys: failed.map(item => [...item.queryKey]) } : null;
    privacyMutationTransitions.setInvalidationError(failed.length ? errorMessage(failed[0].error) : null);
}

export async function updatePrivacy(patch: PrivacyPatch, queryClient: QueryClient): Promise<PrivacySettings> {
    const state = usePrivacySettingsStore.getState();
    if (state.identityEpoch === null || state.confirmed === null || state.current === null) throw new Error('Privacy settings are not hydrated');

    const effectivePatch = safePatch(state.current, patch);
    const identityEpoch = state.identityEpoch;
    const version = ++operationVersion;
    failedInvalidations = null;
    const optimistic = { ...state.current, ...effectivePatch };
    usePrivacySettingsStore.setState({ current: optimistic, error: null });
    privacyMutationTransitions.begin();
    const controller = new AbortController();
    activeControllers.add(controller);
    const patchOperation = patchTail.then(() => patchMyPrivacy(effectivePatch, controller.signal));
    patchTail = patchOperation.then(
        () => undefined,
        () => undefined,
    );

    try {
        const confirmed = await patchOperation;
        const currentState = usePrivacySettingsStore.getState();
        if (version !== operationVersion || currentState.identityEpoch !== identityEpoch) return confirmed;
        usePrivacySettingsStore.setState({ confirmed, current: confirmed, error: null });
        privacyMutationTransitions.confirm();
        await invalidateChanged(queryClient, effectivePatch, identityEpoch, version);
        return confirmed;
    } catch (error) {
        const currentState = usePrivacySettingsStore.getState();
        if (version === operationVersion && currentState.identityEpoch === identityEpoch) {
            usePrivacySettingsStore.setState({ current: currentState.confirmed });
            privacyMutationTransitions.rollback(effectivePatch, errorMessage(error));
        }
        throw error;
    } finally {
        activeControllers.delete(controller);
    }
}

export async function changeHistoryVisibility(
    visibility: HistoryVisibility,
    confirmDoNotTrack: () => boolean | Promise<boolean>,
    queryClient: QueryClient,
): Promise<PrivacySettings | null> {
    const current = usePrivacySettingsStore.getState().current;
    if (!current) throw new Error('Privacy settings are not hydrated');
    if (visibility === 'DO_NOT_TRACK' && current.viewHistoryVisibility !== 'DO_NOT_TRACK' && !(await confirmDoNotTrack())) return null;
    return updatePrivacy({ viewHistoryVisibility: visibility }, queryClient);
}

export async function retryPrivacyUpdate(queryClient: QueryClient): Promise<PrivacySettings | null> {
    const failedPatch = usePrivacyMutationStore.getState().failedPatch;
    return failedPatch ? updatePrivacy(failedPatch, queryClient) : null;
}

export async function retryPrivacyConsumers(queryClient: QueryClient): Promise<boolean> {
    const failed = failedInvalidations;
    const state = usePrivacySettingsStore.getState();
    if (!failed || state.identityEpoch !== failed.identityEpoch || failed.operationVersion !== operationVersion) return false;

    const results = await Promise.allSettled(failed.queryKeys.map(queryKey => queryClient.invalidateQueries({ queryKey, exact: false })));
    const remaining = results.flatMap((result, index) => (result.status === 'rejected' ? [{ queryKey: failed.queryKeys[index], error: result.reason }] : []));
    const current = usePrivacySettingsStore.getState();
    if (current.identityEpoch !== failed.identityEpoch || failed.operationVersion !== operationVersion) return false;
    failedInvalidations = remaining.length
        ? { identityEpoch: failed.identityEpoch, operationVersion: failed.operationVersion, queryKeys: remaining.map(item => [...item.queryKey]) }
        : null;
    privacyMutationTransitions.setInvalidationError(remaining.length ? errorMessage(remaining[0].error) : null);
    return remaining.length === 0;
}

export function resetPrivacyMutationRuntime(): void {
    operationVersion += 1;
    activeControllers.forEach(controller => controller.abort());
    activeControllers.clear();
    patchTail = Promise.resolve();
    failedInvalidations = null;
    privacyMutationTransitions.reset();
}

export function privacySessionQueryKeys(): QueryKey[] {
    const keys = new Map<string, QueryKey>();
    Object.values(INVALIDATIONS)
        .flat()
        .forEach(key => keys.set(JSON.stringify(key), key));
    return [...keys.values()];
}

export function getPrivacyStatusProjection(): 'syncing' | 'synced' | 'error' {
    const entity = usePrivacySettingsStore.getState();
    const mutation = usePrivacyMutationStore.getState();
    if (mutation.syncStatus === 'syncing') return 'syncing';
    if (entity.error || mutation.error || mutation.invalidationError || mutation.syncStatus === 'error') return 'error';
    return 'synced';
}
