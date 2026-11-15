import { View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/shared/theme';

const LAUNCHER_HERO = require('../../../../assets/images/launcher-hero.webp');
const LAUNCHER_HERO_LIGHT = require('../../../../assets/images/launcher-hero-light.webp');

export function EditorialHero() {
    const { colorScheme, radii, tokens } = useTheme();

    return (
        <View
            testID="launcher-hero"
            // Decorative: hidden from VoiceOver (iOS) and TalkBack (Android), so it needs no description.
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
                aspectRatio: 16 / 9,
                backgroundColor: tokens.heroSurface,
                borderColor: tokens.separator,
                borderRadius: radii.card,
                borderWidth: 1,
                overflow: 'hidden',
                width: '100%',
            }}
        >
            <Image
                accessible={false}
                source={colorScheme === 'light' ? LAUNCHER_HERO_LIGHT : LAUNCHER_HERO}
                style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
                contentFit="cover"
            />
        </View>
    );
}
