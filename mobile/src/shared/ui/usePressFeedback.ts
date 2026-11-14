import { useEffect } from 'react';
import { type GestureResponderEvent, type MouseEvent, Pressable } from 'react-native';
import Reanimated, { Easing, interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/shared/theme';

/** `Pressable` that accepts the animated style returned by `usePressFeedback`. */
export const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);

export interface PressFeedbackOptions {
    /** Background at rest. */
    background: string;
    /** Background while pressed; defaults to `background`. */
    pressedBackground?: string;
    /** Background under the pointer; defaults to `background`. */
    hoverBackground?: string;
    /** Scale while pressed (1 = no scale). */
    pressedScale?: number;
    /** Opacity multiplier while pressed (1 = no change). */
    pressedOpacity?: number;
    /** Opacity at rest (e.g. disabled). */
    opacity?: number;
    /** Resets the pressed and hover state, e.g. when the control is disabled. */
    disabled?: boolean;
}

export interface PressFeedbackHandlers {
    onPressIn?: ((event: GestureResponderEvent) => void) | null;
    onPressOut?: ((event: GestureResponderEvent) => void) | null;
    onHoverIn?: ((event: MouseEvent) => void) | null;
    onHoverOut?: ((event: MouseEvent) => void) | null;
}

/**
 * Press and hover feedback on the UI thread (plano de animações, etapa 2). Pressing is immediate; releasing and
 * hovering animate in `motion.fast`, which is 0 with reduced motion. The state lives in shared values, so a touch
 * does not re-render the component. Use with a `Reanimated.createAnimatedComponent(Pressable)`.
 */
export function usePressFeedback(
    {
        background,
        pressedBackground = background,
        hoverBackground = background,
        pressedScale = 1,
        pressedOpacity = 1,
        opacity = 1,
        disabled = false,
    }: PressFeedbackOptions,
    handlers: PressFeedbackHandlers = {},
) {
    const { motion } = useTheme();
    const pressed = useSharedValue(0);
    const hovered = useSharedValue(0);
    const duration = motion.fast;

    useEffect(() => {
        if (!disabled) return;
        pressed.value = 0;
        hovered.value = 0;
    }, [disabled, hovered, pressed]);

    const animatedStyle = useAnimatedStyle(() => {
        const resting = interpolateColor(hovered.value, [0, 1], [background, hoverBackground]);

        return {
            backgroundColor: interpolateColor(pressed.value, [0, 1], [resting, pressedBackground]),
            opacity: opacity * interpolate(pressed.value, [0, 1], [1, pressedOpacity]),
            transform: [{ scale: interpolate(pressed.value, [0, 1], [1, pressedScale]) }],
        };
    });

    const timing = (toValue: number) => withTiming(toValue, { duration, easing: Easing.out(Easing.quad) });

    return {
        animatedStyle,
        handlers: {
            onPressIn: (event: GestureResponderEvent) => {
                pressed.value = 1;
                handlers.onPressIn?.(event);
            },
            onPressOut: (event: GestureResponderEvent) => {
                pressed.value = timing(0);
                handlers.onPressOut?.(event);
            },
            onHoverIn: (event: MouseEvent) => {
                hovered.value = timing(1);
                handlers.onHoverIn?.(event);
            },
            onHoverOut: (event: MouseEvent) => {
                hovered.value = timing(0);
                handlers.onHoverOut?.(event);
            },
        },
    };
}
