import { useSyncExternalStore } from 'react';

import type { AdultContentPreference } from '../model/user.types';

const EVENT = 'mr.adult-content.updated';
let currentPreference: AdultContentPreference = 'BLUR';

export const setAdultContentPreference = (preference?: AdultContentPreference) => {
    const next = preference ?? 'BLUR';
    if (next === currentPreference) return;
    currentPreference = next;
    if (typeof document !== 'undefined') document.documentElement.dataset.mrAdultContent = next;
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
};

export const getAdultContentPreference = () => currentPreference;

const subscribe = (listener: () => void) => {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(EVENT, listener);
    return () => window.removeEventListener(EVENT, listener);
};

export const useAdultContentPreference = () => useSyncExternalStore(subscribe, getAdultContentPreference, () => 'BLUR');
