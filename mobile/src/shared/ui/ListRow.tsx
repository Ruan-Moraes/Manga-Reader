import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface ListRowProps {
    title: string;
    description?: string;
    meta?: string;
    leading?: ReactNode;
    /** Icon tile (MOB-FEAT-057/AC-012); with it the row uses the 56/64 list heights. */
    icon?: IconName;
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
    icon,
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
    const { metrics, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [pressed, setPressed] = useState(false);
    const rowHeight = icon
        ? Math.max(minimumTouchTarget, description || (meta && metaPlacement === 'supporting') ? metrics.row.double : metrics.row.single)
        : minimumTouchTarget;
    const statusDotSize = icon ? 6 : 7;
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
                gap: icon ? metrics.rhythm.itemGap : spacing.md,
                minHeight: rowHeight,
                padding: spacing.md,
                // Kit SettingsRow: 12 vertical com ícone (altura 64); sem chevron na linha de perigo.
                paddingVertical: icon ? metrics.rhythm.itemGap : spacing.md,
                paddingRight: trailing || loading || (onPress && tone !== 'danger') ? spacing.md + 24 : spacing.md,
                position: 'relative',
                opacity: disabled ? 0.58 : 1,
            }}
        >
            {leading}
            {icon ? (
                <View
                    testID="list-row-icon-tile"
                    style={{
                        alignItems: 'center',
                        backgroundColor: tone === 'danger' ? tokens.dangerSoft : tokens.accentSoft,
                        borderRadius: radii.control,
                        flexShrink: 0,
                        height: metrics.iconTile.default,
                        justifyContent: 'center',
                        width: metrics.iconTile.default,
                    }}
                >
                    <Icon name={icon} size={metrics.icon.md} color={tone === 'danger' ? tokens.danger : tokens.accentText} decorative />
                </View>
            ) : null}
            <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                <AppText numberOfLines={2} variant="label" tone={tone === 'danger' ? 'danger' : 'default'}>
                    {title}
                </AppText>
                {description ? (
                    <AppText variant="caption" tone="subtle">
                        {description}
                    </AppText>
                ) : null}
                {meta && metaPlacement === 'supporting' ? (
                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
                        <View
                            accessibilityElementsHidden
                            style={{ backgroundColor: statusColors[statusTone], borderRadius: radii.pill, height: statusDotSize, width: statusDotSize }}
                        />
                        <AppText variant="caption" tone={statusTone === 'danger' ? 'danger' : statusTone === 'success' ? 'success' : 'muted'}>
                            {meta}
                        </AppText>
                    </View>
                ) : null}
            </View>
            {meta && metaPlacement === 'inline' ? (
                // Kit SettingsRow: valor numa coluna própria, centrado com a seta.
                <AppText numberOfLines={2} variant="caption" tone="muted" style={{ flexShrink: 1, maxWidth: '40%', textAlign: 'right' }}>
                    {meta}
                </AppText>
            ) : null}
            {trailing || loading || (onPress && tone !== 'danger') ? (
                <View style={{ bottom: 0, justifyContent: 'center', position: 'absolute', right: spacing.md, top: 0 }}>
                    {loading ? (
                        <ActivityIndicator color={tokens.accentText} />
                    ) : (
                        (trailing ?? <Icon name="chevron-forward" size={metrics.icon.md} color={tokens.tertiary} decorative />)
                    )}
                </View>
            ) : null}
        </Pressable>
    );
}
