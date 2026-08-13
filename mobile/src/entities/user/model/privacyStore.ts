import { create } from 'zustand';

import { normalizePrivacySettings, type PrivacySettings } from './privacy';

interface PrivacyState {
    identityEpoch: number | null;
    confirmed: PrivacySettings | null;
    current: PrivacySettings | null;
    error: string | null;
}

interface PrivacyActions {
    beginIdentity: (identityEpoch: number | null) => void;
    hydrate: (identityEpoch: number, value: unknown) => void;
    failHydration: (identityEpoch: number, error: string) => void;
}

const initialState: PrivacyState = {
    identityEpoch: null,
    confirmed: null,
    current: null,
    error: null,
};

export const usePrivacySettingsStore = create<PrivacyState & PrivacyActions>((set, get) => ({
    ...initialState,
    beginIdentity: identityEpoch => set({ ...initialState, identityEpoch }),
    hydrate: (identityEpoch, value) => {
        if (get().identityEpoch !== identityEpoch) return;
        const settings = normalizePrivacySettings(value);
        set({ confirmed: settings, current: settings, error: null });
    },
    failHydration: (identityEpoch, error) => {
        if (get().identityEpoch !== identityEpoch) return;
        set({ confirmed: null, current: null, error });
    },
}));
