import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { LocalMediaImportDraft } from '@/src/entities/local-media-import';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, Card } from '@/src/shared/ui';

import { type LocalMediaImportController } from '../model/importLocalMedia';
import { useLocalMediaImport } from '../model/useLocalMediaImport';

interface Props {
    controller?: LocalMediaImportController;
    draft?: LocalMediaImportDraft | null;
    onDraftChange?: (draft: LocalMediaImportDraft | null) => void;
}

export function ImportLocalMediaPanel({ controller, draft, onDraftChange }: Props) {
    const { t } = useTranslation('launcher');
    const { spacing, tokens } = useTheme();
    const { state, selectImages, retry } = useLocalMediaImport(controller, onDraftChange);
    const visibleDraft = draft === undefined ? state.draft : draft;
    const busy = state.status === 'loading' || state.status === 'importing';
    const errorKey = state.error ? `offline.import.errors.${state.error}` : null;

    if (visibleDraft && !errorKey) {
        return (
            <Card padded={false} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.sm }}>
                <AppText variant="caption" style={{ flex: 1 }} numberOfLines={2}>
                    {t('offline.import.selectedCount', { count: visibleDraft.items.length })}
                </AppText>
                <Button
                    size="compact"
                    fullWidth={false}
                    variant="outline"
                    onPress={() => void selectImages()}
                    loading={state.status === 'importing'}
                    disabled={busy}
                    accessibilityLabel={t('offline.import.replaceAction')}
                    leading={!busy ? <Ionicons name="folder-open-outline" size={20} color={tokens.accentText} /> : undefined}
                >
                    {t('offline.import.replaceAction')}
                </Button>
            </Card>
        );
    }

    return (
        <Card variant="elevated" style={{ gap: spacing.lg }}>
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
                <Ionicons name="images-outline" size={42} color={tokens.accentText} accessibilityElementsHidden />
                <AppText variant="title" style={{ textAlign: 'center' }}>
                    {t('offline.import.title')}
                </AppText>
                <AppText tone="muted" style={{ textAlign: 'center' }}>
                    {t('offline.import.description')}
                </AppText>
            </View>

            {state.status === 'loading' && (
                <View accessibilityRole="progressbar" accessibilityLabel={t('offline.import.loading')} style={{ alignItems: 'center', gap: spacing.sm }}>
                    <ActivityIndicator color={tokens.accent} />
                    <AppText tone="muted">{t('offline.import.loading')}</AppText>
                </View>
            )}

            {visibleDraft && (
                <View accessibilityRole="summary" style={{ alignItems: 'center', gap: spacing.xs }}>
                    <AppText variant="section" tone="success">
                        {t('offline.import.readyTitle')}
                    </AppText>
                    <AppText>{t('offline.import.selectedCount', { count: visibleDraft.items.length })}</AppText>
                    <AppText tone="muted" style={{ textAlign: 'center' }}>
                        {t('offline.import.readyDescription')}
                    </AppText>
                </View>
            )}

            {errorKey && (
                <View accessibilityRole="alert" style={{ gap: spacing.sm }}>
                    <AppText variant="section" tone="danger">
                        {t('offline.import.errorTitle')}
                    </AppText>
                    <AppText tone="muted">{t(errorKey)}</AppText>
                    <Button variant="outline" onPress={() => void retry()} accessibilityLabel={t('offline.import.retry')}>
                        {t('offline.import.retry')}
                    </Button>
                </View>
            )}

            <Button
                onPress={() => void selectImages()}
                loading={state.status === 'importing'}
                disabled={busy}
                accessibilityLabel={visibleDraft ? t('offline.import.replaceAction') : t('offline.import.selectAction')}
                leading={!busy ? <Ionicons name="folder-open-outline" size={20} color={tokens.onAccent} /> : undefined}
            >
                {visibleDraft ? t('offline.import.replaceAction') : t('offline.import.selectAction')}
            </Button>
            <AppText variant="caption" tone="subtle" style={{ textAlign: 'center' }}>
                {t('offline.import.privacyNote')}
            </AppText>
        </Card>
    );
}
