import { useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { useTheme } from '@/shared/theme';

import { Icon, type IconName } from './Icon';

interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
    icon: IconName;
    accessibilityLabel: string;
    tone?: 'accent' | 'danger' | 'inverse';
    surface?: 'transparent' | 'overlay' | 'surface';
}

export function IconButton({ icon, accessibilityLabel, tone = 'accent', surface = 'transparent', disabled, ...props }: IconButtonProps) {
    const { minimumTouchTarget, radii, tokens } = useTheme();
    const color = tone === 'danger' ? tokens.danger : tone === 'inverse' ? tokens.inverseText : tokens.accentText;
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
                backgroundColor: pressed
                    ? tokens.surfacePressed
                    : surface === 'overlay'
                      ? tokens.overlay
                      : surface === 'surface'
                        ? tokens.surface
                        : 'transparent',
                borderColor: focused ? tokens.focus : surface === 'surface' ? tokens.separator : 'transparent',
                borderRadius: radii.control,
                borderWidth: focused ? 2 : surface === 'surface' ? 1 : 0,
                justifyContent: 'center',
                minHeight: minimumTouchTarget,
                minWidth: minimumTouchTarget,
                opacity: disabled ? 0.56 : 1,
            }}
        >
            <Icon name={icon} size={20} color={color} />
        </Pressable>
    );
}
