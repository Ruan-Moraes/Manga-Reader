import { useEffect } from 'react';
import { create } from 'zustand';

import { secureKeyValueStorage } from '@/shared/storage';

const KEY = 'toonlira_developer_mode_v1';

interface DeveloperModeState {
    unlocked: boolean;
    enabled: boolean;
    hydrated: boolean;
    hydrate(): Promise<void>;
    unlock(): Promise<void>;
    setEnabled(enabled: boolean): Promise<void>;
}

let pending: Promise<void> | undefined;
export const useDeveloperMode = create<DeveloperModeState>((set, get) => ({
    unlocked: false,
    enabled: false,
    hydrated: false,
    async hydrate() {
        if (get().hydrated) return;
        pending ??= Promise.resolve()
            .then(() => secureKeyValueStorage.get(KEY))
            .then(value => {
                set({ unlocked: value === 'true' || value === 'unlocked', enabled: value === 'true', hydrated: true });
            })
            .catch(() => set({ enabled: false, hydrated: true }))
            .finally(() => {
                pending = undefined;
            });
        await pending;
    },
    async unlock() {
        await get().hydrate();
        if (get().unlocked) return;
        await secureKeyValueStorage.set(KEY, 'unlocked');
        set({ unlocked: true });
    },
    async setEnabled(enabled) {
        await get().hydrate();
        if (!get().unlocked) return;
        await secureKeyValueStorage.set(KEY, enabled ? 'true' : 'unlocked');
        set({ enabled });
    },
}));

export function useDeveloperModeEnabled(): boolean {
    const enabled = useDeveloperMode(state => state.enabled);
    const hydrate = useDeveloperMode(state => state.hydrate);

    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    return enabled;
}
