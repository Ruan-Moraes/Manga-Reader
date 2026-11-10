import { useContext, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { createShadowStyle, useTheme } from '@/shared/theme';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { toastDuration, useToastStore } from './toastStore';

/**
 * Renders the current toast floating under the status bar; it never moves the screen's layout. Mounted once in the app
 * providers. Hides itself after a few seconds (longer for errors) or on tap.
 */
export function ToastHost() {
    const current = useToastStore(state => state.current);
    const dismiss = useToastStore(state => state.dismiss);
    const { effectiveReduceMotion, metrics, motion, radii, spacing, tokens } = useTheme();
    const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0, left: 0, right: 0, top: 0 };
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!current) return;
        const text = current.description ? `${current.title}. ${current.description}` : current.title;
        AccessibilityInfo.announceForAccessibility(text);
        progress.setValue(effectiveReduceMotion ? 1 : 0);
        if (!effectiveReduceMotion) {
            Animated.timing(progress, { toValue: 1, duration: motion.base, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
        }
        const timer = setTimeout(() => dismiss(current.id), toastDuration(current.tone));
        return () => clearTimeout(timer);
    }, [current, dismiss, effectiveReduceMotion, motion.base, progress]);

    if (!current) return null;

    const color =
        current.tone === 'danger' ? tokens.danger : current.tone === 'warning' ? tokens.warn : current.tone === 'success' ? tokens.success : tokens.accentText;
    const icon: IconName =
        current.tone === 'danger'
            ? 'alert-circle'
            : current.tone === 'warning'
              ? 'warning'
              : current.tone === 'success'
                ? 'checkmark-circle'
                : 'information-circle';

    return (
        <View pointerEvents="box-none" style={{ left: 0, position: 'absolute', right: 0, top: insets.top + spacing.sm, alignItems: 'center' }}>
            <Animated.View
                style={{
                    maxWidth: 480,
                    opacity: progress,
                    paddingHorizontal: spacing.md,
                    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-spacing.md, 0] }) }],
                    width: '100%',
                }}
            >
                <Pressable
                    testID="toast"
                    accessibilityRole={current.tone === 'danger' ? 'alert' : 'summary'}
                    accessibilityLiveRegion={current.tone === 'danger' ? 'assertive' : 'polite'}
                    accessibilityLabel={current.description ? `${current.title}. ${current.description}` : current.title}
                    onPress={() => dismiss(current.id)}
                    style={{
                        alignItems: 'center',
                        backgroundColor: tokens.surfaceElevated,
                        borderColor: tokens.borderStrong,
                        borderLeftColor: color,
                        borderLeftWidth: 3,
                        borderRadius: radii.control,
                        borderWidth: 1,
                        flexDirection: 'row',
                        gap: spacing.sm,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm + 2,
                        ...createShadowStyle('card', tokens.overlay),
                    }}
                >
                    <Icon name={icon} size={metrics.icon.md} color={color} decorative />
                    <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="label">{current.title}</AppText>
                        {current.description ? (
                            <AppText variant="caption" tone="muted">
                                {current.description}
                            </AppText>
                        ) : null}
                    </View>
                </Pressable>
            </Animated.View>
        </View>
    );
}
