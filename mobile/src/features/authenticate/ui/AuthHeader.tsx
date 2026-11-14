import { View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

const LOGIN_HERO = require('../../../../assets/images/login-hero.webp');
const LOGIN_HERO_LIGHT = require('../../../../assets/images/login-hero-light.webp');

const ARTWORK_HEIGHT = 152;

interface Props {
    /** `minimal` keeps the same page heading without artwork. */
    layout?: 'mascote' | 'minimal';
    artwork?: boolean;
    eyebrow?: string;
    title: string;
    sub?: string;
}

/** Page heading of the account screens: optional artwork, eyebrow, display title and supporting text. */
export function AuthHeader({ layout = 'mascote', artwork = false, eyebrow, title, sub }: Props) {
    const { t } = useTranslation('auth');
    const { colorScheme, radii, spacing, tokens } = useTheme();

    const showArtwork = artwork && layout !== 'minimal';

    return (
        <View style={{ marginBottom: spacing.lg }}>
            {showArtwork ? (
                <View
                    testID="auth-header-artwork"
                    // Decorative: hidden from VoiceOver (iOS) and TalkBack (Android) (revisão 2026-11-13).
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{
                        backgroundColor: tokens.heroSurface,
                        borderColor: tokens.separator,
                        borderRadius: radii.card,
                        borderWidth: 1,
                        height: ARTWORK_HEIGHT,
                        marginBottom: spacing.lg,
                        overflow: 'hidden',
                        width: '100%',
                    }}
                >
                    <Image
                        accessibilityLabel={t('artwork.libraryDoor')}
                        source={colorScheme === 'light' ? LOGIN_HERO_LIGHT : LOGIN_HERO}
                        style={{ height: '100%', position: 'absolute', width: '100%' }}
                        contentFit="cover"
                    />
                </View>
            ) : null}
            <View style={{ gap: spacing.xs }}>
                {eyebrow ? (
                    <AppText variant="eyebrow" tone="accent">
                        {eyebrow}
                    </AppText>
                ) : null}
                <AppText accessibilityRole="header" variant="display">
                    {title}
                </AppText>
                {sub ? <AppText tone="muted">{sub}</AppText> : null}
            </View>
        </View>
    );
}
