import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/src/entities/session';
import { usePrivacySettingsStore } from '@/src/entities/user';
import { useDataControlsStore } from '@/src/features/data-controls';
import { useContentLanguagesStore } from '@/src/features/manage-content-languages';
import { useSettingsStore } from '@/src/features/manage-settings';
import { resolveSettingsAccess, SETTINGS_SECTIONS, type SettingsGroup, type SettingsSectionId } from '@/src/features/navigate-settings';
import { usePrivacyMutationStore } from '@/src/features/update-privacy';
import { ROUTES } from '@/src/shared/navigation';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, PageContainer, Section } from '@/src/shared/ui';
import { SettingsIndex, type SettingsIndexItem, SettingsSections } from '@/src/widgets/settings-index';

type VisibleStatus = 'local' | 'pending' | 'syncing' | 'synced' | 'error';

export function SettingsIndexPage() {
    const { t } = useTranslation('settingsNavigation');
    const { layout, spacing } = useTheme();
    const isAuthenticated = useSessionStore(state => state.isAuthenticated);
    const settings = useSettingsStore();
    const content = useContentLanguagesStore();
    const privacy = usePrivacySettingsStore();
    const privacyMutation = usePrivacyMutationStore();
    const data = useDataControlsStore();

    const settingsStatus = (group: 'appearance' | 'locale' | 'reader'): VisibleStatus => {
        if (!isAuthenticated) return 'local';
        if (settings.syncStatus === 'error' && (settings.pendingGroup === null || settings.pendingGroup === group)) return 'error';
        if (settings.syncStatus === 'syncing' && (settings.pendingGroup === null || settings.pendingGroup === group)) return 'syncing';
        if (settings.pendingVersion !== null && settings.pendingGroup === group) return 'pending';
        return 'synced';
    };
    const statusFor = (id: SettingsSectionId): VisibleStatus => {
        if (id === 'appearance-accessibility') return settingsStatus('appearance');
        if (id === 'interface-language-region') return settingsStatus('locale');
        if (id === 'reader') return settingsStatus('reader');
        if (id === 'content-languages') {
            if (!isAuthenticated) return 'local';
            if (content.readError || content.writeError || content.invalidationError || content.syncStatus === 'error') return 'error';
            if (content.hydrationStatus === 'loading' || content.syncStatus === 'syncing' || content.consumerRetrying) return 'syncing';
            return content.pending ? 'pending' : 'synced';
        }
        if (id === 'privacy') {
            if (!isAuthenticated) return 'local';
            if (privacy.error || privacyMutation.error || privacyMutation.invalidationError || privacyMutation.syncStatus === 'error') return 'error';
            return privacyMutation.syncStatus === 'syncing' ? 'syncing' : 'synced';
        }
        if (id === 'data') return data.errorKey ? 'error' : data.busyAction ? 'syncing' : 'local';
        return 'local';
    };

    const items: (SettingsIndexItem & { group: SettingsGroup })[] = SETTINGS_SECTIONS.map(section => {
        const access = resolveSettingsAccess(section, isAuthenticated);
        const status = statusFor(section.id);
        return {
            id: section.id,
            title: t(section.titleKey.replace('settingsNavigation.', '')),
            description: t(section.descriptionKey.replace('settingsNavigation.', '')),
            statusLabel: t(`sync.${status}`),
            loginRequired: access.kind === 'authenticate',
            group: section.group,
            onPress: () => {
                if (access.kind === 'authenticate') {
                    router.push({ pathname: access.route, params: { returnTo: access.returnTo } } as never);
                } else {
                    router.push(access.route as never);
                }
            },
        };
    });

    return (
        <PageContainer scroll>
            <View style={{ flex: 1, gap: layout.sectionGap, paddingBottom: spacing.xl, paddingTop: spacing.xl }}>
                <View style={{ gap: spacing.sm }}>
                    <AppText accessibilityRole="header" variant="display">
                        {t('index.title')}
                    </AppText>
                    <AppText tone="muted">{t('index.subtitle')}</AppText>
                </View>
                <SettingsSections>
                    {(['app', 'reading', 'device', 'account'] as const).map(group => (
                        <Section key={group} title={t(`groups.${group}`)}>
                            <SettingsIndex
                                items={items.filter(item => item.group === group)}
                                loginRequiredLabel={t('access.loginRequired')}
                                openHint={t('actions.open', { section: t('index.title') })}
                            />
                        </Section>
                    ))}
                </SettingsSections>
                <Button onPress={() => router.replace(ROUTES.ROOT as never)} variant="ghost">
                    {t('actions.backToModules')}
                </Button>
            </View>
        </PageContainer>
    );
}
