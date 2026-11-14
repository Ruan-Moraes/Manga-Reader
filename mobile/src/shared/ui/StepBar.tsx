import { View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';

interface StepBarProps {
    steps: readonly string[];
    currentIndex: number;
    /** e.g. "Etapa 2 de 3"; the current step name is appended. */
    counterLabel: string;
    testID?: string;
}

/** Compact progress of a short flow: one segment per step and the current step named. */
export function StepBar({ steps, currentIndex, counterLabel, testID = 'step-bar' }: StepBarProps) {
    const { radii, spacing, tokens } = useTheme();
    const current = steps[currentIndex] ?? '';
    return (
        <View
            testID={testID}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`${counterLabel}: ${current}`}
            accessibilityValue={{ min: 1, max: steps.length, now: currentIndex + 1 }}
            style={{ gap: spacing.xs }}
        >
            <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: spacing.xs }}>
                {steps.map((step, index) => (
                    <View key={step} testID={`${testID}-column-${index}`} style={{ flex: 1, gap: spacing.xs }}>
                        {index === currentIndex ? (
                            <AppText variant="caption" tone="accent" style={{ textAlign: 'center' }}>
                                {current}
                            </AppText>
                        ) : null}
                        <View
                            testID={`${testID}-segment-${index}`}
                            style={{ backgroundColor: index <= currentIndex ? tokens.accent : tokens.separator, borderRadius: radii.pill, height: 4 }}
                        />
                    </View>
                ))}
            </View>
            <AppText variant="eyebrow" tone="accent">
                {counterLabel}
            </AppText>
        </View>
    );
}
