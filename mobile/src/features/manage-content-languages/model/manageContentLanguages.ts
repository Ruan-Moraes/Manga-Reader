import type { QueryClient, QueryKey } from '@tanstack/react-query';

import {
    addContentLanguage as appendContentLanguage,
    type ContentLanguage,
    type ContentLanguageChain,
    moveContentLanguage as reorderContentLanguage,
    normalizeContentLanguages,
    removeContentLanguage as excludeContentLanguage,
} from '@/src/entities/content-language-preference';

import { patchMyContentLanguages } from '../api/manageContentLanguagesApi';
import { useContentLanguagesStore } from './contentLanguagesStore';

const CONTENT_DEPENDENT_QUERY_KEYS: readonly QueryKey[] = [['titles'], ['title'], ['comments'], ['review']];

let mutationVersion = 0;
let patchTail: Promise<void> = Promise.resolve();
const activeControllers = new Set<AbortController>();
let failedConsumerInvalidations: { identityEpoch: number; mutationVersion: number; queryKeys: QueryKey[] } | null = null;

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'Content language update failed');

async function invalidateConsumers(queryClient: QueryClient, queryKeys: readonly QueryKey[], identityEpoch: number, version: number): Promise<void> {
    const results = await Promise.allSettled(queryKeys.map(queryKey => queryClient.invalidateQueries({ queryKey, exact: false }, { throwOnError: true })));
    const state = useContentLanguagesStore.getState();
    if (version !== mutationVersion || state.identityEpoch !== identityEpoch) return;

    const failed = results.flatMap((result, index) => (result.status === 'rejected' ? [{ queryKey: queryKeys[index], error: result.reason }] : []));
    failedConsumerInvalidations = failed.length ? { identityEpoch, mutationVersion: version, queryKeys: failed.map(({ queryKey }) => [...queryKey]) } : null;
    state.completeConsumerInvalidation(identityEpoch, failed.length ? errorMessage(failed[0].error) : null);
}

export async function updateContentLanguages(contentLocales: ContentLanguageChain, queryClient: QueryClient): Promise<ContentLanguageChain> {
    const state = useContentLanguagesStore.getState();
    if (state.identityEpoch === null || state.confirmed === null) throw new Error('Content language preference is not hydrated');

    const identityEpoch = state.identityEpoch;
    const version = ++mutationVersion;
    failedConsumerInvalidations = null;
    const normalized = normalizeContentLanguages(contentLocales);
    state.beginSync(identityEpoch, normalized);
    const controller = new AbortController();
    activeControllers.add(controller);
    const patchOperation = patchTail.then(() => patchMyContentLanguages(normalized, controller.signal));
    patchTail = patchOperation.then(
        () => undefined,
        () => undefined,
    );

    try {
        const confirmed = await patchOperation;
        const current = useContentLanguagesStore.getState();
        if (version !== mutationVersion || current.identityEpoch !== identityEpoch) return confirmed;
        current.confirm(identityEpoch, confirmed);
        await invalidateConsumers(queryClient, CONTENT_DEPENDENT_QUERY_KEYS, identityEpoch, version);
        return confirmed;
    } catch (error) {
        const current = useContentLanguagesStore.getState();
        if (version === mutationVersion && current.identityEpoch === identityEpoch) current.failSync(identityEpoch, errorMessage(error));
        throw error;
    } finally {
        activeControllers.delete(controller);
    }
}

const editableChain = (): ContentLanguageChain => {
    const state = useContentLanguagesStore.getState();
    if (!state.confirmed) throw new Error('Content language preference is not hydrated');
    return state.pending ?? state.confirmed;
};

export function addContentLanguage(language: ContentLanguage, queryClient: QueryClient): Promise<ContentLanguageChain> {
    return updateContentLanguages(appendContentLanguage(editableChain(), language), queryClient);
}

export function removeContentLanguage(language: ContentLanguage, queryClient: QueryClient): Promise<ContentLanguageChain> {
    return updateContentLanguages(excludeContentLanguage(editableChain(), language), queryClient);
}

export function moveContentLanguage(from: number, to: number, queryClient: QueryClient): Promise<ContentLanguageChain> {
    return updateContentLanguages(reorderContentLanguage(editableChain(), from, to), queryClient);
}

export function retryContentLanguagesUpdate(queryClient: QueryClient): Promise<ContentLanguageChain | null> {
    const pending = useContentLanguagesStore.getState().pending;
    return pending ? updateContentLanguages(pending, queryClient) : Promise.resolve(null);
}

export async function retryContentLanguageConsumers(queryClient: QueryClient): Promise<boolean> {
    const failed = failedConsumerInvalidations;
    const state = useContentLanguagesStore.getState();
    if (!failed || state.identityEpoch !== failed.identityEpoch || failed.mutationVersion !== mutationVersion) return false;

    state.beginConsumerRetry(failed.identityEpoch);
    await invalidateConsumers(queryClient, failed.queryKeys, failed.identityEpoch, failed.mutationVersion);
    return useContentLanguagesStore.getState().invalidationError === null;
}

export function resetContentLanguagesMutationRuntime(): void {
    mutationVersion += 1;
    activeControllers.forEach(controller => controller.abort());
    activeControllers.clear();
    patchTail = Promise.resolve();
    failedConsumerInvalidations = null;
}

export function contentLanguageQueryKeys(): QueryKey[] {
    return CONTENT_DEPENDENT_QUERY_KEYS.map(queryKey => [...queryKey]);
}
