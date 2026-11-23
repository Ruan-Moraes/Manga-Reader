import { create } from 'zustand';

import { CacheCleanupError } from './dataControls';

export type DataControlAction = 'cache' | 'export' | 'history' | 'offline';

interface DataControlsState {
    busyAction: DataControlAction | null;
    errorKey: string | null;
    failedCategories: readonly string[];
    run: (action: DataControlAction, operation: () => Promise<unknown>) => Promise<boolean>;
    clearError: () => void;
}

export const useDataControlsStore = create<DataControlsState>(set => ({
    busyAction: null,
    errorKey: null,
    failedCategories: [],
    run: async (action, operation) => {
        let acquired = false;
        set(state => {
            if (state.busyAction !== null) return state;
            acquired = true;
            return { busyAction: action, errorKey: null, failedCategories: [] };
        });
        if (!acquired) return false;

        try {
            await operation();
            return true;
        } catch (error) {
            set({
                errorKey: error instanceof CacheCleanupError ? error.message : `dataControls.error.${action}`,
                failedCategories: error instanceof CacheCleanupError ? error.failedCategories : [],
            });
            return false;
        } finally {
            set({ busyAction: null });
        }
    },
    clearError: () => set({ errorKey: null, failedCategories: [] }),
}));

export function getDataControlsStatusProjection(): 'local' | 'syncing' | 'error' {
    const state = useDataControlsStore.getState();
    if (state.errorKey) return 'error';
    return state.busyAction ? 'syncing' : 'local';
}
