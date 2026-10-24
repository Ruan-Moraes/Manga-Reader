import { type ReactNode, useContext } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';
import { AppText, Button, IconButton } from '@/shared/ui';

interface Props {
    visible: boolean;
    page: number;
    total: number;
    duplicate: boolean;
    busy: boolean;
    itemMeta?: ReactNode;
    onPreview: () => void;
    onRemove: () => void;
    onClose: () => void;
}

export function ReviewImageActionsSheet({ visible, page, total, duplicate, busy, itemMeta, onPreview, onRemove, onClose }: Props) {
    const { t } = useTranslation('launcher');

    const { effectiveReduceMotion, radii, spacing, tokens } = useTheme();

    const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0 };

    return (
        <Modal
            animationType={effectiveReduceMotion ? 'none' : 'slide'}
            navigationBarTranslucent
            onRequestClose={onClose}
            presentationStyle="overFullScreen"
            statusBarTranslucent
            transparent
            visible={visible}
        >
            <View accessibilityViewIsModal onAccessibilityEscape={onClose} style={{ flex: 1 }} testID="review-image-actions-layer">
                <Pressable
                    accessibilityLabel={t('offline.review.closeActions')}
                    accessibilityRole="button"
                    onPress={onClose}
                    style={{ backgroundColor: tokens.scrim, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
                />
                <View
                    testID="review-image-actions-sheet"
                    style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.separator,
                        borderTopLeftRadius: radii.feature,
                        borderTopRightRadius: radii.feature,
                        borderTopWidth: 1,
                        bottom: 0,
                        elevation: Platform.OS === 'android' ? 18 : undefined,
                        gap: spacing.xl,
                        left: 0,
                        paddingBottom: Math.max(insets.bottom, spacing.lg),
                        paddingHorizontal: spacing.lg,
                        position: 'absolute',
                        right: 0,
                        shadowColor: tokens.overlay,
                        shadowOffset: { height: -8, width: 0 },
                        shadowOpacity: 0.28,
                        shadowRadius: 22,
                    }}
                >
                    <View style={{ alignItems: 'center', height: 24, justifyContent: 'center' }}>
                        <View style={{ backgroundColor: tokens.borderStrong, borderRadius: radii.pill, height: 5, width: 44 }} />
                    </View>
                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
                        <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                            {duplicate ? (
                                <AppText variant="caption" style={{ color: tokens.warn }}>
                                    {t('offline.review.possibleDuplicate')}
                                </AppText>
                            ) : null}
                            <AppText accessibilityRole="header" variant="title">
                                {t('offline.review.actionsTitle', { page, total })}
                            </AppText>
                            {itemMeta ? (
                                <View
                                    style={{
                                        backgroundColor: tokens.surfaceMuted,
                                        borderRadius: radii.pill,
                                        paddingHorizontal: spacing.sm,
                                        paddingVertical: spacing.xs,
                                        alignSelf: 'flex-start',
                                    }}
                                >
                                    {itemMeta}
                                </View>
                            ) : null}
                        </View>
                        <IconButton icon="close" accessibilityLabel={t('offline.review.closeActions')} onPress={onClose} surface="surface" />
                    </View>
                    <View style={{ gap: spacing.sm }}>
                        <Button
                            variant="outline"
                            disabled={busy}
                            onPress={onPreview}
                            leading={<Ionicons name="expand-outline" size={20} color={tokens.accentText} accessibilityElementsHidden />}
                        >
                            {t('offline.review.previewAction')}
                        </Button>
                        <Button
                            tone="danger"
                            disabled={busy}
                            onPress={onRemove}
                            leading={<Ionicons name="trash-outline" size={20} color={busy ? tokens.disabled : tokens.onDanger} accessibilityElementsHidden />}
                        >
                            {t('offline.review.removeAction')}
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
