import { Pressable, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_CONTENT_LANGUAGES } from '@/src/entities/content-language-preference';
import { useTheme } from '@/src/shared/theme';
import { Button } from '@/src/shared/ui';

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
    const { minimumTouchTarget, radii, spacing, tokens, typography } = useTheme();
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
    const action = (label: string, disabled: boolean, onPress: () => void, symbol: string) => (
        <Pressable
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={{
                alignItems: 'center',
                borderColor: disabled ? tokens.inputBorder : tokens.accentBorder,
                borderRadius: radii.control,
                borderWidth: 1,
                justifyContent: 'center',
                minHeight: minimumTouchTarget,
                minWidth: minimumTouchTarget,
                opacity: disabled ? 0.6 : 1,
            }}
        >
            <Text style={{ color: disabled ? tokens.disabled : tokens.accentText, fontSize: typography.body }}>{symbol}</Text>
        </Pressable>
    );

    return (
        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
            <Text accessibilityRole="header" style={{ color: tokens.text, fontSize: typography.h2 }}>
                {t('contentLanguages.title')}
            </Text>
            <Text style={{ color: tokens.muted, fontSize: typography.body }}>{t('contentLanguages.description')}</Text>
            {state.effective.map((language, index) => {
                const fallback = language === 'pt-BR';
                const positionLabel = t('contentLanguages.position', {
                    position: index + 1,
                    language: t(`language.${language}`),
                    fallback: fallback ? t('contentLanguages.fallbackAnnouncement') : '',
                });
                return (
                    <View key={language} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: minimumTouchTarget }}>
                        <Text accessibilityLabel={positionLabel} accessible style={{ color: tokens.text, flex: 1, fontSize: typography.body }}>
                            {index + 1}. {t(`language.${language}`)} {fallback ? `— ${t('contentLanguages.fallback')}` : ''}
                        </Text>
                        {action(
                            t('contentLanguages.moveUp', { language: t(`language.${language}`) }),
                            !canEdit || index === 0,
                            () => run(moveContentLanguage(index, index - 1, queryClient)),
                            '↑',
                        )}
                        {action(
                            t('contentLanguages.moveDown', { language: t(`language.${language}`) }),
                            !canEdit || index === state.effective.length - 1,
                            () => run(moveContentLanguage(index, index + 1, queryClient)),
                            '↓',
                        )}
                        {action(
                            t('contentLanguages.remove', { language: t(`language.${language}`) }),
                            !canEdit || fallback,
                            () => run(removeContentLanguage(language, queryClient)),
                            '×',
                        )}
                    </View>
                );
            })}
            {missing.map(language => (
                <Button fullWidth={false} key={language} disabled={!canEdit} onPress={() => run(addContentLanguage(language, queryClient))} variant="outline">
                    {t('contentLanguages.add', { language: t(`language.${language}`) })}
                </Button>
            ))}
            {state.hydrationStatus === 'loading' && <Text style={{ color: tokens.muted }}>{t('contentLanguages.loading')}</Text>}
            {state.readError && (
                <View style={{ gap: spacing.sm }}>
                    <Text accessibilityRole="alert" style={{ color: tokens.danger }}>
                        {t('contentLanguages.readError')}
                    </Text>
                    <Button onPress={retryRead} variant="outline">
                        {t('contentLanguages.retryRead')}
                    </Button>
                </View>
            )}
            {state.syncStatus === 'syncing' && <Text style={{ color: tokens.muted }}>{t('contentLanguages.pending')}</Text>}
            {state.writeError && (
                <View style={{ gap: spacing.sm }}>
                    <Text accessibilityRole="alert" style={{ color: tokens.danger }}>
                        {t('contentLanguages.writeError')}
                    </Text>
                    <Button onPress={() => run(retryContentLanguagesUpdate(queryClient))} variant="outline">
                        {t('contentLanguages.retryWrite')}
                    </Button>
                </View>
            )}
            {state.invalidationError && (
                <View style={{ gap: spacing.sm }}>
                    <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={{ color: tokens.danger }}>
                        {t(state.consumerRetrying ? 'contentLanguages.consumerRetrying' : 'contentLanguages.consumerError')}
                    </Text>
                    <Button disabled={state.consumerRetrying} onPress={() => run(retryContentLanguageConsumers(queryClient))} variant="outline">
                        {t('contentLanguages.retryConsumers')}
                    </Button>
                </View>
            )}
        </View>
    );
}
