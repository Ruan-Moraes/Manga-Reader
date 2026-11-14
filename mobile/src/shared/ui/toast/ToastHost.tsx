import { useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, PanResponder, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { createShadowStyle, MOTION_EASING, useTheme } from '@/shared/theme';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { PressableBox } from '../PressableBox';
import { toastDuration, useToastStore } from './toastStore';

/**
 * Docks the current toast below the top controls at the right edge. Mounted once in the app
 * providers. Hides itself after a few seconds (longer for errors), on tap or when swiped right. It leaves through the
 * right edge it is docked to: slides fully off screen, shrinking slightly and fading only at the end. The last message
 * is kept locally so it stays visible while the exit animation plays.
 */

/** Share of the toast width (or fling speed) a rightward swipe needs to dismiss it. */
const SWIPE_DISMISS_RATIO = 0.35;
const SWIPE_DISMISS_VELOCITY = 0.5;

/** Whether a released rightward swipe should dismiss the toast instead of springing it back. */
export function shouldDismissSwipe(dx: number, vx: number, width: number): boolean {
    return dx > width * SWIPE_DISMISS_RATIO || (dx > 0 && vx > SWIPE_DISMISS_VELOCITY);
}

export function ToastHost() {
    const current = useToastStore(state => state.current);
    const dismiss = useToastStore(state => state.dismiss);
    const { effectiveReduceMotion, layout, metrics, motion, radii, spacing, tokens } = useTheme();
    const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0, left: 0, right: 0, top: 0 };
    const progress = useRef(new Animated.Value(0)).current;
    const exit = useRef(new Animated.Value(0)).current;
    const drag = useRef(new Animated.Value(0)).current;
    const [width, setWidth] = useState(340);
    const [shown, setShown] = useState(current);
    const leaving = current === null;

    useEffect(() => {
        if (current) {
            exit.stopAnimation();
            exit.setValue(0);
            drag.setValue(0);
            setShown(current);
            return;
        }
        if (effectiveReduceMotion) {
            setShown(null);
            return;
        }
        const animation = Animated.timing(exit, { toValue: 1, duration: motion.exit, easing: MOTION_EASING.exit, useNativeDriver: true });
        animation.start(({ finished }) => {
            if (finished) setShown(null);
        });
        return () => animation.stop();
    }, [current, drag, effectiveReduceMotion, exit, motion.exit]);

    useEffect(() => {
        if (!current) return;
        const text = current.description ? `${current.title}. ${current.description}` : current.title;
        AccessibilityInfo.announceForAccessibility(text);
        progress.setValue(effectiveReduceMotion ? 1 : 0);
        if (!effectiveReduceMotion) {
            Animated.timing(progress, { toValue: 1, duration: motion.base, easing: MOTION_EASING.enter, useNativeDriver: true }).start();
        }
        const timer = setTimeout(() => dismiss(current.id), toastDuration(current.tone));
        return () => clearTimeout(timer);
    }, [current, dismiss, effectiveReduceMotion, motion.base, progress]);

    const widthRef = useRef(width);
    widthRef.current = width;
    const swipe = useRef(
        PanResponder.create({
            // Claims only a clearly horizontal rightward drag, so taps still reach the toast.
            onMoveShouldSetPanResponder: (_, g) => g.dx > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
            onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dx)),
            onPanResponderRelease: (_, g) => {
                const id = useToastStore.getState().current?.id;
                if (id !== undefined && shouldDismissSwipe(g.dx, g.vx, widthRef.current)) {
                    dismiss(id);
                    return;
                }
                Animated.spring(drag, { toValue: 0, bounciness: 6, useNativeDriver: true }).start();
            },
            onPanResponderTerminate: () => Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start(),
        }),
    ).current;

    const toast = current ?? shown;
    if (!toast) return null;

    const color =
        toast.tone === 'danger' ? tokens.danger : toast.tone === 'warning' ? tokens.warn : toast.tone === 'success' ? tokens.success : tokens.accentText;
    const iconBackground =
        toast.tone === 'danger'
            ? tokens.dangerSoft
            : toast.tone === 'warning'
              ? tokens.warnSoft
              : toast.tone === 'success'
                ? tokens.successSoft
                : tokens.accentSoft;
    const icon: IconName =
        toast.tone === 'danger'
            ? 'alert-circle'
            : toast.tone === 'warning'
              ? 'warning'
              : toast.tone === 'success'
                ? 'checkmark-circle'
                : 'information-circle';

    return (
        <View
            testID="toast-layer"
            pointerEvents={leaving ? 'none' : 'box-none'}
            style={{
                alignItems: 'flex-end',
                left: insets.left + layout.screenGutter,
                position: 'absolute',
                right: insets.right,
                top: insets.top + layout.controlHeight + spacing.sm,
            }}
        >
            <Animated.View
                {...swipe.panHandlers}
                onLayout={event => setWidth(event.nativeEvent.layout.width)}
                style={{
                    maxWidth: 340,
                    opacity: Animated.multiply(
                        progress,
                        Animated.multiply(
                            exit.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.85, 0] }),
                            drag.interpolate({ inputRange: [0, width], outputRange: [1, 0.4], extrapolate: 'clamp' }),
                        ),
                    ),
                    transform: [
                        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-spacing.md, 0] }) },
                        // Fully off screen: the toast's own width plus the right inset it sits against.
                        { translateX: Animated.add(drag, exit.interpolate({ inputRange: [0, 1], outputRange: [0, width + insets.right + spacing.md] })) },
                        { scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }) },
                    ],
                    width: '100%',
                }}
            >
                <PressableBox
                    testID="toast"
                    accessibilityRole={toast.tone === 'danger' ? 'alert' : 'summary'}
                    accessibilityLiveRegion={toast.tone === 'danger' ? 'assertive' : 'polite'}
                    accessibilityLabel={toast.description ? `${toast.title}. ${toast.description}` : toast.title}
                    onPress={() => dismiss(toast.id)}
                    style={({ pressed }) => ({
                        alignItems: 'center',
                        backgroundColor: pressed ? tokens.surfacePressed : tokens.surfaceElevated,
                        borderBottomLeftRadius: radii.card,
                        borderColor: tokens.borderStrong,
                        borderLeftColor: color,
                        borderLeftWidth: 3,
                        borderRightWidth: 0,
                        borderTopLeftRadius: radii.card,
                        borderWidth: 1,
                        flexDirection: 'row',
                        gap: spacing.sm,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.md,
                        ...createShadowStyle('card', tokens.overlay),
                    })}
                >
                    <View
                        style={{
                            alignItems: 'center',
                            backgroundColor: iconBackground,
                            borderRadius: radii.pill,
                            height: 32,
                            justifyContent: 'center',
                            width: 32,
                        }}
                    >
                        <Icon name={icon} size={metrics.icon.md} color={color} decorative />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="label">{toast.title}</AppText>
                        {toast.description ? (
                            <AppText variant="caption" tone="muted">
                                {toast.description}
                            </AppText>
                        ) : null}
                    </View>
                </PressableBox>
            </Animated.View>
        </View>
    );
}
