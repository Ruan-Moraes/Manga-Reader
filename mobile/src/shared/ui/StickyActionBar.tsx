import { View } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';

export function StickyActionBar({ children }: { children: ReactNode }) {
    const insets = useSafeAreaInsets();
    const { layout, spacing, tokens } = useTheme();
    return (
        <View
            style={{
                backgroundColor: tokens.bg,
                borderTopColor: tokens.separator,
                borderTopWidth: 1,
                gap: spacing.xs,
                paddingBottom: Math.max(insets.bottom, spacing.sm + 4),
                paddingHorizontal: layout.screenGutter,
                paddingTop: spacing.sm,
            }}
        >
            {children}
        </View>
    );
}
