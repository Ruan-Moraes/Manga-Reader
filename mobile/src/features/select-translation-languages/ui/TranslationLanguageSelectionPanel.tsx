import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type LocalMediaImportDraft, TRANSLATION_LANGUAGE_CODES, type TranslationLanguageCode } from '@/entities/local-media-import';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Icon, PressableBox, PrimaryAction, SelectField } from '@/shared/ui';

import type { SelectTranslationLanguagesController } from '../model/selectTranslationLanguages';
import { useSelectTranslationLanguages } from '../model/useSelectTranslationLanguages';

const TARGET_LANGUAGE_CODES: readonly TranslationLanguageCode[] = ['pt-BR', 'ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant'];

interface Props {
    draft: LocalMediaImportDraft;
    onDraftChange: (draft: LocalMediaImportDraft) => void;
    controller?: SelectTranslationLanguagesController;
    /** Inside the 3-step flow the summary card shows the state; hides the confirmed note and button (056). */
    hideConfirmedState?: boolean;
}

export function TranslationLanguageSelectionPanel({ draft, onDraftChange, controller, hideConfirmedState = false }: Props) {
    const { t } = useTranslation('launcher');
    const { radii, spacing, tokens } = useTheme();
    const actions = useSelectTranslationLanguages(draft, onDraftChange, controller);
    const languageLabel = (language: TranslationLanguageCode) => t(`offline.languages.options.${language}`);
    const shortLanguageLabel = (language: TranslationLanguageCode) =>
        t(`offline.languages.shortOptions.${language}`, { defaultValue: languageLabel(language) });
    const targetDescription = (language: TranslationLanguageCode) => (language === 'pt-BR' ? t('offline.languages.recommended') : undefined);
    const confirmed = draft.languagesConfirmedAt !== null;
    const canSwap =
        actions.selection.sourceLanguage !== actions.selection.targetLanguage &&
        (TRANSLATION_LANGUAGE_CODES as readonly TranslationLanguageCode[]).includes(actions.selection.targetLanguage) &&
        TARGET_LANGUAGE_CODES.includes(actions.selection.sourceLanguage);

    const confirmButton = (
        <Button
            disabled={actions.busy || !actions.valid || confirmed}
            loading={actions.busy}
            onPress={() => void actions.confirm()}
            accessibilityLabel={confirmed ? t('offline.languages.confirmedAction') : t('offline.languages.confirm')}
        >
            {confirmed ? t('offline.languages.confirmedAction') : t('offline.languages.confirm')}
        </Button>
    );

    return (
        <View testID="translation-language-selection" style={{ gap: spacing.md }}>
            <View testID="translation-language-pair" style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <SelectField
                        variant="card"
                        valueLabel={shortLanguageLabel}
                        shortLabel={t('offline.languages.fromShort')}
                        closeLabel={t('common:localeControls.closeSelection')}
                        label={t('offline.languages.source')}
                        value={actions.selection.sourceLanguage}
                        options={TRANSLATION_LANGUAGE_CODES}
                        optionLabel={languageLabel}
                        optionDisabled={language => language === actions.selection.targetLanguage}
                        optionDescription={language => (language === actions.selection.targetLanguage ? t('offline.languages.usedAsTarget') : undefined)}
                        onChange={actions.selectSource}
                        disabled={actions.busy}
                    />
                </View>
                <View
                    testID="translation-language-direction"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{ display: 'none' }}
                >
                    <Icon testID="translation-language-direction-icon" name="arrow-down" size={28} decorative />
                </View>
                <PressableBox
                    accessibilityRole="button"
                    accessibilityLabel={t('offline.languages.swap')}
                    accessibilityState={{ disabled: actions.busy || !canSwap }}
                    disabled={actions.busy || !canSwap}
                    hitSlop={4}
                    onPress={actions.swap}
                    style={({ pressed }) => ({
                        alignItems: 'center',
                        backgroundColor: pressed ? tokens.surfacePressed : tokens.surfaceMuted,
                        borderColor: tokens.separator,
                        borderRadius: radii.pill,
                        borderWidth: 1,
                        height: 40,
                        justifyContent: 'center',
                        opacity: actions.busy || !canSwap ? 0.56 : 1,
                        width: 40,
                    })}
                >
                    <Icon name="swap-horizontal" size={20} color={tokens.accentText} />
                </PressableBox>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <SelectField
                        variant="card"
                        valueLabel={shortLanguageLabel}
                        shortLabel={t('offline.languages.toShort')}
                        closeLabel={t('common:localeControls.closeSelection')}
                        label={t('offline.languages.target')}
                        value={actions.selection.targetLanguage}
                        options={TARGET_LANGUAGE_CODES}
                        optionLabel={languageLabel}
                        optionDescription={language =>
                            language === actions.selection.sourceLanguage ? t('offline.languages.usedAsSource') : targetDescription(language)
                        }
                        optionDisabled={language => language === actions.selection.sourceLanguage}
                        onChange={actions.selectTarget}
                        disabled={actions.busy}
                    />
                </View>
            </View>

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

            {confirmed && !actions.error && !hideConfirmedState && (
                <View accessibilityRole="summary" style={{ gap: spacing.xs }}>
                    <AppText variant="label" tone="success">
                        {t('offline.languages.confirmedTitle')}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                        {t('offline.languages.confirmedDescription')}
                    </AppText>
                </View>
            )}

            {/* Depois de confirmados, a ação principal passa para a validação (056); o estado fica visível aqui. */}
            {confirmed ? (hideConfirmedState ? null : confirmButton) : <PrimaryAction>{confirmButton}</PrimaryAction>}
        </View>
    );
}
