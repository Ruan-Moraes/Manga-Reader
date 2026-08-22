import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/src/shared/theme';
import { AppText } from '@/src/shared/ui';

export function EditorialHero() {
    const { radii, spacing, tokens } = useTheme();

    return (
        <View
            accessibilityElementsHidden
            style={{
                backgroundColor: tokens.heroSurface,
                borderRadius: radii.feature,
                height: 218,
                justifyContent: 'center',
                overflow: 'hidden',
                padding: spacing.lg,
            }}
        >
            <Svg height="100%" width="100%" viewBox="0 0 360 218" style={{ position: 'absolute' }}>
                <Circle cx="36" cy="198" r="82" fill="none" stroke={tokens.heroLine} strokeWidth="1" />
                <Circle cx="332" cy="44" r="104" fill="none" stroke={tokens.heroLine} strokeWidth="1" />
                <Path d="M180 26 L202 89 L330 109 L202 129 L180 192 L158 129 L30 109 L158 89 Z" fill={tokens.heroAccent} />
            </Svg>
            <AppText variant="eyebrow" tone="inverse" style={{ marginTop: 'auto', letterSpacing: 1.7 }}>
                MANGA READER TRANSLATE
            </AppText>
        </View>
    );
}
