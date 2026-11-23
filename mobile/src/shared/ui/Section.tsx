import { View } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';

interface SectionProps {
    title?: string;
    description?: string;
    children: ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
    const { spacing } = useTheme();

    return (
        // Title to content: `spacing.sm`, shared with SectionHeader and FormSection (2026-11-14).
        <View style={{ gap: spacing.sm }}>
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
