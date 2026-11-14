import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import { MOTION_EASING, useTheme } from '@/shared/theme';

import { AppText } from './AppText';

interface LoadingBlockProps {
    label: string;
    inline?: boolean;
    testID?: string;
}

/** Below this wait nothing is drawn, so fast loads don't flash a spinner. */
export const LOADING_SHOW_DELAY_MS = 300;

const DOT_COUNT = 3;
const DOT_SIZE = 8;
const DOT_REST_OPACITY = 0.3;
const DOT_STATIC_OPACITY = 0.6;

/** Three dots pulsing in turn, on the same rhythm as `Skeleton`; still when decorative motion is off. */
function LoadingDots({ testID }: { testID: string }) {
    const { decorativeMotionEnabled, motion, spacing, tokens } = useTheme();
    const dots = useRef(Array.from({ length: DOT_COUNT }, () => new Animated.Value(DOT_REST_OPACITY))).current;

    useEffect(() => {
        if (!decorativeMotionEnabled) {
            dots.forEach(dot => dot.setValue(DOT_STATIC_OPACITY));
            return;
        }

        // Cada ponto clareia e escurece em `motion.pulse`; os três defasados em um sexto do ciclo.
        const halfCycle = motion.pulse / 2;
        const anim = Animated.loop(
            Animated.stagger(
                motion.pulse / 6,
                dots.map(dot =>
                    Animated.sequence([
                        Animated.timing(dot, { toValue: 1, duration: halfCycle, easing: MOTION_EASING.pulse, useNativeDriver: true }),
                        Animated.timing(dot, { toValue: DOT_REST_OPACITY, duration: halfCycle, easing: MOTION_EASING.pulse, useNativeDriver: true }),
                    ]),
                ),
            ),
        );
        anim.start();
        return () => anim.stop();
    }, [decorativeMotionEnabled, dots, motion.pulse]);

    return (
        <View testID={testID} style={{ flexDirection: 'row', gap: spacing.xs + 2 }}>
            {dots.map((opacity, index) => (
                <Animated.View key={index} style={{ backgroundColor: tokens.accent, borderRadius: DOT_SIZE / 2, height: DOT_SIZE, opacity, width: DOT_SIZE }} />
            ))}
        </View>
    );
}

/** Loading state for content whose shape is unknown; announced as status right away, drawn only after a short wait. */
export function LoadingBlock({ label, inline = false, testID = 'loading-block' }: LoadingBlockProps) {
    const { decorativeMotionEnabled, layout, motion, spacing } = useTheme();
    const visibility = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // O atraso vale mesmo sem animações: é contra o piscar, não enfeite. Só o fade some.
        const reveal = Animated.sequence([
            Animated.delay(LOADING_SHOW_DELAY_MS),
            Animated.timing(visibility, {
                toValue: 1,
                duration: decorativeMotionEnabled ? motion.base : 0,
                easing: MOTION_EASING.enter,
                useNativeDriver: true,
            }),
        ]);
        reveal.start();
        return () => reveal.stop();
    }, [decorativeMotionEnabled, motion.base, visibility]);

    return (
        <View
            testID={testID}
            accessible
            accessibilityLabel={label}
            accessibilityLiveRegion="polite"
            role="status"
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                ...(inline
                    ? { paddingHorizontal: layout.screenGutter, paddingVertical: spacing.xl }
                    : { flex: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing['2xl'] }),
            }}
        >
            <Animated.View testID={`${testID}-content`} style={{ alignItems: 'center', gap: spacing.md, opacity: visibility }}>
                <LoadingDots testID={`${testID}-dots`} />
                <AppText variant="caption" tone="subtle" style={{ textAlign: 'center' }}>
                    {label}
                </AppText>
            </Animated.View>
        </View>
    );
}
