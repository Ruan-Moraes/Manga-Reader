import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/shared/theme';
import { Button } from '@/src/shared/ui';

import { type SettingsSyncGroup, useSettingsStore } from '../model/settingsStore';

export function SettingsSyncStatus({ group }: { group: SettingsSyncGroup }) {
    const { t } = useTranslation('settingsNavigation');
    const { spacing, tokens, typography } = useTheme();
    const activeIdentityEpoch = useSettingsStore(state => state.activeIdentityEpoch);
    const pendingGroup = useSettingsStore(state => state.pendingGroup);
    const pendingVersion = useSettingsStore(state => state.pendingVersion);
    const syncStatus = useSettingsStore(state => state.syncStatus);
    const retry = useSettingsStore(state => state.retry);
    const belongs = pendingGroup === null || pendingGroup === group;
    const status =
        activeIdentityEpoch === null
            ? 'local'
            : syncStatus === 'error' && belongs
              ? 'error'
              : syncStatus === 'syncing' && belongs
                ? 'syncing'
                : pendingVersion !== null && pendingGroup === group
                  ? 'pending'
                  : 'synced';

    if (status === 'local' || status === 'synced') return null;

    return (
        <View accessibilityLiveRegion="polite" style={{ gap: spacing.sm }}>
            <Text
                accessibilityRole={status === 'error' ? 'alert' : 'text'}
                style={{ color: status === 'error' ? tokens.danger : tokens.muted, fontSize: typography.small }}
            >
                {t(`sync.${status}`)}
            </Text>
            {status === 'error' ? (
                <Button fullWidth={false} onPress={() => void retry()} variant="outline">
                    {t('sync.retry')}
                </Button>
            ) : null}
        </View>
    );
}
