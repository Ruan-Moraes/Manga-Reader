import { useState } from 'react';
import { type PressableProps } from 'react-native';

import { useTheme } from '@/shared/theme';

import { Icon } from './Icon';
import { AnimatedPressable, usePressFeedback } from './usePressFeedback';

const BACK_BUTTON_SIZE = 40;

export type BackButtonAppearance = 'transparent' | 'surface' | 'scrim';
export type BackButtonTone = 'default' | 'inverse' | 'neutral';
export type BackButtonShape = 'pill' | 'control';

interface BackButtonProps extends Omit<PressableProps, 'accessibilityLabel' | 'children' | 'style'> {
    accessibilityLabel: string;
    appearance?: BackButtonAppearance;
    tone?: BackButtonTone;
    shape?: BackButtonShape;
}

// Padrão único (2026-11-09): quadrado com fundo e borda, igual ao botão de fechar das folhas.
export function BackButton({ accessibilityLabel, appearance = 'surface', tone = 'default', shape = 'control', disabled, ...props }: BackButtonProps) {
    const { minimumTouchTarget, radii, tokens } = useTheme();
    const [focused, setFocused] = useState(false);
    const normalBackground = appearance === 'surface' ? tokens.surface : appearance === 'scrim' ? tokens.scrim : 'transparent';
    const feedback = usePressFeedback(
        {
            background: normalBackground,
            pressedBackground: appearance === 'scrim' ? tokens.overlay : tokens.surfacePressed,
            hoverBackground: appearance === 'scrim' ? tokens.overlay : tokens.surfaceHover,
            pressedScale: disabled ? 1 : 0.97,
            opacity: disabled ? 0.5 : 1,
            disabled: !!disabled,
        },
        props,
    );
    const iconColor = tone === 'inverse' ? tokens.inverseText : tone === 'neutral' ? tokens.text : tokens.accentText;

    return (
        <AnimatedPressable
            {...props}
            {...feedback.handlers}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!disabled }}
            disabled={disabled}
            // Compact visual box; the hit area still reaches the platform minimum touch target.
            hitSlop={Math.max(4, (minimumTouchTarget - BACK_BUTTON_SIZE) / 2)}
            onBlur={event => {
                setFocused(false);
                props.onBlur?.(event);
            }}
            onFocus={event => {
                setFocused(true);
                props.onFocus?.(event);
            }}
            style={[
                {
                    alignItems: 'center',
                    borderColor: focused ? tokens.focus : appearance === 'surface' ? tokens.separator : 'transparent',
                    borderRadius: shape === 'control' ? radii.control : radii.pill,
                    borderWidth: focused || appearance === 'surface' ? 1 : 0,
                    justifyContent: 'center',
                    height: BACK_BUTTON_SIZE,
                    width: BACK_BUTTON_SIZE,
                },
                feedback.animatedStyle,
            ]}
        >
            <Icon name="chevron-back" size={20} color={iconColor} />
        </AnimatedPressable>
    );
}
