import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { externalLinks, useExternalLinkOpener } from '@/shared/config';
import { useTheme } from '@/shared/theme';
import { AppText, TextAction } from '@/shared/ui';

type LegalKey = 'terms' | 'privacy';

/**
 * MOB-FEAT-064: configured Terms of Use and Privacy Policy destinations plus a browser opener that remembers a
 * failed attempt. Nothing is offered while a destination is missing.
 */
export function useLegalLinks() {
    const links = useMemo(() => externalLinks.read(), []);
    const opener = useExternalLinkOpener();
    return { terms: links.terms, privacy: links.privacy, ...opener };
}

type LegalLinksState = ReturnType<typeof useLegalLinks>;

interface LegalLinkProps {
    legal: LegalLinksState;
    kind: LegalKey;
    label: string;
}

/**
 * A policy name inside a sentence (revisão 2026-11-13): only the name is a link, so the rest of the sentence keeps
 * its own meaning (e.g. ticking the sign-up acceptance). Plain text when the destination is not configured.
 */
export function LegalLink({ legal, kind, label }: LegalLinkProps) {
    const url = legal[kind];
    if (!url) return <>{label}</>;
    return (
        // Plain Text so the link inherits the size, font and color of the sentence it sits in.
        <Text accessibilityRole="link" onPress={() => void legal.open(url)} style={{ textDecorationLine: 'underline' }}>
            {label}
        </Text>
    );
}

/** Localized error with a retry for the last policy that failed to open. */
export function LegalLinkError({ legal, align = 'start' }: { legal: LegalLinksState; align?: 'start' | 'center' }) {
    const { t } = useTranslation('auth');
    if (!legal.failedUrl) return null;
    return (
        <View accessibilityLiveRegion="assertive" style={{ alignItems: align === 'center' ? 'center' : 'flex-start' }}>
            <AppText accessibilityRole="alert" variant="caption" tone="danger" style={{ textAlign: align === 'center' ? 'center' : 'left' }}>
                {t('legal.openError')}
            </AppText>
            <TextAction align={align} label={t('legal.retry')} onPress={legal.retry} />
        </View>
    );
}

/**
 * Sign-in notice under the primary button (revisão 2026-11-13, VSCO-style): "Ao entrar, você concorda com os
 * Termos de uso e a Política de privacidade." Renders nothing without configured destinations.
 */
export function SignInLegalNotice() {
    const { spacing } = useTheme();
    const { t } = useTranslation('auth');
    const legal = useLegalLinks();
    if (!legal.terms && !legal.privacy) return null;

    return (
        <View testID="sign-in-legal-notice" style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                {t('login.legalPrefix')} <LegalLink legal={legal} kind="terms" label={t('legal.terms')} /> {t('login.legalAnd')}{' '}
                <LegalLink legal={legal} kind="privacy" label={t('legal.privacy')} />
                {t('login.legalEnd')}
            </AppText>
            <LegalLinkError legal={legal} align="center" />
        </View>
    );
}
