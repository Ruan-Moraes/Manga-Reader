import { type PropsWithChildren, useEffect } from 'react';
import { StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { registerLocalMediaImportDataParticipant } from '@/src/entities/local-media-import';
import { registerTranslationProjectDataParticipant } from '@/src/entities/translation-project';
import { themePreferenceToColorScheme } from '@/src/entities/user-setting';
import { useSettingsStore } from '@/src/features/manage-settings';
import { ThemeProvider, useTheme } from '@/src/shared/theme';

import { QueryProvider } from './QueryProvider';

function ThemedApplicationSurface({ children }: PropsWithChildren) {
    const { colorScheme, tokens } = useTheme();

    useEffect(() => {
        RNStatusBar.setBarStyle(colorScheme === 'dark' ? 'light-content' : 'dark-content', true);
    }, [colorScheme]);

    return (
        <SafeAreaProvider style={{ backgroundColor: tokens.bg }}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <QueryProvider>{children}</QueryProvider>
        </SafeAreaProvider>
    );
}

export function AppProviders({ children }: PropsWithChildren) {
    const appearance = useSettingsStore(state => state.settings.appearance);
    const accessibility = useSettingsStore(state => state.settings.accessibility);
    const setThemeOverride = useSettingsStore(state => state.setThemeOverride);

    useEffect(() => {
        const unregisterImports = registerLocalMediaImportDataParticipant();
        const unregisterProjects = registerTranslationProjectDataParticipant();

        return () => {
            unregisterProjects();
            unregisterImports();
        };
    }, []);

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
