import { I18nManager, View } from 'react-native';

interface ProgressFillProps {
    /** Fraction filled, from 0 to 1; values outside are clamped. */
    value: number;
    color: string;
    testID?: string;
}

/**
 * Filled part of a progress track. It scales a full-size layer from the start edge (`scaleX`) instead of changing its
 * width, so a later animation never triggers layout (etapa 4 do plano de animações). The track must have a height and
 * `overflow: 'hidden'`.
 */
export function ProgressFill({ value, color, testID }: ProgressFillProps) {
    const ratio = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

    return (
        <View
            testID={testID}
            pointerEvents="none"
            style={{
                backgroundColor: color,
                bottom: 0,
                left: 0,
                position: 'absolute',
                right: 0,
                top: 0,
                transform: [{ scaleX: ratio }],
                transformOrigin: I18nManager.isRTL ? 'right' : 'left',
            }}
        />
    );
}
