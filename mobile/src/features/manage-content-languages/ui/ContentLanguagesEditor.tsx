import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_CONTENT_LANGUAGES } from '@/src/entities/content-language-preference';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, FormSection, Icon, IconButton, type IconName, StatusMessage } from '@/src/shared/ui';

import { hydrateContentLanguages } from '../model/contentLanguagesHydration';
import { useContentLanguagesStore } from '../model/contentLanguagesStore';
import {
    addContentLanguage,
    moveContentLanguage,
    removeContentLanguage,
    retryContentLanguageConsumers,
    retryContentLanguagesUpdate,
} from '../model/manageContentLanguages';

export function ContentLanguagesEditor() {
    const queryClient = useQueryClient();
    const { t } = useTranslation('common');
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const state = useContentLanguagesStore();

    if (state.identityEpoch === null) return null;

    const canEdit = state.confirmed !== null;
    const missing = SUPPORTED_CONTENT_LANGUAGES.filter(language => !state.effective.includes(language));
    const run = (operation: Promise<unknown>) => void operation.catch(() => undefined);
    const retryRead = () => {
        if (state.identityEpoch === null) return;
        useContentLanguagesStore.getState().beginAccount(state.identityEpoch, state.interfaceLanguage);
        void hydrateContentLanguages(state.identityEpoch);
    };
    const action = (label: string, disabled: boolean, onPress: () => void, icon: IconName) => (
        <IconButton accessibilityLabel={label} disabled={disabled} icon={icon} onPress={onPress} />
    );

    return (
        <View style={{ gap: spacing.lg }}>
            <FormSection title={t('contentLanguages.priorityTitle')} description={t('contentLanguages.description')}>
                {state.effective.map((language, index) => {
                    const fallback = language === 'pt-BR';
                    const positionLabel = t('contentLanguages.position', {
                        position: index + 1,
                        language: t(`language.${language}`),
                        fallback: fallback ? t('contentLanguages.fallbackAnnouncement') : '',
                    });
                    return (
                        <View
                            key={language}
                            style={{
                                alignItems: 'center',
                                backgroundColor: tokens.surfaceMuted,
                                borderRadius: radii.control,
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: spacing.sm,
                                minHeight: minimumTouchTarget,
                                padding: spacing.sm,
                            }}
                        >
                            <View
                                accessibilityElementsHidden
                                style={{
                                    alignItems: 'center',
                                    backgroundColor: tokens.accentSoft,
                                    borderRadius: radii.pill,
                                    height: 32,
                                    justifyContent: 'center',
                                    width: 32,
                                }}
                            >
                                <AppText variant="label" tone="accent">
                                    {index + 1}
                                </AppText>
                            </View>
                            <View style={{ flex: 1, gap: spacing.xs, minWidth: 140 }}>
                                <AppText accessibilityLabel={positionLabel} accessible variant="label">
                                    {t(`language.${language}`)}
                                </AppText>
                                {fallback ? (
                                    <AppText variant="caption" tone="muted">
                                        {t('contentLanguages.fallback')}
                                    </AppText>
                                ) : null}
                            </View>
                            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                                {action(
                                    t('contentLanguages.moveUp', { language: t(`language.${language}`) }),
                                    !canEdit || index === 0,
                                    () => run(moveContentLanguage(index, index - 1, queryClient)),
                                    'arrow-up',
                                )}
                                {action(
                                    t('contentLanguages.moveDown', { language: t(`language.${language}`) }),
                                    !canEdit || index === state.effective.length - 1,
                                    () => run(moveContentLanguage(index, index + 1, queryClient)),
                                    'arrow-down',
                                )}
                                {action(
                                    t('contentLanguages.remove', { language: t(`language.${language}`) }),
                                    !canEdit || fallback,
                                    () => run(removeContentLanguage(language, queryClient)),
                                    'trash-outline',
                                )}
                            </View>
                        </View>
                    );
                })}
            </FormSection>
            {missing.length > 0 ? (
                <FormSection title={t('contentLanguages.availableTitle')} description={t('contentLanguages.availableDescription')}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                        {missing.map(language => (
                            <Button
                                fullWidth={false}
                                key={language}
                                disabled={!canEdit}
                                leading={<Icon name="add-circle-outline" decorative />}
                                onPress={() => run(addContentLanguage(language, queryClient))}
                                variant="outline"
                            >
                                {t(`language.${language}`)}
                            </Button>
                        ))}
                    </View>
                </FormSection>
            ) : null}
            {state.hydrationStatus === 'loading' && <StatusMessage title={t('contentLanguages.loading')} tone="loading" />}
            {state.readError && (
                <StatusMessage actionLabel={t('contentLanguages.retryRead')} onAction={retryRead} title={t('contentLanguages.readError')} tone="danger" />
            )}
            {state.syncStatus === 'syncing' && <StatusMessage title={t('contentLanguages.pending')} tone="loading" />}
            {state.writeError && (
                <StatusMessage
                    actionLabel={t('contentLanguages.retryWrite')}
                    onAction={() => run(retryContentLanguagesUpdate(queryClient))}
                    title={t('contentLanguages.writeError')}
                    tone="danger"
                />
            )}
            {state.invalidationError && (
                <StatusMessage
                    actionLabel={t('contentLanguages.retryConsumers')}
                    onAction={() => run(retryContentLanguageConsumers(queryClient))}
                    title={t(state.consumerRetrying ? 'contentLanguages.consumerRetrying' : 'contentLanguages.consumerError')}
                    tone="danger"
                />
            )}
        </View>
    );
}
