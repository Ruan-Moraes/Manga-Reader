import { Alert, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
    ADULT_CONTENT_OPTIONS,
    COMMENT_VISIBILITY_OPTIONS,
    HISTORY_VISIBILITY_OPTIONS,
    LIBRARY_VISIBILITY_OPTIONS,
    SensitiveContentGuard,
    usePrivacySettingsStore,
} from '@/src/entities/user';
import { useTheme } from '@/src/shared/theme';
import { AppText, ChoiceCards, FormSection, SectionStack, SegmentedControl, StatusMessage, SwitchRow } from '@/src/shared/ui';

import { usePrivacyMutationStore } from '../model/privacyMutationStore';
import { changeHistoryVisibility, retryPrivacyConsumers, retryPrivacyUpdate, updatePrivacy } from '../model/updatePrivacy';

export function PrivacyControlsPanel() {
    const queryClient = useQueryClient();
    const current = usePrivacySettingsStore(state => state.current);
    const hydrationError = usePrivacySettingsStore(state => state.error);
    const error = usePrivacyMutationStore(state => state.error);
    const invalidationError = usePrivacyMutationStore(state => state.invalidationError);
    const { t } = useTranslation('common');
    const { radii, spacing, tokens } = useTheme();
    const run = (operation: Promise<unknown>) => void operation.catch(() => undefined);

    if (!current) return hydrationError ? <StatusMessage title={t('privacy.error')} tone="danger" /> : null;

    const confirmDnt = () =>
        new Promise<boolean>(resolve =>
            Alert.alert(t('privacy.dnt.confirmTitle'), t('privacy.dnt.confirmBody'), [
                { text: t('privacy.cancel'), style: 'cancel', onPress: () => resolve(false) },
                { text: t('privacy.confirm'), style: 'destructive', onPress: () => resolve(true) },
            ]),
        );

    const toggleAnalytics = () => {
        if (current.viewHistoryVisibility === 'DO_NOT_TRACK') return;
        if (!current.behaviorAnalyticsEnabled) {
            run(updatePrivacy({ behaviorAnalyticsEnabled: true }, queryClient));
            return;
        }
        Alert.alert(t('privacy.analytics.confirmTitle'), t('privacy.analytics.confirmBody'), [
            { text: t('privacy.cancel'), style: 'cancel' },
            {
                text: t('privacy.confirm'),
                style: 'destructive',
                onPress: () => run(updatePrivacy({ behaviorAnalyticsEnabled: false }, queryClient)),
            },
        ]);
    };

    return (
        <SectionStack>
            <FormSection title={t('privacy.sections.social.title')} description={t('privacy.sections.social.description')}>
                <SegmentedControl
                    label={t('privacy.comments')}
                    onChange={option => run(updatePrivacy({ commentVisibility: option }, queryClient))}
                    optionLabel={option => t(`privacy.option.${option}`)}
                    options={COMMENT_VISIBILITY_OPTIONS}
                    value={current.commentVisibility}
                />
                <SegmentedControl
                    label={t('privacy.library')}
                    onChange={option => run(updatePrivacy({ libraryVisibility: option }, queryClient))}
                    optionLabel={option => t(`privacy.option.${option}`)}
                    options={LIBRARY_VISIBILITY_OPTIONS}
                    value={current.libraryVisibility}
                />
            </FormSection>
            <FormSection title={t('privacy.sections.activity.title')} description={t('privacy.sections.activity.description')}>
                <ChoiceCards
                    label={t('privacy.history')}
                    layout="stacked"
                    onChange={option => run(changeHistoryVisibility(option, confirmDnt, queryClient))}
                    optionDescription={option => t(`privacy.descriptions.history.${option}`)}
                    optionLabel={option => t(`privacy.option.${option}`)}
                    options={HISTORY_VISIBILITY_OPTIONS}
                    value={current.viewHistoryVisibility}
                />
                <SwitchRow
                    description={
                        current.viewHistoryVisibility === 'DO_NOT_TRACK' ? t('privacy.analytics.disabledDescription') : t('privacy.analytics.description')
                    }
                    disabled={current.viewHistoryVisibility === 'DO_NOT_TRACK'}
                    label={t('privacy.analytics.label')}
                    onChange={toggleAnalytics}
                    value={current.behaviorAnalyticsEnabled}
                />
            </FormSection>
            <FormSection title={t('privacy.sections.sensitive.title')} description={t('privacy.sections.sensitive.description')}>
                <ChoiceCards
                    label={t('privacy.adultContent')}
                    layout="stacked"
                    onChange={option => run(updatePrivacy({ adultContentPreference: option }, queryClient))}
                    optionDescription={option => t(`privacy.descriptions.adultContent.${option}`)}
                    optionLabel={option => t(`privacy.option.${option}`)}
                    options={ADULT_CONTENT_OPTIONS}
                    value={current.adultContentPreference}
                />
                <SensitiveContentGuard adult preference={current.adultContentPreference} revealLabel={t('privacy.sensitivePreview.reveal')}>
                    <View style={{ backgroundColor: tokens.surfaceMuted, borderRadius: radii.card, padding: spacing.md }}>
                        <AppText>{t('privacy.sensitivePreview.content')}</AppText>
                    </View>
                </SensitiveContentGuard>
            </FormSection>
            {error && (
                <StatusMessage
                    actionLabel={t('privacy.retryWrite')}
                    onAction={() => run(retryPrivacyUpdate(queryClient))}
                    title={t('privacy.error')}
                    tone="danger"
                />
            )}
            {invalidationError && (
                <StatusMessage
                    actionLabel={t('privacy.retryConsumers')}
                    onAction={() => run(retryPrivacyConsumers(queryClient))}
                    title={t('privacy.consumerError')}
                    tone="danger"
                />
            )}
        </SectionStack>
    );
}
