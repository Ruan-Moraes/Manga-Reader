import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { type LocalMediaImportDraft, TRANSLATION_LANGUAGE_CODES, type TranslationLanguageCode } from '@/src/entities/local-media-import';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, ChoiceGroup } from '@/src/shared/ui';

import type { SelectTranslationLanguagesController } from '../model/selectTranslationLanguages';
import { useSelectTranslationLanguages } from '../model/useSelectTranslationLanguages';

const TARGET_LANGUAGE_CODES: readonly TranslationLanguageCode[] = ['pt-BR', 'ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant'];

interface Props {
    draft: LocalMediaImportDraft;
    onDraftChange: (draft: LocalMediaImportDraft) => void;
    controller?: SelectTranslationLanguagesController;
}

export function TranslationLanguageSelectionPanel({ draft, onDraftChange, controller }: Props) {
    const { t } = useTranslation('launcher');
    const { spacing, tokens } = useTheme();
    const actions = useSelectTranslationLanguages(draft, onDraftChange, controller);
    const languageLabel = (language: TranslationLanguageCode) => t(`offline.languages.options.${language}`);
    const targetLabel = (language: TranslationLanguageCode) =>
        language === 'pt-BR' ? t('offline.languages.priorityTarget', { language: languageLabel(language) }) : languageLabel(language);
    const confirmed = draft.languagesConfirmedAt !== null;

    return (
        <View testID="translation-language-selection" style={{ borderTopColor: tokens.separator, borderTopWidth: 1, gap: spacing.md, paddingTop: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
                <AppText variant="section">{t('offline.languages.title')}</AppText>
                <AppText variant="caption" tone="muted">
                    {t('offline.languages.description')}
                </AppText>
            </View>

            <ChoiceGroup
                label={t('offline.languages.source')}
                value={actions.selection.sourceLanguage}
                options={TRANSLATION_LANGUAGE_CODES}
                optionLabel={languageLabel}
                onChange={actions.selectSource}
                disabled={actions.busy}
            />

            <View accessibilityElementsHidden style={{ alignItems: 'center' }}>
                <Ionicons name="arrow-down" size={22} color={tokens.accentText} />
            </View>

            <ChoiceGroup
                label={t('offline.languages.target')}
                value={actions.selection.targetLanguage}
                options={TARGET_LANGUAGE_CODES}
                optionLabel={targetLabel}
                onChange={actions.selectTarget}
                disabled={actions.busy}
            />

            {actions.error && (
                <View accessibilityRole="alert" style={{ gap: spacing.sm }}>
                    <AppText tone="danger">{t(`offline.languages.errors.${actions.error}`)}</AppText>
                    {actions.error !== 'same-language' && (
                        <Button variant="outline" disabled={actions.busy} onPress={() => void actions.retry()}>
                            {t('offline.languages.retry')}
                        </Button>
                    )}
                </View>
            )}

            {confirmed && !actions.error && (
                <View accessibilityRole="summary" style={{ gap: spacing.xs }}>
                    <AppText variant="label" tone="success">
                        {t('offline.languages.confirmedTitle')}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                        {t('offline.languages.confirmedDescription')}
                    </AppText>
                </View>
            )}

            <Button
                disabled={actions.busy || !actions.valid || confirmed}
                loading={actions.busy}
                onPress={() => void actions.confirm()}
                accessibilityLabel={confirmed ? t('offline.languages.confirmedAction') : t('offline.languages.confirm')}
            >
                {confirmed ? t('offline.languages.confirmedAction') : t('offline.languages.confirm')}
            </Button>
        </View>
    );
}
