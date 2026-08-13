import { getMyContentLanguages } from '@/src/entities/content-language-preference';

import { useContentLanguagesStore } from './contentLanguagesStore';

let hydrationController: AbortController | null = null;

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'Content language hydration failed');

export async function hydrateContentLanguages(identityEpoch: number): Promise<void> {
    hydrationController?.abort();
    const controller = new AbortController();
    hydrationController = controller;

    try {
        const contentLocales = await getMyContentLanguages(controller.signal);
        useContentLanguagesStore.getState().hydrate(identityEpoch, contentLocales);
    } catch (error) {
        if (!controller.signal.aborted) useContentLanguagesStore.getState().failHydration(identityEpoch, errorMessage(error));
    } finally {
        if (hydrationController === controller) hydrationController = null;
    }
}

export function resetContentLanguagesHydration(): void {
    hydrationController?.abort();
    hydrationController = null;
}
