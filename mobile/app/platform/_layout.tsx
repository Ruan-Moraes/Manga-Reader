import { Stack } from 'expo-router';

import { useTheme } from '@/src/shared/theme';

export default function PlatformLayout() {
    const { decorativeMotionEnabled, tokens } = useTheme();
    return (
        <Stack
            screenOptions={{
                animation: decorativeMotionEnabled ? 'slide_from_right' : 'none',
                contentStyle: { backgroundColor: tokens.bg },
                headerShown: false,
            }}
        />
    );
}
