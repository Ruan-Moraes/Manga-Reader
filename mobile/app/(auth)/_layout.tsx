import { Stack } from 'expo-router';

import { useTheme } from '@/src/shared/theme';

export default function AuthLayout() {
    const { tokens } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: tokens.bg },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot" />
        </Stack>
    );
}
