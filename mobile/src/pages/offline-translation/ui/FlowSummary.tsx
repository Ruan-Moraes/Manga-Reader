import { View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import type { LocalMediaImportDraft, LocalMediaImportItem } from '@/entities/local-media-import';
import { useTheme } from '@/shared/theme';
import { AppText, Icon, TextAction } from '@/shared/ui';

interface Props {
    draft: LocalMediaImportDraft;
    languages: string;
    itemUri(item: LocalMediaImportItem): string;
    onEditPages(): void;
}

const MAX_THUMBNAILS = 5;

/** "Resumo" card of the languages step (056, kit): page strip, pages, languages and validation. */
export function FlowSummary({ draft, languages, itemUri, onEditPages }: Props) {
    const { t } = useTranslation('launcher');
    const { metrics, radii, spacing, tokens } = useTheme();
    const valid = draft.items.filter(item => item.mediaValidationStatus === 'VALID').length;
    const validated = draft.languagesConfirmedAt !== null && valid > 0;
    const rows: [string, string, boolean][] = [
        [t('offline.flow3.rowPages'), t('offline.flow3.summaryPages', { count: draft.items.length }), false],
        [t('offline.flow3.rowLanguages'), languages, false],
        [
            t('offline.flow3.rowValidation'),
            validated ? t('offline.flow3.validationCount', { ready: valid, total: draft.items.length }) : t('offline.flow3.validationLater'),
            validated && valid === draft.items.length,
        ],
    ];
    return (
        <View
            testID="flow-summary"
            style={{ backgroundColor: tokens.surface, borderColor: tokens.separator, borderRadius: radii.card, borderWidth: 1, overflow: 'hidden' }}
        >
            <View
                style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.xs }}
            >
                <AppText accessibilityRole="header" variant="eyebrow" tone="subtle">
                    {t('offline.flow3.summaryTitle')}
                </AppText>
                <TextAction label={t('offline.flow3.editPages')} onPress={onEditPages} />
            </View>
            <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                    borderBottomColor: tokens.separator,
                    borderBottomWidth: 1,
                    borderTopColor: tokens.separator,
                    borderTopWidth: 1,
                    flexDirection: 'row',
                    gap: spacing.sm,
                    padding: spacing.md,
                }}
            >
                {draft.items.slice(0, MAX_THUMBNAILS).map(item => (
                    <Image
                        key={item.id}
                        source={{ uri: itemUri(item) }}
                        contentFit="cover"
                        style={{ aspectRatio: 2 / 3, backgroundColor: tokens.surfaceMuted, borderRadius: radii.sm, width: 52 }}
                    />
                ))}
            </View>
            {rows.map(([label, value, ok], index) => (
                <View
                    key={label}
                    style={{
                        alignItems: 'center',
                        borderTopColor: tokens.separator,
                        borderTopWidth: index === 0 ? 0 : 1,
                        flexDirection: 'row',
                        gap: spacing.sm,
                        justifyContent: 'space-between',
                        marginHorizontal: spacing.md,
                        minHeight: metrics.row.single,
                    }}
                >
                    <AppText tone="muted">{label}</AppText>
                    <View style={{ alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: spacing.xs }}>
                        {ok ? <Icon name="checkmark-circle" size={metrics.icon.sm} color={tokens.success} /> : null}
                        <AppText variant="label" numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>
                            {value}
                        </AppText>
                    </View>
                </View>
            ))}
        </View>
    );
}
