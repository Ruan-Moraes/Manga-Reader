import { TouchableOpacity, View } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';

interface ListRowProps {
    title: string;
    description?: string;
    meta?: string;
    leading?: ReactNode;
    trailing?: ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityHint?: string;
}

export function ListRow({ title, description, meta, leading, trailing, onPress, accessibilityLabel, accessibilityHint }: ListRowProps) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();

    return (
        <TouchableOpacity
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityHint={accessibilityHint}
            accessibilityRole={onPress ? 'button' : undefined}
            activeOpacity={0.82}
            disabled={!onPress}
            onPress={onPress}
            style={{
                alignItems: 'center',
                backgroundColor: tokens.surface,
                borderColor: tokens.separator,
                borderRadius: radii.card,
                borderWidth: 1,
                flexDirection: 'row',
                gap: spacing.md,
                minHeight: minimumTouchTarget,
                padding: spacing.md,
            }}
        >
            {leading}
            <View style={{ flex: 1, gap: spacing.xs }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    <AppText variant="label" style={{ flex: 1 }}>
                        {title}
                    </AppText>
                    {meta ? (
                        <AppText variant="caption" tone="muted">
                            {meta}
                        </AppText>
                    ) : null}
                </View>
                {description ? (
                    <AppText variant="caption" tone="subtle">
                        {description}
                    </AppText>
                ) : null}
            </View>
            {trailing ??
                (onPress ? (
                    <AppText variant="section" tone="accent">
                        ›
                    </AppText>
                ) : null)}
        </TouchableOpacity>
    );
}
