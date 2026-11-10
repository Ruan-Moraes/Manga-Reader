import { useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { useTheme } from '@/shared/theme';

import { Icon } from './Icon';

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
    const [pressed, setPressed] = useState(false);
    const normalBackground = appearance === 'surface' ? tokens.surface : appearance === 'scrim' ? tokens.scrim : 'transparent';
    const iconColor = tone === 'inverse' ? tokens.inverseText : tone === 'neutral' ? tokens.text : tokens.accentText;

    return (
        <Pressable
            {...props}
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
                borderRadius: shape === 'control' ? radii.control : radii.pill,
                borderWidth: focused || appearance === 'surface' ? 1 : 0,
                justifyContent: 'center',
                height: BACK_BUTTON_SIZE,
                opacity: disabled ? 0.5 : 1,
                width: BACK_BUTTON_SIZE,
                ...(pressed && !disabled ? { transform: [{ scale: 0.96 }] } : {}),
            }}
        >
            <Icon name="chevron-back" size={20} color={iconColor} />
        </Pressable>
    );
}
