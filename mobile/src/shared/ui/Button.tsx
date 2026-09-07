import { ReactNode, useState } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';

type Variant = 'primary' | 'ghost' | 'outline';
type ButtonTone = 'accent' | 'danger';
type ButtonSize = 'compact' | 'default';

interface Props extends Omit<PressableProps, 'children' | 'disabled' | 'onPress' | 'style'> {
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
    const [focused, setFocused] = useState(false);
    const [pressed, setPressed] = useState(false);
    const pressedBackground = variant === 'primary' ? (tone === 'danger' ? tokens.danger : tokens.accentBorder) : tokens.surfacePressed;

    const control = (
        <Pressable
            {...pressableProps}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!off, busy: !!loading }}
            onPress={onPress}
            onFocus={event => {
                setFocused(true);
                pressableProps.onFocus?.(event);
            }}
            onBlur={event => {
                setFocused(false);
                pressableProps.onBlur?.(event);
            }}
            onPressIn={event => {
                setPressed(true);
                pressableProps.onPressIn?.(event);
            }}
            onPressOut={event => {
                setPressed(false);
                pressableProps.onPressOut?.(event);
            }}
            disabled={!!off}
            style={{
                alignItems: 'center',
                backgroundColor: off ? tokens.disabledSurface : pressed ? pressedBackground : bg,
                borderColor: focused ? tokens.focus : off && variant === 'primary' ? tokens.separator : borderColor,
                borderRadius: radii.control,
                borderWidth: focused ? 2 : variant === 'outline' || (off && variant === 'primary') ? 1 : 0,
                flexDirection: 'row',
                gap: spacing.sm,
                justifyContent: 'center',
                minHeight: Math.max(height, minimumTouchTarget),
                opacity: off ? 0.62 : 1,
                paddingHorizontal: size === 'compact' ? spacing.md : spacing.lg,
                paddingVertical: spacing.sm,
                width: fullWidth ? '100%' : undefined,
                ...(pressed && !off ? { transform: [{ scale: 0.985 }] } : {}),
            }}
        >
            {loading ? (
                <ActivityIndicator size="small" color={variant === 'primary' ? primaryTextColor : actionTextColor} />
            ) : (
                <>
                    {leading}
                    <AppText
                        variant="button"
                        tone={textTone}
                        style={off ? { color: tokens.disabled } : variant === 'primary' ? { color: primaryTextColor } : undefined}
                    >
                        {children}
                    </AppText>
                    {trailing}
                </>
            )}
        </Pressable>
    );

    return fullWidth ? <View style={{ alignSelf: 'stretch', width: '100%' }}>{control}</View> : control;
}
