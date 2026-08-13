import { Alert, Text, View } from 'react-native';
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
import { AppText, Button, ChoiceGroup } from '@/src/shared/ui';

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

    if (!current) return hydrationError ? <Text style={{ color: tokens.danger }}>{t('privacy.error')}</Text> : null;

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

    const group = <T extends string>(label: string, options: readonly T[], value: T, onChange: (option: T) => void) => (
        <ChoiceGroup label={label} onChange={onChange} optionLabel={option => t(`privacy.option.${option}`)} options={options} value={value} />
    );

    return (
        <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
            <AppText accessibilityRole="header" variant="title">
                {t('privacy.title')}
            </AppText>
            {group(t('privacy.comments'), COMMENT_VISIBILITY_OPTIONS, current.commentVisibility, option =>
                run(updatePrivacy({ commentVisibility: option }, queryClient)),
            )}
            {group(t('privacy.history'), HISTORY_VISIBILITY_OPTIONS, current.viewHistoryVisibility, option =>
                run(changeHistoryVisibility(option, confirmDnt, queryClient)),
            )}
            {group(t('privacy.library'), LIBRARY_VISIBILITY_OPTIONS, current.libraryVisibility, option =>
                run(updatePrivacy({ libraryVisibility: option }, queryClient)),
            )}
            {group(t('privacy.adultContent'), ADULT_CONTENT_OPTIONS, current.adultContentPreference, option =>
                run(updatePrivacy({ adultContentPreference: option }, queryClient)),
            )}
            <SensitiveContentGuard adult preference={current.adultContentPreference} revealLabel={t('privacy.sensitivePreview.reveal')}>
                <View style={{ backgroundColor: tokens.surface, borderRadius: radii.card, padding: spacing.md }}>
                    <Text style={{ color: tokens.text }}>{t('privacy.sensitivePreview.content')}</Text>
                </View>
            </SensitiveContentGuard>
            <Button disabled={current.viewHistoryVisibility === 'DO_NOT_TRACK'} onPress={toggleAnalytics} variant="outline">
                {t(current.behaviorAnalyticsEnabled ? 'privacy.analytics.disable' : 'privacy.analytics.enable')}
            </Button>
            {error && (
                <View style={{ gap: spacing.sm }}>
                    <Text accessibilityRole="alert" style={{ color: tokens.danger }}>
                        {t('privacy.error')}
                    </Text>
                    <Button onPress={() => run(retryPrivacyUpdate(queryClient))} variant="outline">
                        {t('privacy.retryWrite')}
                    </Button>
                </View>
            )}
            {invalidationError && (
                <View style={{ gap: spacing.sm }}>
                    <Text accessibilityRole="alert" style={{ color: tokens.danger }}>
                        {t('privacy.consumerError')}
                    </Text>
                    <Button onPress={() => run(retryPrivacyConsumers(queryClient))} variant="outline">
                        {t('privacy.retryConsumers')}
                    </Button>
                </View>
            )}
        </View>
    );
}
