import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { appMetadata, type ExternalLinkKey, externalLinks } from '@/src/shared/config';
import { useTheme } from '@/src/shared/theme';
import { Button, ScreenScaffold } from '@/src/shared/ui';

export function SettingsAboutPage() {
    const { t } = useTranslation('settingsNavigation');
    const { spacing, tokens, typography } = useTheme();
    const metadata = useMemo(() => appMetadata.read(), []);
    const links = useMemo(() => externalLinks.read(), []);
    const [failedLink, setFailedLink] = useState<{ key: ExternalLinkKey; url: string } | null>(null);

    const open = async (key: ExternalLinkKey, url: string) => {
        setFailedLink(null);
        try {
            await externalLinks.open(url);
        } catch {
            setFailedLink({ key, url });
        }
    };

    return (
        <ScreenScaffold backLabel={t('actions.back')} title={t('about.title')}>
            <View style={{ gap: spacing.md }}>
                {metadata.version ? (
                    <Text style={{ color: tokens.text, fontSize: typography.body }}>
                        {t('about.version')}: {metadata.version}
                    </Text>
                ) : null}
                {metadata.build ? (
                    <Text style={{ color: tokens.text, fontSize: typography.body }}>
                        {t('about.build')}: {metadata.build}
                    </Text>
                ) : null}
                {(Object.entries(links) as [ExternalLinkKey, string][]).map(([key, url]) => (
                    <Button fullWidth={false} key={key} onPress={() => void open(key, url)} variant="outline">
                        {t(`about.links.${key}`)}
                    </Button>
                ))}
                {failedLink ? (
                    <View accessibilityLiveRegion="assertive" style={{ gap: spacing.sm }}>
                        <Text accessibilityRole="alert" style={{ color: tokens.danger }}>
                            {t('about.openError')}
                        </Text>
                        <Button fullWidth={false} onPress={() => void open(failedLink.key, failedLink.url)} variant="outline">
                            {t('about.retry')}
                        </Button>
                    </View>
                ) : null}
            </View>
        </ScreenScaffold>
    );
}
