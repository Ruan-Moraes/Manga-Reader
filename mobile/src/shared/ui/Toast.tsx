import { type ReactNode, useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type ToastTone = 'accent' | 'success' | 'danger' | 'neutral';

interface ToastProps {
    tone?: ToastTone;
    title: string;
    description?: string;
    /** An icon name, or "progress" for a spinner (work still running). */
    icon?: IconName | 'progress';
    /** Auto-dismiss after this many ms; 0 keeps it until dismissed. */
    duration?: number;
    onDismiss?(): void;
    testID?: string;
}

/** Same width as the web toast viewport (`w-[360px]`), never wider than the screen minus the gutters. */
const TOAST_WIDTH = 360;
const DEFAULT_ICON: Record<ToastTone, IconName> = { accent: 'checkmark', success: 'checkmark', danger: 'warning', neutral: 'information' };

/**
 * The web app's toast (`shared/ui/toast` in web/apps/toonlira) on mobile: docked to the bottom right of the screen,
 * a surface card with a tone-coloured left edge, an icon in a tonal square, a bold title, an optional description and
 * a dismiss button. It slides in (immediately with Reduce Motion) and, with a duration, dismisses itself.
 */
export function Toast({ tone = 'neutral', title, description, icon, duration = 4000, onDismiss, testID = 'toast' }: ToastProps) {
    const { t } = useTranslation('common');
    const { tokens, spacing, radii, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const reducedMotion = useReducedMotion();
    const enter = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
    const dismissRef = useRef(onDismiss);
    dismissRef.current = onDismiss;

    useEffect(() => {
        if (reducedMotion) return undefined;
        const animation = Animated.timing(enter, { toValue: 1, duration: 200, useNativeDriver: true });
        animation.start();
        return () => animation.stop();
    }, [enter, reducedMotion]);

    useEffect(() => {
        if (!duration) return undefined;
        const timer = setTimeout(() => dismissRef.current?.(), duration);
        return () => clearTimeout(timer);
    }, [duration, title, description]);

    const edge = tone === 'danger' ? tokens.danger : tone === 'neutral' ? tokens.tertiary : tokens.accent;
    const chip = tone === 'accent' || tone === 'success' ? tokens.accentSoft : tokens.surfaceMuted;
    const iconColor = tone === 'danger' ? tokens.danger : tone === 'neutral' ? tokens.muted : tokens.accentText;
    let glyph: ReactNode;
    if (icon === 'progress') glyph = <ActivityIndicator size="small" color={iconColor} />;
    else glyph = <Icon name={icon ?? DEFAULT_ICON[tone]} size={16} color={iconColor} />;

    return (
        <View
            testID={`${testID}-dock`}
            pointerEvents="box-none"
            style={{
                position: 'absolute',
                right: insets.right + spacing.md,
                bottom: insets.bottom + spacing.md,
                width: Math.min(TOAST_WIDTH, width - insets.left - insets.right - spacing.md * 2),
            }}
        >
            <Animated.View
                testID={testID}
                accessibilityRole={tone === 'danger' ? 'alert' : 'text'}
                accessibilityLiveRegion="polite"
                style={{
                    opacity: enter,
                    transform: [{ translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                    flexDirection: 'row',
                    alignItems: description ? 'flex-start' : 'center',
                    gap: spacing.sm,
                    paddingVertical: spacing.sm,
                    paddingLeft: spacing.sm,
                    paddingRight: spacing.xs,
                    borderRadius: radii.sm,
                    borderWidth: 1,
                    borderLeftWidth: 3,
                    borderColor: tokens.separator,
                    borderLeftColor: edge,
                    backgroundColor: tokens.surface,
                    shadowColor: '#000',
                    shadowOpacity: 0.18,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                }}
            >
                <View style={{ width: 28, height: 28, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: chip }}>
                    {glyph}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText style={{ fontSize: typography.small, fontWeight: '700', color: tokens.text }}>{title}</AppText>
                    {description ? <AppText style={{ fontSize: typography.small, color: tokens.muted }}>{description}</AppText> : null}
                </View>
                {onDismiss ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('toast.dismiss')}
                        hitSlop={8}
                        onPress={onDismiss}
                        style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm }}
                    >
                        <Icon name="close" size={16} color={tokens.subtle} />
                    </Pressable>
                ) : null}
            </Animated.View>
        </View>
    );
}
