import { View } from 'react-native';
import type { PropsWithChildren } from 'react';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Card } from './Card';

interface FormSectionProps extends PropsWithChildren {
    title: string;
    compact?: boolean;
    description?: string;
    contentPadding?: 'default' | 'none';
}

export function FormSection({ title, description, children, contentPadding = 'default', compact = false }: FormSectionProps) {
    const { radii, spacing, tokens } = useTheme();

    if (compact) {
        return (
            <View
                style={{
                    gap: spacing.md,
                    paddingBottom: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: tokens.separator,
                }}
            >
                {children}
            </View>
        );
    }

    return (
        <View style={{ gap: spacing.sm }}>
            <View style={{ gap: spacing.xs, paddingHorizontal: spacing.xs }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                    <View accessibilityElementsHidden style={{ backgroundColor: tokens.accent, borderRadius: radii.pill, height: 18, width: 4 }} />
                    <AppText accessibilityRole="header" variant="section">
                        {title}
                    </AppText>
                </View>
                {description ? (
                    <AppText variant="caption" tone="muted">
                        {description}
                    </AppText>
                ) : null}
            </View>
            <Card padded={false} style={{ overflow: 'hidden' }}>
                <View style={{ gap: contentPadding === 'none' ? 0 : spacing.lg, padding: contentPadding === 'none' ? 0 : spacing.lg }}>{children}</View>
            </Card>
        </View>
    );
}
