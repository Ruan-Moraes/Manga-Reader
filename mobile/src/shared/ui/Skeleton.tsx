import { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

import { useTheme } from '@/src/shared/theme';

interface Props {
    width?: number | `${number}%`;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius, style }: Props) {
    const { tokens } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
            ]),
        );
        anim.start();
        return () => anim.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: borderRadius ?? tokens.radius,
                    backgroundColor: tokens.surface,
                    opacity,
                },
                style,
            ]}
        />
    );
}
