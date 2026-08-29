import { View } from 'react-native';
import type { PropsWithChildren, ReactNode } from 'react';

import { useTheme } from '@/src/shared/theme';
import { AppText } from '@/src/shared/ui';

export function SettingsSections({ children }: PropsWithChildren) {
    const { spacing } = useTheme();
    return <View style={{ gap: spacing.md }}>{children}</View>;
}

interface SettingsGroupCardProps {
    title: string;
    description: string;
    children: ReactNode;
}

export function SettingsGroupCard({ title, description, children }: SettingsGroupCardProps) {
    const { radii, spacing, tokens } = useTheme();

    return (
        <View style={{ gap: spacing.sm }}>
            <View style={{ gap: spacing.xs, paddingHorizontal: spacing.xs }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                    <View accessibilityElementsHidden style={{ backgroundColor: tokens.accent, borderRadius: radii.pill, height: 16, width: 4 }} />
                    <AppText accessibilityRole="header" variant="eyebrow" tone="accent">
                        {title}
                    </AppText>
                </View>
                <AppText variant="caption" tone="muted">
                    {description}
                </AppText>
            </View>
            <View
                style={{
                    backgroundColor: tokens.surface,
                    borderColor: tokens.separator,
                    borderRadius: radii.card,
                    borderWidth: 1,
                    overflow: 'hidden',
                }}
            >
                {children}
            </View>
        </View>
    );
}
