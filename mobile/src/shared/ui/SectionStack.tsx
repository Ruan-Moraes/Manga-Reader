import { View } from 'react-native';
import type { PropsWithChildren } from 'react';

import { useTheme } from '@/src/shared/theme';

interface SectionStackProps extends PropsWithChildren {
    testID?: string;
}

export function SectionStack({ children, testID }: SectionStackProps) {
    const { spacing } = useTheme();

    return (
        <View testID={testID} style={{ gap: spacing.xl }}>
            {children}
        </View>
    );
}
