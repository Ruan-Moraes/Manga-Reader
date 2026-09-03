import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { LocalMediaImportDraft } from '@/src/entities/local-media-import';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, Card, Icon } from '@/src/shared/ui';

import { type LocalMediaImportController } from '../model/importLocalMedia';
import { useLocalMediaImport } from '../model/useLocalMediaImport';

interface Props {
    controller?: LocalMediaImportController;
    draft?: LocalMediaImportDraft | null;
    onDraftChange?: (draft: LocalMediaImportDraft | null) => void;
    onContinue?: () => void;
}

export function ImportLocalMediaPanel({ controller, draft, onDraftChange, onContinue }: Props) {
    const { t } = useTranslation('launcher');
    const { spacing, tokens } = useTheme();
    const { state, selectImages, retry } = useLocalMediaImport(controller, onDraftChange);
    const visibleDraft = draft === undefined ? state.draft : draft;
    const busy = state.status === 'loading' || state.status === 'importing';
    const errorKey = state.error ? `offline.import.errors.${state.error}` : null;
    const [pressed, setPressed] = useState(false);
    const continueAction =
        visibleDraft && visibleDraft.items.length > 0 && onContinue ? (
            <Button onPress={onContinue} disabled={busy} accessibilityLabel={t('offline.import.continueAction')}>
                {t('offline.import.continueAction')}
            </Button>
        ) : null;

    if (visibleDraft && !errorKey) {
        return (
            <View style={{ gap: spacing.md }}>
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
                        leading={!busy ? <Icon name="folder-open-outline" size={20} color={tokens.accentText} /> : undefined}
                    >
                        {t('offline.import.replaceAction')}
                    </Button>
                </Card>
                {continueAction}
            </View>
        );
    }

    return (
        <View style={{ gap: spacing.md }}>
            <Pressable
                accessibilityLabel={t('offline.import.selectAction')}
                accessibilityRole="button"
                disabled={busy}
                onPress={() => void selectImages()}
                onPressIn={() => setPressed(true)}
                onPressOut={() => setPressed(false)}
                style={{
                    alignItems: 'center',
                    backgroundColor: pressed ? tokens.surfacePressed : tokens.accentSoft,
                    borderColor: tokens.accentBorder,
                    borderRadius: 24,
                    borderStyle: 'dashed',
                    borderWidth: 1,
                    gap: spacing.sm,
                    justifyContent: 'center',
                    minHeight: 164,
                    opacity: busy ? 0.62 : 1,
                    padding: spacing.lg,
                }}
            >
                <View
                    style={{
                        alignItems: 'center',
                        backgroundColor: tokens.accent,
                        borderRadius: 14,
                        height: 52,
                        justifyContent: 'center',
                        width: 52,
                    }}
                >
                    <Icon name="add" size={28} color={tokens.onAccent} />
                </View>
                <AppText variant="section">{t('offline.import.selectAction')}</AppText>
                <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                    {t('offline.import.formats')}
                </AppText>
            </Pressable>

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

            {continueAction}

            <AppText variant="caption" tone="subtle" style={{ textAlign: 'center' }}>
                {t('offline.import.privacyNote')}
            </AppText>
        </View>
    );
}
