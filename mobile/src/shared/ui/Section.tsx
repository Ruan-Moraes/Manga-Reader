import { View } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';

interface SectionProps {
    title?: string;
    description?: string;
    children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
    const { spacing } = useTheme();

    return (
        <View style={{ gap: spacing.md }}>
            {title || description ? (
                <View style={{ gap: spacing.xs }}>
                    {title ? (
                        <AppText accessibilityRole="header" variant="section">
                            {title}
                        </AppText>
                    ) : null}
                    {description ? (
                        <AppText variant="caption" tone="subtle">
                            {description}
                        </AppText>
                    ) : null}
                </View>
            ) : null}
            {children}
        </View>
    );
}
