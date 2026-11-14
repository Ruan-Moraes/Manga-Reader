import { useContext, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { createShadowStyle, MOTION_EASING, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { useKeyboardOverlap } from './useKeyboardInset';

export const CENTER_DIALOG_MAX_WIDTH = 400;

export type CenterDialogTone = 'accent' | 'danger' | 'success' | 'warning';

export interface CenterDialogTestIDs {
    layer: string;
    backdrop: string;
    card: string;
    header: string;
    icon: string;
    actions: string;
}

const DEFAULT_TEST_IDS: CenterDialogTestIDs = {
    layer: 'center-dialog-layer',
    backdrop: 'center-dialog-backdrop',
    card: 'center-dialog',
    header: 'center-dialog-header',
    icon: 'center-dialog-icon',
    actions: 'center-dialog-actions',
};

export interface CenterDialogProps {
    visible: boolean;
    /** Scrim, Android back and the screen reader escape gesture; never confirms. */
    onClose: () => void;
    /** Accessible label of the scrim. */
    closeLabel: string;
    title: string;
    description?: string;
    icon?: IconName;
    tone?: CenterDialogTone;
    children?: ReactNode;
    /** Buttons, cancel first; laid out side by side and stacked when they do not fit. */
    actions?: ReactNode;
    /** Stack the actions (long labels, three actions). */
    stackActions?: boolean;
    contentBottomSpacing?: number;
    /** Line under the header; defaults to on only when there is content between the header and the actions. */
    showHeaderDivider?: boolean;
    testIDs?: Partial<CenterDialogTestIDs>;
}

/**
 * Centered modal for confirmations and consent (2026-11-10). Visual rhythm shared by every dialog: card padding `lg`,
 * 16 between content and actions, 4 between stacked actions; icon tile 48 on the tone's soft surface; title `section`,
 * description `body` muted. Content scrolls inside the card when it is taller than the free space (keyboard included).
 */
export function CenterDialog({
    visible,
    onClose,
    closeLabel,
    title,
    description,
    icon,
    tone = 'accent',
    children,
    actions,
    stackActions = false,
    contentBottomSpacing,
    showHeaderDivider: headerDivider,
    testIDs,
}: CenterDialogProps) {
    const { effectiveReduceMotion, fontScale, metrics, motion, radii, spacing, tokens } = useTheme();
    const { height: viewportHeight } = useWindowDimensions();
    const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0, left: 0, right: 0, top: 0 };
    const { overlap: keyboard, onLayerLayout } = useKeyboardOverlap();
    const ids = { ...DEFAULT_TEST_IDS, ...testIDs };
    const color = tone === 'danger' ? tokens.danger : tone === 'success' ? tokens.success : tone === 'warning' ? tokens.warn : tokens.accentText;
    const soft = tone === 'danger' ? tokens.dangerSoft : tone === 'success' ? tokens.successSoft : tone === 'warning' ? tokens.warnSoft : tokens.accentSoft;
    const maxHeight = Math.max(0, viewportHeight - insets.top - Math.max(insets.bottom, keyboard) - spacing.xl * 2);
    const stacked = stackActions || fontScale > 1.3;
    const showHeaderDivider = headerDivider ?? (children != null && children !== false);

    const [mounted, setMounted] = useState(visible);
    const progress = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (visible) setMounted(true);
        if (effectiveReduceMotion) {
            progress.setValue(visible ? 1 : 0);
            if (!visible) setMounted(false);
            return;
        }
        const animation = Animated.timing(progress, {
            toValue: visible ? 1 : 0,
            duration: visible ? motion.base : motion.exit,
            easing: visible ? MOTION_EASING.enter : MOTION_EASING.exit,
            useNativeDriver: true,
        });
        animation.start(({ finished }) => {
            if (finished && !visible) setMounted(false);
        });
        return () => animation.stop();
    }, [effectiveReduceMotion, motion.base, motion.exit, progress, visible]);

    return (
        <Modal animationType="none" navigationBarTranslucent onRequestClose={onClose} statusBarTranslucent transparent visible={mounted || visible}>
            <View
                testID={ids.layer}
                accessibilityViewIsModal={visible}
                accessibilityElementsHidden={!visible}
                importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
                onAccessibilityEscape={onClose}
                onLayout={onLayerLayout}
                pointerEvents={visible ? 'auto' : 'none'}
                style={{
                    alignItems: 'center',
                    flex: 1,
                    justifyContent: 'center',
                    paddingBottom: Math.max(insets.bottom, keyboard) + spacing.md,
                    paddingHorizontal: spacing.md + Math.max(insets.left, insets.right),
                    paddingTop: insets.top + spacing.md,
                }}
            >
                <Animated.View pointerEvents="box-none" style={{ bottom: 0, left: 0, opacity: progress, position: 'absolute', right: 0, top: 0 }}>
                    <Pressable
                        testID={ids.backdrop}
                        // The dialog's own cancel button and the escape gesture close it for screen readers.
                        accessible={false}
                        accessibilityLabel={closeLabel}
                        onPress={onClose}
                        style={{ backgroundColor: tokens.scrim, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
                    />
                </Animated.View>
                <Animated.View
                    testID={ids.card}
                    style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.separator,
                        borderRadius: radii.feature,
                        borderWidth: 1,
                        maxHeight,
                        maxWidth: CENTER_DIALOG_MAX_WIDTH,
                        opacity: progress,
                        overflow: 'hidden',
                        transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
                        width: '100%',
                        ...createShadowStyle('sheet', tokens.overlay),
                    }}
                >
                    <ScrollView
                        showsHorizontalScrollIndicator={false}
                        bounces={false}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        style={{ flexShrink: 1 }}
                        contentContainerStyle={{
                            gap: spacing.md,
                            padding: spacing.lg,
                            paddingBottom: contentBottomSpacing ?? (actions ? spacing.md : spacing.lg),
                        }}
                    >
                        <View
                            testID={ids.header}
                            style={{
                                alignItems: 'center',
                                borderBottomColor: tokens.separator,
                                borderBottomWidth: showHeaderDivider ? 1 : 0,
                                gap: spacing.sm,
                                paddingBottom: showHeaderDivider ? spacing.md : 0,
                                paddingTop: icon ? spacing.xs : 0,
                            }}
                        >
                            {icon ? (
                                <View
                                    testID={ids.icon}
                                    style={{
                                        alignItems: 'center',
                                        backgroundColor: soft,
                                        borderRadius: radii.pill,
                                        height: metrics.iconTile.feature,
                                        justifyContent: 'center',
                                        width: metrics.iconTile.feature,
                                    }}
                                >
                                    <Icon name={icon} size={metrics.icon.lg} color={color} decorative />
                                </View>
                            ) : null}
                            <AppText accessibilityRole="header" variant="section" style={{ marginTop: icon ? spacing.xs : 0, textAlign: 'center' }}>
                                {title}
                            </AppText>
                            {description ? (
                                <AppText tone="muted" style={{ textAlign: 'center' }}>
                                    {description}
                                </AppText>
                            ) : null}
                        </View>
                        {children}
                    </ScrollView>
                    {actions ? (
                        <View
                            testID={ids.actions}
                            style={{
                                flexDirection: stacked ? 'column-reverse' : 'row',
                                gap: stacked ? spacing.xs : spacing.sm,
                                paddingBottom: spacing.lg,
                                paddingHorizontal: spacing.lg,
                                paddingTop: spacing.sm,
                            }}
                        >
                            {actions}
                        </View>
                    ) : null}
                </Animated.View>
            </View>
        </Modal>
    );
}

/** Wraps a dialog action so side-by-side buttons share the row evenly. */
export function DialogAction({ children }: { children: ReactNode }) {
    return <View style={{ flexGrow: 1, flexBasis: 0 }}>{children}</View>;
}
