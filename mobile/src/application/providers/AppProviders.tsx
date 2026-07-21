import type { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/src/shared/store';
import { ThemeProvider, useTheme } from '@/src/shared/theme';

import { QueryProvider } from './QueryProvider';

function ThemedApplicationSurface({ children }: PropsWithChildren) {
    const { tokens } = useTheme();

    return (
        <SafeAreaProvider style={{ backgroundColor: tokens.bg }}>
            <QueryProvider>{children}</QueryProvider>
        </SafeAreaProvider>
    );
}

export function AppProviders({ children }: PropsWithChildren) {
    const themeOverride = useSettingsStore(state => state.themeOverride);
    const setThemeOverride = useSettingsStore(state => state.setThemeOverride);

    return (
        <ThemeProvider
            initialOverride={themeOverride}
            onOverrideChange={scheme => {
                void setThemeOverride(scheme);
            }}
        >
            <ThemedApplicationSurface>{children}</ThemedApplicationSurface>
        </ThemeProvider>
    );
}
