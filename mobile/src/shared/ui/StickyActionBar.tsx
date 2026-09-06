import { View } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';

export function StickyActionBar({ children }: { children: ReactNode }) {
    const insets = useSafeAreaInsets();
    const { spacing, tokens } = useTheme();
    return (
        <View
            style={{
                backgroundColor: tokens.bg,
                borderTopColor: tokens.separator,
                borderTopWidth: 1,
                gap: spacing.sm,
                paddingBottom: Math.max(insets.bottom, spacing.sm),
                paddingTop: spacing.sm,
            }}
        >
            {children}
        </View>
    );
}
