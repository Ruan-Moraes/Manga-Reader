import { useSyncExternalStore } from 'react';

import {
    getThemePreferenceSnapshot,
    setThemePreference,
    subscribeThemePreference,
    type ThemePreference,
} from '@/shared/config/theme';

const getServerSnapshot = (): ThemePreference => 'SYSTEM';

export default function useThemePreference(): [
    ThemePreference,
    typeof setThemePreference,
] {
    const theme = useSyncExternalStore(
        subscribeThemePreference,
        getThemePreferenceSnapshot,
        getServerSnapshot,
    );

    return [theme, setThemePreference];
}
