import { View } from 'react-native';
import type { PropsWithChildren } from 'react';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';
import { Card } from './Card';

interface FormSectionProps extends PropsWithChildren {
    title: string;
    description?: string;
}

export function FormSection({ title, description, children }: FormSectionProps) {
    const { spacing, tokens } = useTheme();

    return (
        <Card padded={false}>
            <View style={{ borderBottomColor: tokens.separator, borderBottomWidth: 1, gap: spacing.xs, padding: spacing.lg }}>
                <AppText accessibilityRole="header" variant="section">
                    {title}
                </AppText>
                {description ? <AppText tone="muted">{description}</AppText> : null}
            </View>
            <View style={{ gap: spacing.lg, padding: spacing.lg }}>{children}</View>
        </Card>
    );
}
