import { create } from 'zustand';

import type { PrivacyPatch } from '@/entities/user';

interface PrivacyMutationState {
    error: string | null;
    invalidationError: string | null;
    failedPatch: PrivacyPatch | null;
    syncStatus: 'idle' | 'syncing' | 'error';
}

const initialState: PrivacyMutationState = {
    error: null,
    invalidationError: null,
    failedPatch: null,
    syncStatus: 'idle',
};

export const usePrivacyMutationStore = create<PrivacyMutationState>(() => initialState);

export const privacyMutationTransitions = {
    begin: () => usePrivacyMutationStore.setState({ error: null, invalidationError: null, failedPatch: null, syncStatus: 'syncing' }),
    confirm: () => usePrivacyMutationStore.setState({ error: null, failedPatch: null, syncStatus: 'idle' }),
    rollback: (failedPatch: PrivacyPatch, error: string) => usePrivacyMutationStore.setState({ error, failedPatch, syncStatus: 'error' }),
    setInvalidationError: (invalidationError: string | null) => usePrivacyMutationStore.setState({ invalidationError }),
    reset: () => usePrivacyMutationStore.setState(initialState),
};
