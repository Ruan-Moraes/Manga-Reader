import { Stack } from 'expo-router';

import { useTheme } from '@/src/shared/theme';
import { READER_SCREEN_OPTIONS } from '@/src/widgets/chapter-reader';

export function RootNavigator() {
    const { decorativeMotionEnabled, tokens } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: tokens.bg },
                animation: decorativeMotionEnabled ? 'fade' : 'none',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="offline-translation" />
            <Stack.Screen name="platform" />
            <Stack.Screen name="reader" options={READER_SCREEN_OPTIONS} />
            <Stack.Screen name="settings" />
            <Stack.Screen name="+not-found" />
        </Stack>
    );
}
