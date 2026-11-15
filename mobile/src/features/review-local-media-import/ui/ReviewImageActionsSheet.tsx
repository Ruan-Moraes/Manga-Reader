import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/theme';
import { AppText, BottomSheet, Button } from '@/shared/ui';

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

    const { radii, spacing, tokens } = useTheme();

    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            closeLabel={t('offline.review.closeActions')}
            title={t('offline.review.actionsTitle', { page, total })}
            headerMetadata={
                <>
                    {duplicate ? (
                        <AppText variant="caption" style={{ color: tokens.warn }}>
                            {t('offline.review.possibleDuplicate')}
                        </AppText>
                    ) : null}
                    {itemMeta ? (
                        <View
                            style={{
                                alignSelf: 'flex-start',
                                backgroundColor: tokens.surfaceMuted,
                                borderRadius: radii.pill,
                                paddingHorizontal: spacing.sm,
                                paddingVertical: spacing.xs,
                            }}
                        >
                            {itemMeta}
                        </View>
                    ) : null}
                </>
            }
            testIDs={{ layer: 'review-image-actions-layer', sheet: 'review-image-actions-sheet', header: 'review-image-actions-header' }}
        >
            <View style={{ gap: spacing.xs }}>
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
        </BottomSheet>
    );
}
