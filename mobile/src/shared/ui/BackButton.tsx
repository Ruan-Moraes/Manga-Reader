import { useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { useTheme } from '@/shared/theme';

import { Icon } from './Icon';

export type BackButtonAppearance = 'transparent' | 'surface' | 'scrim';
export type BackButtonTone = 'default' | 'inverse';

interface BackButtonProps extends Omit<PressableProps, 'accessibilityLabel' | 'children' | 'style'> {
    accessibilityLabel: string;
    appearance?: BackButtonAppearance;
    tone?: BackButtonTone;
}

export function BackButton({ accessibilityLabel, appearance = 'transparent', tone = 'default', disabled, ...props }: BackButtonProps) {
    const { minimumTouchTarget, radii, tokens } = useTheme();
    const [focused, setFocused] = useState(false);
    const [pressed, setPressed] = useState(false);
    const normalBackground = appearance === 'surface' ? tokens.surfaceElevated : appearance === 'scrim' ? tokens.scrim : 'transparent';
    const iconColor = tone === 'inverse' ? tokens.inverseText : tokens.accentText;

    return (
        <Pressable
            {...props}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!disabled }}
            disabled={disabled}
            hitSlop={4}
            onBlur={event => {
                setFocused(false);
                props.onBlur?.(event);
            }}
            onFocus={event => {
                setFocused(true);
                props.onFocus?.(event);
            }}
            onPressIn={event => {
                setPressed(true);
                props.onPressIn?.(event);
            }}
            onPressOut={event => {
                setPressed(false);
                props.onPressOut?.(event);
            }}
            style={{
                alignItems: 'center',
                backgroundColor: pressed ? (appearance === 'scrim' ? tokens.overlay : tokens.surfacePressed) : normalBackground,
                borderColor: focused ? tokens.focus : appearance === 'surface' ? tokens.separator : 'transparent',
                borderRadius: radii.pill,
                borderWidth: focused || appearance === 'surface' ? 1 : 0,
                justifyContent: 'center',
                minHeight: minimumTouchTarget,
                minWidth: minimumTouchTarget,
                opacity: disabled ? 0.5 : 1,
                ...(pressed && !disabled ? { transform: [{ scale: 0.96 }] } : {}),
            }}
        >
            <Icon name="chevron-back" size={22} color={iconColor} />
        </Pressable>
    );
}
