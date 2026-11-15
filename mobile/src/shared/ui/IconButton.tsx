import { useState } from 'react';
import { type PressableProps } from 'react-native';

import { useTheme } from '@/shared/theme';

import { Icon, type IconName } from './Icon';
import { AnimatedPressable, usePressFeedback } from './usePressFeedback';

interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
    icon: IconName;
    accessibilityLabel: string;
    /** `default` uses the text color (reader bars, 063/D20). */
    tone?: 'accent' | 'danger' | 'inverse' | 'default';
    iconSize?: number;
    /** Sem fundo ao pressionar (ex.: "⋯" dos cartões); o retorno vem pela opacidade. */
    bare?: boolean;
    surface?: 'transparent' | 'overlay' | 'surface';
}

export function IconButton({
    icon,
    accessibilityLabel,
    tone = 'accent',
    iconSize = 20,
    surface = 'transparent',
    bare = false,
    disabled,
    ...props
}: IconButtonProps) {
    const { minimumTouchTarget, radii, tokens } = useTheme();

    const color = tone === 'danger' ? tokens.danger : tone === 'inverse' ? tokens.inverseText : tone === 'default' ? tokens.text : tokens.accentText;

    const [focused, setFocused] = useState(false);
    const restingBackground = surface === 'overlay' ? tokens.overlay : surface === 'surface' ? tokens.surface : 'transparent';
    // Sem fundo (`bare`): o toque responde pela opacidade; o hover desenha um círculo atrás do ícone.
    const feedback = usePressFeedback(
        {
            background: restingBackground,
            pressedBackground: bare ? restingBackground : tokens.surfacePressed,
            hoverBackground: tokens.surfaceHover,
            pressedScale: bare || disabled ? 1 : 0.97,
            pressedOpacity: bare ? 0.6 : 1,
            opacity: disabled ? 0.56 : 1,
            disabled: !!disabled,
        },
        props,
    );

    return (
        <AnimatedPressable
            {...props}
            {...feedback.handlers}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!disabled }}
            disabled={disabled}
            onFocus={event => {
                setFocused(true);
                props.onFocus?.(event);
            }}
            onBlur={event => {
                setFocused(false);
                props.onBlur?.(event);
            }}
            hitSlop={4}
            style={[
                {
                    alignItems: 'center',
                    borderColor: focused ? tokens.focus : surface === 'surface' ? tokens.separator : 'transparent',
                    borderRadius: bare ? radii.pill : radii.control,
                    borderWidth: focused ? 2 : surface === 'surface' ? 1 : 0,
                    justifyContent: 'center',
                    minHeight: minimumTouchTarget,
                    minWidth: minimumTouchTarget,
                },
                feedback.animatedStyle,
            ]}
        >
            <Icon name={icon} size={iconSize} color={color} />
        </AnimatedPressable>
    );
}
