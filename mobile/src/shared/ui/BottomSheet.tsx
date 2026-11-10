import { useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { createShadowStyle, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { useKeyboardOverlap } from './useKeyboardInset';

export const BOTTOM_SHEET_DEFAULT_MAX_RATIO = 0.85;
const HANDLE_AREA_HEIGHT = 24;

export interface BottomSheetTestIDs {
    layer: string;
    backdrop: string;
    sheet: string;
    handle: string;
    header: string;
    scroll: string;
    footer: string;
}

const DEFAULT_TEST_IDS: BottomSheetTestIDs = {
    layer: 'bottom-sheet-layer',
    backdrop: 'bottom-sheet-backdrop',
    sheet: 'bottom-sheet',
    handle: 'bottom-sheet-handle',
    header: 'bottom-sheet-header',
    scroll: 'bottom-sheet-scroll',
    footer: 'bottom-sheet-footer',
};

/**
 * Espaço sob a ação do rodapé das folhas: a safe area menos 16 (a barra de início ocupa só os ~13 pt finais), nunca
 * menos que 8; sem safe area, 16. Mantém a ação colada embaixo sem invadir a área do gesto.
 */
export function resolveSheetFooterBottom(insetBottom: number, spacing: { sm: number; md: number }): number {
    return insetBottom > 0 ? Math.max(insetBottom - spacing.md, spacing.sm) : spacing.md;
}

export interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    /** Accessible label of the close button and of the scrim. */
    closeLabel: string;
    title?: string;
    description?: string;
    /** Separates the header from the body with a divider (used by SelectField). */
    headerDivider?: boolean;
    footer?: ReactNode;
    children?: ReactNode;
    /** Fixed height computed by the consumer; still limited by `maxHeightRatio`. */
    height?: number;
    maxHeightRatio?: number;
    onShow?: () => void;
    onDismiss?: () => void;
    testIDs?: Partial<BottomSheetTestIDs>;
}

/** Clamps the sheet height to the safe viewport; never negative. */
export function resolveBottomSheetMaxHeight(viewportHeight: number, safeTop: number, ratio = BOTTOM_SHEET_DEFAULT_MAX_RATIO): number {
    const height = Number.isFinite(viewportHeight) ? Math.max(0, viewportHeight) : 0;
    const top = Number.isFinite(safeTop) ? Math.max(0, safeTop) : 0;
    const safeRatio = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) : BOTTOM_SHEET_DEFAULT_MAX_RATIO;

    return Math.max(0, height - top) * safeRatio;
}

export function BottomSheet({
    visible,
    onClose,
    closeLabel,
    title,
    description,
    headerDivider = true,
    footer,
    children,
    height,
    maxHeightRatio = BOTTOM_SHEET_DEFAULT_MAX_RATIO,
    onShow,
    onDismiss,
    testIDs,
}: BottomSheetProps) {
    const { height: viewportHeight } = useWindowDimensions();

    const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0, left: 0, right: 0, top: 0 };

    const { effectiveReduceMotion, layout, motion, radii, spacing, tokens } = useTheme();

    const ids = { ...DEFAULT_TEST_IDS, ...testIDs };
    // Teclado aberto: a folha sobe por cima dele e encolhe para caber no espaço livre; o corpo rola e o rodapé
    // (a ação) fica sempre visível acima do teclado.
    const { overlap: keyboard, onLayerLayout } = useKeyboardOverlap();
    const maxHeight = Math.min(
        resolveBottomSheetMaxHeight(viewportHeight, insets.top, maxHeightRatio),
        keyboard > 0 ? Math.max(0, viewportHeight - insets.top - keyboard - spacing.md) : Number.POSITIVE_INFINITY,
    );
    const hasHeader = Boolean(title || description);
    const bottomPadding = keyboard > 0 ? spacing.lg : Math.max(insets.bottom, spacing.lg);
    const footerBottomPadding = keyboard > 0 ? spacing.sm : resolveSheetFooterBottom(insets.bottom, spacing);
    const shadow = createShadowStyle('sheet', tokens.overlay);

    // Animação própria (pedido de 2026-11-09): o fundo escuro só faz fade; apenas a folha sobe e desce.
    // O Modal segue montado até a saída terminar; com redução de movimento tudo é instantâneo.
    const [mounted, setMounted] = useState(visible);
    const progress = useRef(new Animated.Value(0)).current;
    const travel = height === undefined ? maxHeight : Math.min(Math.max(0, height), maxHeight);
    useEffect(() => {
        if (visible) setMounted(true);
        if (effectiveReduceMotion) {
            progress.setValue(visible ? 1 : 0);
            if (!visible) setMounted(false);
            return;
        }
        const animation = Animated.timing(progress, {
            toValue: visible ? 1 : 0,
            duration: visible ? motion.sheet : motion.base,
            easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
            useNativeDriver: true,
        });
        animation.start(({ finished }) => {
            if (finished && !visible) setMounted(false);
        });
        return () => animation.stop();
    }, [effectiveReduceMotion, motion.base, motion.sheet, progress, visible]);

    return (
        <Modal
            animationType="none"
            navigationBarTranslucent
            onDismiss={onDismiss}
            onShow={onShow}
            onRequestClose={onClose}
            presentationStyle="overFullScreen"
            statusBarTranslucent
            transparent
            visible={mounted || visible}
        >
            <View
                accessibilityViewIsModal={visible}
                accessibilityElementsHidden={!visible}
                importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
                onAccessibilityEscape={onClose}
                onLayout={onLayerLayout}
                pointerEvents={visible ? 'auto' : 'none'}
                style={{ flex: 1 }}
                testID={ids.layer}
            >
                <Animated.View pointerEvents="box-none" style={{ bottom: 0, left: 0, opacity: progress, position: 'absolute', right: 0, top: 0 }}>
                    <Pressable
                        testID={ids.backdrop}
                        accessibilityLabel={closeLabel}
                        accessibilityRole="button"
                        onPress={onClose}
                        style={{ backgroundColor: tokens.scrim, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
                    />
                </Animated.View>
                <Animated.View
                    testID={ids.sheet}
                    style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.separator,
                        borderTopLeftRadius: radii.feature,
                        borderTopRightRadius: radii.feature,
                        borderTopWidth: 1,
                        bottom: keyboard,
                        left: 0,
                        position: 'absolute',
                        right: 0,
                        ...(height === undefined ? { maxHeight } : { height: Math.min(Math.max(0, height), maxHeight), maxHeight }),
                        ...shadow,
                        elevation: Platform.OS === 'android' ? shadow.elevation : undefined,
                        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [travel, 0] }) }],
                    }}
                >
                    <View style={{ alignItems: 'center', height: HANDLE_AREA_HEIGHT, justifyContent: 'center' }}>
                        <View testID={ids.handle} style={{ backgroundColor: tokens.borderStrong, borderRadius: radii.pill, height: 5, width: 44 }} />
                    </View>
                    <View
                        testID={ids.header}
                        style={{
                            alignItems: hasHeader ? 'flex-start' : 'center',
                            flexDirection: 'row',
                            gap: spacing.md,
                            paddingHorizontal: layout.screenGutter,
                            ...(headerDivider ? { borderBottomColor: tokens.separator, borderBottomWidth: 1, paddingBottom: spacing.md } : {}),
                        }}
                    >
                        <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                            {title ? (
                                <AppText accessibilityRole="header" variant="section" numberOfLines={2}>
                                    {title}
                                </AppText>
                            ) : null}
                            {description ? (
                                <AppText variant="caption" tone="muted">
                                    {description}
                                </AppText>
                            ) : null}
                        </View>
                        <IconButton icon="close" accessibilityLabel={closeLabel} onPress={onClose} surface="surface" />
                    </View>
                    <ScrollView
                        testID={ids.scroll}
                        bounces={false}
                        style={{ flexShrink: 1 }}
                        contentContainerStyle={{
                            gap: spacing.lg,
                            paddingBottom: footer ? spacing.lg : bottomPadding,
                            paddingHorizontal: layout.screenGutter,
                            paddingTop: spacing.lg,
                        }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {children}
                    </ScrollView>
                    {footer ? (
                        <View
                            testID={ids.footer}
                            style={{
                                borderTopColor: tokens.separator,
                                borderTopWidth: 1,
                                gap: spacing.sm,
                                // Rodapé colado: ver resolveSheetFooterBottom; 8 acima da ação.
                                paddingBottom: footerBottomPadding,
                                paddingHorizontal: layout.screenGutter,
                                paddingTop: spacing.sm,
                            }}
                        >
                            {footer}
                        </View>
                    ) : null}
                </Animated.View>
            </View>
        </Modal>
    );
}
