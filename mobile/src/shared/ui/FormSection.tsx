import { Children, isValidElement, type PropsWithChildren } from 'react';
import { View } from 'react-native';

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
    const { metrics, radii, spacing, tokens } = useTheme();

    if (compact) {
        return (
            <View
                // Folhas: 24 entre controles; seções vizinhas já se separam pelo SectionStack.
                style={{ gap: spacing.lg }}
            >
                {children}
            </View>
        );
    }

    const blocks = Children.toArray(children);

    return (
        <View style={{ gap: spacing.sm }}>
            <View style={{ gap: spacing.xs, paddingHorizontal: spacing.xs }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                    <View
                        accessibilityElementsHidden
                        style={{ backgroundColor: tokens.accent, borderRadius: radii.pill, height: metrics.accentBar.height, width: metrics.accentBar.width }}
                    />
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
                {contentPadding === 'none' ? (
                    children
                ) : (
                    <View testID="form-section-blocks">
                        {blocks.map((block, index) => (
                            <View
                                key={isValidElement(block) && block.key !== null ? block.key : index}
                                testID="form-section-block"
                                style={{
                                    borderTopColor: tokens.separator,
                                    borderTopWidth: index === 0 ? 0 : 1,
                                    gap: spacing.md,
                                    padding: metrics.rhythm.cardPadding,
                                }}
                            >
                                {block}
                            </View>
                        ))}
                    </View>
                )}
            </Card>
        </View>
    );
}
