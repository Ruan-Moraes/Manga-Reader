import { forwardRef, type ReactNode, useState } from 'react';
import { type GestureResponderEvent, Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';

type PressState = { pressed: boolean; hovered?: boolean };

export interface PressableBoxProps extends Omit<PressableProps, 'style' | 'children'> {
    style?: StyleProp<ViewStyle> | ((state: PressState) => StyleProp<ViewStyle>);
    children?: ReactNode | ((state: PressState) => ReactNode);
}

/**
 * `Pressable` whose `style`/`children` callbacks also work on device. With NativeWind 4 the interop wrapper drops
 * the `style` callback of React Native's `Pressable`, so the pressed state is tracked here and the style is resolved
 * before reaching the native component.
 */
export const PressableBox = forwardRef<View, PressableBoxProps>(function PressableBox({ style, children, onPressIn, onPressOut, ...props }, ref) {
    const [pressed, setPressed] = useState(false);
    const state = { pressed };
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
            style={typeof style === 'function' ? style(state) : style}
        >
            {typeof children === 'function' ? children(state) : children}
        </Pressable>
    );
});
