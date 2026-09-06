import { View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/shared/theme';

const LAUNCHER_HERO = require('../../../../assets/images/launcher-hero.png');
const LAUNCHER_HERO_LIGHT = require('../../../../assets/images/launcher-hero-light.png');

export function EditorialHero() {
    const { colorScheme, radii, spacing, tokens } = useTheme();

    return (
        <View
            accessibilityElementsHidden
            style={{
                backgroundColor: tokens.heroSurface,
                borderColor: tokens.borderStrong,
                borderRadius: radii.control,
                borderWidth: 1,
                height: 218,
                justifyContent: 'center',
                overflow: 'hidden',
                padding: spacing.lg,
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
