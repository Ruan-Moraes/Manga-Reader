import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/shared/theme';

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
    disabled?: boolean;
    loading?: boolean;
    tone?: 'default' | 'danger';
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
    disabled = false,
    loading = false,
    tone = 'default',
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
            accessibilityState={onPress ? { busy: loading, disabled: disabled || loading } : undefined}
            disabled={disabled || loading}
            onPress={onPress}
            onPressIn={onPress ? () => setPressed(true) : undefined}
            onPressOut={onPress ? () => setPressed(false) : undefined}
            style={{
                alignItems: 'center',
                backgroundColor: disabled ? tokens.disabledSurface : pressed ? tokens.surfacePressed : tokens.surface,
                borderColor: tokens.separator,
                borderRadius: variant === 'card' ? radii.card : 0,
                borderBottomWidth: variant === 'plain' && showDivider ? 1 : 0,
                borderWidth: variant === 'card' ? 1 : 0,
                flexDirection: 'row',
                gap: spacing.md,
                minHeight: minimumTouchTarget,
                padding: spacing.md,
                paddingRight: trailing || onPress || loading ? spacing.md + 24 : spacing.md,
                position: 'relative',
                opacity: disabled ? 0.58 : 1,
            }}
        >
            {leading}
            <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                    <AppText numberOfLines={2} variant="label" tone={tone === 'danger' ? 'danger' : 'default'} style={{ flex: 1, minWidth: 0 }}>
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
            {trailing || onPress || loading ? (
                <View style={{ bottom: 0, justifyContent: 'center', position: 'absolute', right: spacing.md, top: 0 }}>
                    {loading ? (
                        <ActivityIndicator color={tokens.accentText} />
                    ) : (
                        (trailing ?? <Icon name="chevron-forward" color={tokens.accentText} decorative />)
                    )}
                </View>
            ) : null}
        </Pressable>
    );
}
