import { Stack } from 'expo-router';

import { useTheme } from '@/shared/theme';

export default function AuthLayout() {
    const { decorativeMotionEnabled, tokens } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: tokens.bg },
                animation: decorativeMotionEnabled ? 'slide_from_right' : 'none',
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot" />
        </Stack>
    );
}
