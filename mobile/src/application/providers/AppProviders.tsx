import type { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { themePreferenceToColorScheme } from '@/src/entities/user-setting';
import { useSettingsStore } from '@/src/features/manage-settings';
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
    const appearance = useSettingsStore(state => state.settings.appearance);
    const accessibility = useSettingsStore(state => state.settings.accessibility);
    const setThemeOverride = useSettingsStore(state => state.setThemeOverride);

    return (
        <ThemeProvider
            initialOverride={themePreferenceToColorScheme(appearance.theme)}
            fontSize={appearance.fontSize}
            density={appearance.density}
            animations={appearance.animations}
            reduceMotion={accessibility.reduceMotion}
            highContrast={accessibility.highContrast}
            waitForPlatform
            onOverrideChange={scheme => {
                void setThemeOverride(scheme);
            }}
        >
            <ThemedApplicationSurface>{children}</ThemedApplicationSurface>
        </ThemeProvider>
    );
}
