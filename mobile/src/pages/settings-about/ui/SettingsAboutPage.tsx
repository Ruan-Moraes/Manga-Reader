import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { appMetadata, type ExternalLinkKey, externalLinks } from '@/src/shared/config';
import { navigateBackOrReplace, ROUTES } from '@/src/shared/navigation';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, Card, ScreenScaffold } from '@/src/shared/ui';

export function SettingsAboutPage() {
    const { t } = useTranslation('settingsNavigation');
    const { spacing } = useTheme();
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
        <ScreenScaffold
            backLabel={t('actions.back')}
            description={t('sections.about.description')}
            onBack={() => navigateBackOrReplace(ROUTES.SETTINGS.INDEX)}
            title={t('about.title')}
        >
            <View style={{ gap: spacing.md }}>
                <Card>
                    <View style={{ gap: spacing.sm }}>
                        {metadata.version ? (
                            <AppText variant="label">
                                {t('about.version')}: {metadata.version}
                            </AppText>
                        ) : null}
                        {metadata.build ? (
                            <AppText tone="muted">
                                {t('about.build')}: {metadata.build}
                            </AppText>
                        ) : null}
                    </View>
                </Card>
                {(Object.entries(links) as [ExternalLinkKey, string][]).map(([key, url]) => (
                    <Button fullWidth={false} key={key} onPress={() => void open(key, url)} variant="outline">
                        {t(`about.links.${key}`)}
                    </Button>
                ))}
                {failedLink ? (
                    <View accessibilityLiveRegion="assertive" style={{ gap: spacing.sm }}>
                        <AppText accessibilityRole="alert" tone="danger">
                            {t('about.openError')}
                        </AppText>
                        <Button fullWidth={false} onPress={() => void open(failedLink.key, failedLink.url)} variant="outline">
                            {t('about.retry')}
                        </Button>
                    </View>
                ) : null}
            </View>
        </ScreenScaffold>
    );
}
