import { forwardRef, type ReactNode, useState } from 'react';
import { type GestureResponderEvent, type MouseEvent, Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';

export type PressState = { pressed: boolean; hovered: boolean; focused: boolean };

export interface PressableBoxProps extends Omit<PressableProps, 'style' | 'children'> {
    style?: StyleProp<ViewStyle> | ((state: PressState) => StyleProp<ViewStyle>);
    children?: ReactNode | ((state: PressState) => ReactNode);
}

/**
 * `Pressable` whose `style`/`children` callbacks also work on device. With NativeWind 4 the interop wrapper drops
 * the `style` callback of React Native's `Pressable`, so the pressed, hovered (pointer on iPad or Mac) and focused
 * (keyboard) states are tracked here and the style is resolved before reaching the native component.
 */
export const PressableBox = forwardRef<View, PressableBoxProps>(function PressableBox(
    { style, children, onPressIn, onPressOut, onHoverIn, onHoverOut, onFocus, onBlur, ...props },
    ref,
) {
    const [pressed, setPressed] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const state: PressState = { pressed, hovered, focused };
    return (
        <Pressable
            ref={ref}
            {...props}
            onPressIn={(event: GestureResponderEvent) => {
                setPressed(true);
                onPressIn?.(event);
            }}
            onPressOut={(event: GestureResponderEvent) => {
                setPressed(false);
                onPressOut?.(event);
            }}
            onHoverIn={(event: MouseEvent) => {
                setHovered(true);
                onHoverIn?.(event);
            }}
            onHoverOut={(event: MouseEvent) => {
                setHovered(false);
                onHoverOut?.(event);
            }}
            onFocus={event => {
                setFocused(true);
                onFocus?.(event);
            }}
            onBlur={event => {
                setFocused(false);
                onBlur?.(event);
            }}
            style={typeof style === 'function' ? style(state) : style}
        >
            {typeof children === 'function' ? children(state) : children}
        </Pressable>
    );
});
