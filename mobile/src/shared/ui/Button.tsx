import { ReactNode, useState } from 'react';
import { ActivityIndicator, type PressableProps, View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { AnimatedPressable, usePressFeedback } from './usePressFeedback';

type Variant = 'primary' | 'ghost' | 'outline';
/** `neutral`: secondary actions such as cancel, so they never compete with the main action. */
type ButtonTone = 'accent' | 'danger' | 'neutral';
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
    singleLine?: boolean;
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
    singleLine = false,
    ...pressableProps
}: Props) {
    const { layout, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const off = loading || disabled;
    const actionColor = tone === 'danger' ? tokens.danger : tone === 'neutral' ? tokens.text : tokens.accent;
    const actionTextColor = tone === 'danger' ? tokens.danger : tone === 'neutral' ? tokens.text : tokens.accentText;
    const primaryTextColor = tone === 'accent' ? tokens.onAccent : tokens.inverseText;
    const height = size === 'compact' ? layout.compactControlHeight : layout.controlHeight;

    const bg = variant === 'primary' ? actionColor : 'transparent';

    const borderColor =
        variant === 'outline' ? (off || tone === 'neutral' ? tokens.inputBorder : tone === 'danger' ? tokens.danger : tokens.accentBorder) : 'transparent';

    const textTone = tone === 'danger' ? 'danger' : tone === 'neutral' ? 'default' : 'accent';
    const [focused, setFocused] = useState(false);
    const pressedBackground = variant === 'primary' ? (tone === 'accent' ? tokens.accentBorder : actionColor) : tokens.surfacePressed;
    // Primário: o hover usa o mesmo tom do pressionado (um cinza claro sobre a cor de destaque não serve).
    const hoverBackground = variant === 'primary' ? pressedBackground : tokens.surfaceHover;
    const feedback = usePressFeedback(
        {
            background: off ? tokens.disabledSurface : bg,
            pressedBackground: off ? tokens.disabledSurface : pressedBackground,
            hoverBackground: off ? tokens.disabledSurface : hoverBackground,
            pressedScale: off ? 1 : 0.97,
            opacity: off ? 0.62 : 1,
            disabled: !!off,
        },
        pressableProps,
    );

    const control = (
        <AnimatedPressable
            {...pressableProps}
            {...feedback.handlers}
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
            disabled={!!off}
            style={[
                {
                    alignItems: 'center',
                    borderColor: focused ? tokens.focus : off && variant === 'primary' ? tokens.separator : borderColor,
                    borderRadius: radii.control,
                    borderWidth: focused ? 2 : variant === 'outline' || (off && variant === 'primary') ? 1 : 0,
                    flexDirection: 'row',
                    gap: spacing.sm,
                    justifyContent: 'center',
                    minHeight: Math.max(height, minimumTouchTarget),
                    paddingHorizontal: size === 'compact' ? spacing.md : spacing.lg,
                    paddingVertical: spacing.sm,
                    width: fullWidth ? '100%' : undefined,
                },
                feedback.animatedStyle,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={variant === 'primary' ? primaryTextColor : actionTextColor} />
            ) : (
                <>
                    {leading}
                    <AppText
                        variant="button"
                        tone={textTone}
                        numberOfLines={singleLine ? 1 : undefined}
                        adjustsFontSizeToFit={singleLine}
                        minimumFontScale={singleLine ? 0.75 : undefined}
                        style={{
                            width: fullWidth && !leading && !trailing ? '100%' : undefined,
                            flexShrink: 1,
                            textAlign: 'center',
                            color: off ? tokens.disabled : variant === 'primary' ? primaryTextColor : actionTextColor,
                        }}
                    >
                        {children}
                    </AppText>
                    {trailing}
                </>
            )}
        </AnimatedPressable>
    );

    return fullWidth ? <View style={{ alignSelf: 'stretch', width: '100%' }}>{control}</View> : control;
}
