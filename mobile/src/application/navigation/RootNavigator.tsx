import { Stack } from 'expo-router';

import { useTheme } from '@/src/shared/theme';

export function RootNavigator() {
    const { tokens } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: tokens.bg },
                animation: 'fade',
            }}
        >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="+not-found" />
        </Stack>
    );
}
