import { useEffect } from 'react';
import { Animated, ViewStyle } from 'react-native';

import { MOTION_EASING, useTheme } from '@/shared/theme';

interface Props {
    width?: number | `${number}%`;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

const REST_OPACITY = 0.3;
const STATIC_OPACITY = 0.6;

/**
 * Relógio único (etapa 4 do plano de animações): todos os esqueletos montados leem o mesmo valor e um só laço roda,
 * em vez de um laço por esqueleto. Começa com o primeiro esqueleto e para quando o último sai da tela.
 */
const pulse = new Animated.Value(REST_OPACITY);
let subscribers = 0;
let loop: Animated.CompositeAnimation | null = null;

function subscribePulse(cycle: number) {
    subscribers += 1;
    if (!loop) {
        // `cycle` é o ciclo completo; cada metade (clarear, escurecer) leva a metade dele.
        const halfCycle = cycle / 2;
        loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: halfCycle, easing: MOTION_EASING.pulse, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: REST_OPACITY, duration: halfCycle, easing: MOTION_EASING.pulse, useNativeDriver: true }),
            ]),
        );
        loop.start();
    }
    return () => {
        subscribers -= 1;
        if (subscribers > 0) return;
        loop?.stop();
        loop = null;
        pulse.setValue(REST_OPACITY);
    };
}

/** Number of skeleton clocks running; exposed for tests. */
export const runningSkeletonClocks = () => (loop ? 1 : 0);

export function Skeleton({ width = '100%', height = 16, borderRadius, style }: Props) {
    const { decorativeMotionEnabled, motion, radii, tokens } = useTheme();

    useEffect(() => (decorativeMotionEnabled ? subscribePulse(motion.pulse) : undefined), [decorativeMotionEnabled, motion.pulse]);

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: borderRadius ?? radii.sm,
                    backgroundColor: tokens.surface,
                    opacity: decorativeMotionEnabled ? pulse : STATIC_OPACITY,
                },
                style,
            ]}
        />
    );
}
