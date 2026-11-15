import { Stack } from 'expo-router';

import { useScreenTransitions } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';

export default function PlatformLayout() {
    const { tokens } = useTheme();
    const { drillIn } = useScreenTransitions();

    return (
        <Stack
            screenOptions={{
                ...drillIn,
                contentStyle: { backgroundColor: tokens.bg },
                headerShown: false,
            }}
        />
    );
}
