import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/theme';

export const unstable_settings = { initialRouteName: 'index' };

export default function SettingsLayout() {
    const { t } = useTranslation('settingsNavigation');

    const { decorativeMotionEnabled, tokens } = useTheme();

    return (
        <Stack
            screenOptions={{
                animation: decorativeMotionEnabled ? 'slide_from_right' : 'none',
                contentStyle: { backgroundColor: tokens.bg },
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" options={{ title: t('index.title') }} />
            <Stack.Screen name="appearance" options={{ title: t('sections.appearance.title') }} />
            <Stack.Screen name="locale" options={{ title: t('sections.locale.title') }} />
            <Stack.Screen name="content-languages" options={{ title: t('sections.contentLanguages.title') }} />
            <Stack.Screen name="reader" options={{ title: t('sections.reader.title') }} />
            <Stack.Screen name="privacy" options={{ title: t('sections.privacy.title') }} />
            <Stack.Screen name="data" options={{ title: t('sections.data.title') }} />
            <Stack.Screen name="about" options={{ title: t('sections.about.title') }} />
        </Stack>
    );
}
