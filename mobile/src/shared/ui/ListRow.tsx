import { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

interface ListRowProps {
    title: string;
    description?: string;
    meta?: string;
    leading?: ReactNode;
    trailing?: ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    variant?: 'card' | 'plain';
    metaPlacement?: 'inline' | 'supporting';
    statusTone?: 'accent' | 'danger' | 'neutral' | 'success' | 'warning';
    showDivider?: boolean;
}

export function ListRow({
    title,
    description,
    meta,
    leading,
    trailing,
    onPress,
    accessibilityLabel,
    accessibilityHint,
    variant = 'card',
    metaPlacement = 'inline',
    statusTone = 'neutral',
    showDivider = true,
}: ListRowProps) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [pressed, setPressed] = useState(false);
    const statusColors = {
        accent: tokens.accentText,
        danger: tokens.danger,
        neutral: tokens.subtle,
        success: tokens.success,
        warning: tokens.warn,
    };

    return (
        <Pressable
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityHint={accessibilityHint}
            accessibilityRole={onPress ? 'button' : undefined}
            disabled={!onPress}
            onPress={onPress}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            style={{
                alignItems: 'center',
                backgroundColor: pressed ? tokens.surfacePressed : tokens.surface,
                borderColor: tokens.separator,
                borderRadius: variant === 'card' ? radii.card : 0,
                borderBottomWidth: variant === 'plain' && showDivider ? 1 : 0,
                borderWidth: variant === 'card' ? 1 : 0,
                flexDirection: 'row',
                gap: spacing.md,
                minHeight: minimumTouchTarget,
                padding: spacing.md,
                paddingRight: spacing.md + 24,
                position: 'relative',
            }}
        >
            {leading}
            <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                    <AppText numberOfLines={2} variant="label" style={{ flex: 1, minWidth: 0 }}>
                        {title}
                    </AppText>
                    {meta && metaPlacement === 'inline' ? (
                        <AppText numberOfLines={2} variant="caption" tone="muted" style={{ flexShrink: 1, maxWidth: '46%', textAlign: 'right' }}>
                            {meta}
                        </AppText>
                    ) : null}
                </View>
                {description ? (
                    <AppText variant="caption" tone="subtle">
                        {description}
                    </AppText>
                ) : null}
                {meta && metaPlacement === 'supporting' ? (
                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
                        <View
                            accessibilityElementsHidden
                            style={{ backgroundColor: statusColors[statusTone], borderRadius: radii.pill, height: 7, width: 7 }}
                        />
                        <AppText variant="caption" tone={statusTone === 'danger' ? 'danger' : statusTone === 'success' ? 'success' : 'muted'}>
                            {meta}
                        </AppText>
                    </View>
                ) : null}
            </View>
            {trailing || onPress ? (
                <View style={{ bottom: 0, justifyContent: 'center', position: 'absolute', right: spacing.md, top: 0 }}>
                    {trailing ?? <Icon name="chevron-forward" color={tokens.accentText} decorative />}
                </View>
            ) : null}
        </Pressable>
    );
}
