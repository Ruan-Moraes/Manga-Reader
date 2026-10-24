import { usePrivacySettingsStore } from '@/entities/user';

import { getMyPrivacy } from '../api/privacyApi';

let hydrationController: AbortController | null = null;

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'Privacy hydration failed');

export async function hydratePrivacy(identityEpoch: number): Promise<void> {
    hydrationController?.abort();
    const controller = new AbortController();
    hydrationController = controller;

    try {
        const privacy = await getMyPrivacy(controller.signal);
        usePrivacySettingsStore.getState().hydrate(identityEpoch, privacy);
    } catch (error) {
        if (!controller.signal.aborted) usePrivacySettingsStore.getState().failHydration(identityEpoch, errorMessage(error));
    } finally {
        if (hydrationController === controller) hydrationController = null;
    }
}

export function resetPrivacyHydration(): void {
    hydrationController?.abort();
    hydrationController = null;
}
