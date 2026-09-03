import { Fragment } from 'react';
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
    const markerSize = Math.min(minimumTouchTarget, 28);
    const labelWidth = markerSize * 3;

    return (
        <View
            accessible
            accessibilityLabel={`${accessibilityLabel}. ${current?.label ?? ''}. ${currentIndex + 1}/${steps.length}`}
            accessibilityRole="progressbar"
            style={{ alignItems: 'center', alignSelf: 'stretch', gap: spacing.sm, marginHorizontal: spacing.xs }}
        >
            <View accessibilityElementsHidden style={{ alignItems: 'center', alignSelf: 'stretch', flexDirection: 'row' }}>
                {steps.map((step, index) => {
                    const complete = index < currentIndex;
                    const selected = index === currentIndex;
                    return (
                        <Fragment key={step.id}>
                            <View
                                style={{
                                    alignItems: 'center',
                                    backgroundColor: complete || selected ? tokens.accent : tokens.surface,
                                    borderColor: selected ? tokens.focus : tokens.separator,
                                    borderRadius: radii.pill,
                                    borderWidth: selected ? 2 : 1,
                                    height: markerSize,
                                    justifyContent: 'center',
                                    width: markerSize,
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
                                <View className="h-0.5 flex-1" style={{ backgroundColor: complete ? tokens.accent : tokens.separator }} />
                            ) : null}
                        </Fragment>
                    );
                })}
            </View>
            <View style={{ alignItems: 'center', alignSelf: 'stretch', flexDirection: 'row' }}>
                {steps.map((step, index) => (
                    <Fragment key={step.id}>
                        <View style={{ alignItems: 'center', overflow: 'visible', width: markerSize }}>
                            {step.id === current?.id ? (
                                <AppText variant="caption" tone="muted" style={{ textAlign: 'center', width: labelWidth }}>
                                    {step.label}
                                </AppText>
                            ) : null}
                        </View>
                        {index < steps.length - 1 ? <View style={{ flex: 1 }} /> : null}
                    </Fragment>
                ))}
            </View>
        </View>
    );
}
