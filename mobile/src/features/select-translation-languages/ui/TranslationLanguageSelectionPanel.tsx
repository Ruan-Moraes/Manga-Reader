import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type LocalMediaImportDraft, TRANSLATION_LANGUAGE_CODES, type TranslationLanguageCode } from '@/src/entities/local-media-import';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, Icon, SelectField } from '@/src/shared/ui';

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
    const { spacing } = useTheme();
    const actions = useSelectTranslationLanguages(draft, onDraftChange, controller);
    const languageLabel = (language: TranslationLanguageCode) => t(`offline.languages.options.${language}`);
    const targetDescription = (language: TranslationLanguageCode) => (language === 'pt-BR' ? t('offline.languages.recommended') : undefined);
    const confirmed = draft.languagesConfirmedAt !== null;

    return (
        <View testID="translation-language-selection" style={{ gap: spacing.md }}>
            <SelectField
                variant="input"
                closeLabel={t('common:localeControls.closeSelection')}
                label={t('offline.languages.source')}
                value={actions.selection.sourceLanguage}
                options={TRANSLATION_LANGUAGE_CODES}
                optionLabel={languageLabel}
                onChange={actions.selectSource}
                disabled={actions.busy}
            />

            <View
                testID="translation-language-direction"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{ alignItems: 'center' }}
            >
                <Icon testID="translation-language-direction-icon" name="arrow-down" size={28} decorative />
            </View>

            <SelectField
                variant="input"
                closeLabel={t('common:localeControls.closeSelection')}
                label={t('offline.languages.target')}
                value={actions.selection.targetLanguage}
                options={TARGET_LANGUAGE_CODES}
                optionLabel={languageLabel}
                optionDescription={targetDescription}
                onChange={actions.selectTarget}
                disabled={actions.busy}
            />

            <AppText variant="caption" tone="muted">
                {t('offline.languages.description')}
            </AppText>

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
