import { View } from 'react-native';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

export interface ProgressStep {
    id: string;
    label: string;
}

interface ProgressStepsProps {
    steps: readonly ProgressStep[];
    currentIndex: number;
    accessibilityLabel: string;
}

export function ProgressSteps({ steps, currentIndex, accessibilityLabel }: ProgressStepsProps) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const current = steps[Math.min(Math.max(currentIndex, 0), steps.length - 1)];

    return (
        <View
            accessible
            accessibilityLabel={`${accessibilityLabel}. ${current?.label ?? ''}. ${currentIndex + 1}/${steps.length}`}
            accessibilityRole="progressbar"
            style={{ gap: spacing.sm }}
        >
            <View accessibilityElementsHidden style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}>
                {steps.map((step, index) => {
                    const complete = index < currentIndex;
                    const selected = index === currentIndex;
                    return (
                        <View key={step.id} style={{ alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.xs }}>
                            <View
                                style={{
                                    alignItems: 'center',
                                    backgroundColor: complete || selected ? tokens.accent : tokens.surface,
                                    borderColor: selected ? tokens.focus : tokens.separator,
                                    borderRadius: radii.pill,
                                    borderWidth: selected ? 2 : 1,
                                    height: Math.min(minimumTouchTarget, 28),
                                    justifyContent: 'center',
                                    width: Math.min(minimumTouchTarget, 28),
                                }}
                            >
                                {complete ? (
                                    <Icon name="checkmark" size={18} color={tokens.onAccent} />
                                ) : (
                                    <AppText variant="caption" style={{ color: selected ? tokens.onAccent : tokens.muted }}>
                                        {index + 1}
                                    </AppText>
                                )}
                            </View>
                            {index < steps.length - 1 ? (
                                <View style={{ backgroundColor: complete ? tokens.accent : tokens.separator, flex: 1, height: 2 }} />
                            ) : null}
                        </View>
                    );
                })}
            </View>
            <AppText variant="caption" tone="muted">
                {current?.label}
            </AppText>
        </View>
    );
}
