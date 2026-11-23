import { Stack } from 'expo-router';

import { useScreenTransitions } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';

export default function AuthLayout() {
    const { tokens } = useTheme();
    const { drillIn } = useScreenTransitions();

    return (
        <Stack
            screenOptions={{
                ...drillIn,
                headerShown: false,
                contentStyle: { backgroundColor: tokens.bg },
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot" />
        </Stack>
    );
}
