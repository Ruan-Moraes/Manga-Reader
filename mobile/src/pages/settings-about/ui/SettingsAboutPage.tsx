import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { appMetadata, type ExternalLinkKey, externalLinks } from '@/src/shared/config';
import { navigateBackOrReplace, ROUTES } from '@/src/shared/navigation';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, FormSection, Icon, type IconName, ListRow, ScreenScaffold, SectionStack } from '@/src/shared/ui';

const LINK_ICONS: Record<ExternalLinkKey, IconName> = {
    privacy: 'shield-checkmark-outline',
    project: 'logo-github',
    support: 'help-buoy-outline',
    terms: 'document-text-outline',
};

export function SettingsAboutPage() {
    const { t } = useTranslation('settingsNavigation');
    const { radii, spacing, tokens } = useTheme();
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
            eyebrow={t('sections.about.title')}
            onBack={() => navigateBackOrReplace(ROUTES.SETTINGS.INDEX)}
            title={t('sections.about.editorialTitle')}
        >
            <SectionStack>
                <FormSection contentPadding="none" title={t('about.appSection.title')} description={t('about.appSection.description')}>
                    {metadata.version ? (
                        <ListRow meta={metadata.version} showDivider={Boolean(metadata.build)} title={t('about.version')} variant="plain" />
                    ) : null}
                    {metadata.build ? <ListRow meta={metadata.build} showDivider={false} title={t('about.build')} variant="plain" /> : null}
                </FormSection>
                <FormSection contentPadding="none" title={t('about.linksSection.title')} description={t('about.linksSection.description')}>
                    {(Object.entries(links) as [ExternalLinkKey, string][]).map(([key, url], index, entries) => (
                        <ListRow
                            description={t(`about.linkDescriptions.${key}`)}
                            key={key}
                            leading={
                                <View
                                    accessibilityElementsHidden
                                    style={{
                                        alignItems: 'center',
                                        backgroundColor: tokens.accentSoft,
                                        borderRadius: radii.control,
                                        height: 42,
                                        justifyContent: 'center',
                                        width: 42,
                                    }}
                                >
                                    <Icon name={LINK_ICONS[key]} color={tokens.accentText} decorative />
                                </View>
                            }
                            onPress={() => void open(key, url)}
                            showDivider={index < entries.length - 1}
                            title={t(`about.links.${key}`)}
                            variant="plain"
                        />
                    ))}
                </FormSection>
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
            </SectionStack>
        </ScreenScaffold>
    );
}
