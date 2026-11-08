import { useContext } from 'react';
import { Modal, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { createShadowStyle, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

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
    headerDivider = false,
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

    const { effectiveReduceMotion, layout, radii, spacing, tokens } = useTheme();

    const ids = { ...DEFAULT_TEST_IDS, ...testIDs };
    const maxHeight = resolveBottomSheetMaxHeight(viewportHeight, insets.top, maxHeightRatio);
    const hasHeader = Boolean(title || description);
    const bottomPadding = Math.max(insets.bottom, spacing.lg);
    const shadow = createShadowStyle('sheet', tokens.overlay);

    return (
        <Modal
            animationType={effectiveReduceMotion ? 'none' : 'slide'}
            navigationBarTranslucent
            onDismiss={onDismiss}
            onShow={onShow}
            onRequestClose={onClose}
            presentationStyle="overFullScreen"
            statusBarTranslucent
            transparent
            visible={visible}
        >
            <View accessibilityViewIsModal onAccessibilityEscape={onClose} style={{ flex: 1 }} testID={ids.layer}>
                <Pressable
                    testID={ids.backdrop}
                    accessibilityLabel={closeLabel}
                    accessibilityRole="button"
                    onPress={onClose}
                    style={{ backgroundColor: tokens.scrim, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
                />
                <View
                    testID={ids.sheet}
                    style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.separator,
                        borderTopLeftRadius: radii.feature,
                        borderTopRightRadius: radii.feature,
                        borderTopWidth: 1,
                        bottom: 0,
                        left: 0,
                        position: 'absolute',
                        right: 0,
                        ...(height === undefined ? { maxHeight } : { height: Math.min(Math.max(0, height), maxHeight), maxHeight }),
                        ...shadow,
                        elevation: Platform.OS === 'android' ? shadow.elevation : undefined,
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
                                <AppText variant="caption" tone="muted" numberOfLines={headerDivider ? 2 : undefined}>
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
                                paddingBottom: bottomPadding,
                                paddingHorizontal: layout.screenGutter,
                                paddingTop: spacing.md,
                            }}
                        >
                            {footer}
                        </View>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
}
