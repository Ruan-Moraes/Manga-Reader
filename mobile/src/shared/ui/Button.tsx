import { ReactNode } from 'react';
import { ActivityIndicator, TouchableOpacity, type TouchableOpacityProps } from 'react-native';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';

type Variant = 'primary' | 'ghost' | 'outline';
type ButtonTone = 'accent' | 'danger';
type ButtonSize = 'compact' | 'default';

interface Props extends Omit<TouchableOpacityProps, 'children' | 'disabled' | 'onPress' | 'style'> {
    children: ReactNode;
    onPress?: () => void;
    variant?: Variant;
    tone?: ButtonTone;
    size?: ButtonSize;
    leading?: ReactNode;
    trailing?: ReactNode;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
}

export function Button({
    children,
    onPress,
    variant = 'primary',
    tone = 'accent',
    size = 'default',
    leading,
    trailing,
    loading,
    disabled,
    fullWidth = true,
    ...pressableProps
}: Props) {
    const { layout, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const off = loading || disabled;
    const actionColor = tone === 'danger' ? tokens.danger : tokens.accent;
    const actionTextColor = tone === 'danger' ? tokens.danger : tokens.accentText;
    const primaryTextColor = tone === 'danger' ? tokens.inverseText : tokens.onAccent;
    const height = size === 'compact' ? layout.compactControlHeight : layout.controlHeight;

    const bg = variant === 'primary' ? actionColor : 'transparent';

    const borderColor = variant === 'outline' ? (off ? tokens.inputBorder : tone === 'danger' ? tokens.danger : tokens.accentBorder) : 'transparent';

    const textTone = tone === 'danger' ? 'danger' : 'accent';

    return (
        <TouchableOpacity
            {...pressableProps}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!off, busy: !!loading }}
            activeOpacity={0.76}
            onPress={onPress}
            disabled={!!off}
            style={{
                alignItems: 'center',
                backgroundColor: bg,
                borderColor,
                borderRadius: radii.control,
                borderWidth: variant === 'outline' ? 1 : 0,
                flexDirection: 'row',
                gap: spacing.sm,
                justifyContent: 'center',
                minHeight: Math.max(height, minimumTouchTarget),
                opacity: off ? 0.46 : 1,
                paddingHorizontal: size === 'compact' ? spacing.md : spacing.lg,
                paddingVertical: spacing.sm,
                width: fullWidth ? '100%' : undefined,
            }}
        >
            {loading ? (
                <ActivityIndicator size="small" color={variant === 'primary' ? primaryTextColor : actionTextColor} />
            ) : (
                <>
                    {leading}
                    <AppText variant="button" tone={textTone} style={variant === 'primary' ? { color: primaryTextColor } : undefined}>
                        {children}
                    </AppText>
                    {trailing}
                </>
            )}
        </TouchableOpacity>
    );
}
