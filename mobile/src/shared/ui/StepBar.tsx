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
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                {steps.map((step, index) => (
                    <View
                        key={step}
                        testID={`${testID}-segment-${index}`}
                        style={{ backgroundColor: index <= currentIndex ? tokens.accent : tokens.separator, borderRadius: radii.pill, flex: 1, height: 4 }}
                    />
                ))}
            </View>
            <View style={{ alignItems: 'baseline', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <AppText variant="eyebrow" tone="accent">
                    {counterLabel}
                </AppText>
                <AppText variant="caption" tone="subtle">
                    {current}
                </AppText>
            </View>
        </View>
    );
}
