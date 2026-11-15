import { View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';

/** Opaque surface keeps the page number legible over any image. */
export function PageNumberBadge({ children, testID }: { children: string | number; testID?: string }) {
    const { radii, spacing, tokens } = useTheme();

    return (
        <View
            testID={testID}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
                alignItems: 'center',
                backgroundColor: tokens.surfaceElevated,
                borderColor: tokens.borderStrong,
                borderRadius: radii.pill,
                borderWidth: 1,
                justifyContent: 'center',
                left: spacing.xs + 2,
                minHeight: 22,
                minWidth: 22,
                paddingHorizontal: spacing.xs,
                position: 'absolute',
                top: spacing.xs + 2,
            }}
        >
            <AppText variant="caption" style={{ color: tokens.text }}>
                {children}
            </AppText>
        </View>
    );
}
