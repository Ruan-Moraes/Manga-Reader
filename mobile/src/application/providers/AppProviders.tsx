import type { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/src/shared/store';
import { darkTokens, ThemeProvider } from '@/src/shared/theme';

import { QueryProvider } from './QueryProvider';

export function AppProviders({ children }: PropsWithChildren) {
    const themeOverride = useSettingsStore(state => state.themeOverride);
    const setThemeOverride = useSettingsStore(state => state.setThemeOverride);

    return (
        <SafeAreaProvider style={{ backgroundColor: darkTokens.bg }}>
            <ThemeProvider
                initialOverride={themeOverride}
                onOverrideChange={scheme => {
                    void setThemeOverride(scheme);
                }}
            >
                <QueryProvider>{children}</QueryProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
