import { View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/shared/theme';

const LAUNCHER_HERO = require('../../../../assets/images/launcher-hero.png');
const LAUNCHER_HERO_LIGHT = require('../../../../assets/images/launcher-hero-light.png');

export function EditorialHero() {
    const { colorScheme, radii, tokens } = useTheme();

    return (
        <View
            testID="launcher-hero"
            accessibilityElementsHidden
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
                accessibilityLabel="Garota lendo um mangá em um universo dourado"
                source={colorScheme === 'light' ? LAUNCHER_HERO_LIGHT : LAUNCHER_HERO}
                style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
                contentFit="cover"
            />
        </View>
    );
}
