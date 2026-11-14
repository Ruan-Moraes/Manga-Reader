import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { appMetadata, type ExternalLinkKey, externalLinks, useDeveloperMode } from '@/shared/config';
import { navigateBackOrReplace, ROUTES, useScreenRefocus } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { AppText, Button, FormSection, type IconName, ListRow, ScreenScaffold, SectionStack, SwitchRow } from '@/shared/ui';

const LINK_ICONS: Record<ExternalLinkKey, IconName> = {
    privacy: 'shield-checkmark-outline',
    project: 'logo-github',
    support: 'help-buoy-outline',
    terms: 'document-text-outline',
};

export function SettingsAboutPage() {
    const { t } = useTranslation('settingsNavigation');
    const { spacing } = useTheme();
    const metadata = useMemo(() => appMetadata.read(), []);
    const links = useMemo(() => externalLinks.read(), []);
    const [failedLink, setFailedLink] = useState<{ key: ExternalLinkKey; url: string } | null>(null);
    const developer = useDeveloperMode();
    const hydrateDeveloper = developer.hydrate;
    const sequence = useRef({ taps: 0, readyAt: 0 });
    const writing = useRef(false);
    const [developerError, setDeveloperError] = useState(false);
    const resetSequence = useCallback(() => {
        sequence.current = { taps: 0, readyAt: 0 };
    }, []);
    useScreenRefocus(resetSequence);
    useEffect(() => {
        const listener = AppState.addEventListener('change', state => {
            if (state !== 'active') resetSequence();
        });
        return () => listener.remove();
    }, [resetSequence]);
    const saveDeveloper = async (save: () => Promise<void>) => {
        if (writing.current) return;
        writing.current = true;
        setDeveloperError(false);
        try {
            await save();
        } catch {
            setDeveloperError(true);
        } finally {
            writing.current = false;
        }
    };
    useEffect(() => {
        void hydrateDeveloper();
    }, [hydrateDeveloper]);
    const unlockDeveloper = () => {
        if (!developer.hydrated || developer.unlocked || writing.current) return;
        const now = performance.now();
        const step = sequence.current;
        if (now < step.readyAt) {
            resetSequence();
            return;
        }
        step.taps += 1;
        if (step.taps === 7 || step.taps === 14) step.readyAt = now + 5_000;
        if (step.taps === 15) {
            resetSequence();
            void saveDeveloper(developer.unlock);
        }
    };

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
                        <ListRow
                            meta={metadata.version}
                            onPress={unlockDeveloper}
                            showChevron={false}
                            showDivider={Boolean(metadata.build) || developer.unlocked}
                            title={t('about.version')}
                            variant="plain"
                        />
                    ) : null}
                    {metadata.build ? <ListRow meta={metadata.build} showDivider={false} title={t('about.build')} variant="plain" /> : null}
                    {developer.unlocked ? (
                        <View style={{ paddingHorizontal: spacing.md }}>
                            <SwitchRow
                                label={t('about.developerMode')}
                                description={t('about.developerDescription')}
                                value={developer.enabled}
                                onChange={value => void saveDeveloper(() => developer.setEnabled(value))}
                            />
                        </View>
                    ) : null}
                    {developerError ? (
                        <AppText accessibilityRole="alert" tone="danger" style={{ padding: spacing.md }}>
                            {t('about.developerError')}
                        </AppText>
                    ) : null}
                </FormSection>
                <FormSection contentPadding="none" title={t('about.linksSection.title')} description={t('about.linksSection.description')}>
                    {(Object.entries(links) as [ExternalLinkKey, string][]).map(([key, url], index, entries) => (
                        <ListRow
                            description={t(`about.linkDescriptions.${key}`)}
                            key={key}
                            icon={LINK_ICONS[key]}
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
