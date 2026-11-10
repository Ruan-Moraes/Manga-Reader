import { useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { useTheme } from '@/shared/theme';

import { Icon, type IconName } from './Icon';

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
    const [pressed, setPressed] = useState(false);

    return (
        <Pressable
            {...props}
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
            onPressIn={event => {
                setPressed(true);
                props.onPressIn?.(event);
            }}
            onPressOut={event => {
                setPressed(false);
                props.onPressOut?.(event);
            }}
            hitSlop={4}
            style={{
                alignItems: 'center',
                backgroundColor:
                    pressed && !bare ? tokens.surfacePressed : surface === 'overlay' ? tokens.overlay : surface === 'surface' ? tokens.surface : 'transparent',
                borderColor: focused ? tokens.focus : surface === 'surface' ? tokens.separator : 'transparent',
                borderRadius: radii.control,
                borderWidth: focused ? 2 : surface === 'surface' ? 1 : 0,
                justifyContent: 'center',
                minHeight: minimumTouchTarget,
                minWidth: minimumTouchTarget,
                opacity: disabled ? 0.56 : bare && pressed ? 0.6 : 1,
            }}
        >
            <Icon name={icon} size={iconSize} color={color} />
        </Pressable>
    );
}
