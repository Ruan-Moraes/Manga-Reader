import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { useSessionStore } from '@/entities/session';
import { usePrivacySettingsStore } from '@/entities/user';
import { useDataControlsStore } from '@/features/data-controls';
import { useContentLanguagesStore } from '@/features/manage-content-languages';
import { useSettingsStore } from '@/features/manage-settings';
import { resolveSettingsAccess, SETTINGS_SECTIONS, type SettingsGroup, type SettingsSectionId } from '@/features/navigate-settings';
import { usePrivacyMutationStore } from '@/features/update-privacy';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { AppText, type IconName, NavigationHeader, PageContainer } from '@/shared/ui';
import { SettingsGroupCard, SettingsIndex, type SettingsIndexItem, SettingsSections } from '@/widgets/settings-index';

type VisibleStatus = 'local' | 'pending' | 'syncing' | 'synced' | 'error';

const SETTINGS_ICONS: Record<SettingsSectionId, IconName> = {
    'appearance-accessibility': 'contrast-outline',
    'interface-language-region': 'language-outline',
    'content-languages': 'chatbubbles-outline',
    reader: 'book-outline',
    privacy: 'shield-checkmark-outline',
    data: 'server-outline',
    about: 'information-circle-outline',
};

const GROUPS = ['app', 'reading', 'device', 'account'] as const;

export function SettingsIndexPage() {
    const { t } = useTranslation('settingsNavigation');

    const { fontScale, layout, spacing } = useTheme();

    const isAuthenticated = useSessionStore(state => state.isAuthenticated);
    // Only the fields behind each row's status: the index stays mounted under the settings pages and must not
    // re-render on every unrelated store change (revisão 2026-11-13).
    const settings = useSettingsStore(
        useShallow(state => ({ pendingGroup: state.pendingGroup, pendingVersion: state.pendingVersion, syncStatus: state.syncStatus })),
    );
    const content = useContentLanguagesStore(
        useShallow(state => ({
            consumerRetrying: state.consumerRetrying,
            hydrationStatus: state.hydrationStatus,
            invalidationError: Boolean(state.invalidationError),
            pending: Boolean(state.pending),
            readError: Boolean(state.readError),
            syncStatus: state.syncStatus,
            writeError: Boolean(state.writeError),
        })),
    );
    const privacyError = usePrivacySettingsStore(state => Boolean(state.error));
    const privacyMutation = usePrivacyMutationStore(
        useShallow(state => ({ error: Boolean(state.error), invalidationError: Boolean(state.invalidationError), syncStatus: state.syncStatus })),
    );
    const data = useDataControlsStore(useShallow(state => ({ busyAction: state.busyAction, errorKey: state.errorKey })));

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

            if (privacyError || privacyMutation.error || privacyMutation.invalidationError || privacyMutation.syncStatus === 'error') return 'error';

            return privacyMutation.syncStatus === 'syncing' ? 'syncing' : 'synced';
        }

        if (id === 'data') return data.errorKey ? 'error' : data.busyAction ? 'syncing' : 'local';

        return 'local';
    };

    const items: (SettingsIndexItem & { group: SettingsGroup })[] = SETTINGS_SECTIONS.map(section => {
        const access = resolveSettingsAccess(section, isAuthenticated);

        const status = statusFor(section.id);

        const visibleStatus = status === 'error' || status === 'pending' || status === 'syncing';

        return {
            id: section.id,
            title: t(section.titleKey.replace('settingsNavigation.', '')),
            description: t(section.descriptionKey.replace('settingsNavigation.', '')),
            statusLabel: visibleStatus ? t(`sync.${status}`) : undefined,
            statusTone: status === 'error' ? 'danger' : status === 'synced' ? 'success' : status === 'pending' || status === 'syncing' ? 'warning' : 'neutral',
            loginRequired: access.kind === 'authenticate',
            icon: SETTINGS_ICONS[section.id],
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
            {/* Header outside the section gap: same header rhythm as every screen (revisão 2026-11-14). */}
            <NavigationHeader
                backLabel={t('actions.backToModules')}
                onBack={() => navigateBackOrReplace(ROUTES.ROOT)}
                title={fontScale < 1.6 ? t('index.title') : undefined}
            />
            <View style={{ flex: 1, gap: layout.sectionGap, paddingBottom: spacing.xl }}>
                <View style={{ gap: spacing.sm }}>
                    <AppText variant="eyebrow" tone="accent">
                        {t('index.eyebrow')}
                    </AppText>
                    <AppText accessibilityRole="header" variant="display">
                        {t('index.editorialTitle')}
                    </AppText>
                    <AppText tone="muted">{t('index.subtitle')}</AppText>
                </View>
                <SettingsSections>
                    {GROUPS.map(group => (
                        <SettingsGroupCard key={group} title={t(`groups.${group}.title`)} description={t(`groups.${group}.description`)}>
                            <SettingsIndex
                                items={items.filter(item => item.group === group)}
                                loginRequiredLabel={t('access.loginRequired')}
                                openHint={title => t('actions.open', { section: title })}
                            />
                        </SettingsGroupCard>
                    ))}
                </SettingsSections>
            </View>
        </PageContainer>
    );
}
