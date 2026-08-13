import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ImageVariantCapabilities } from '@/src/entities/chapter';
import type { ImageQuality, ReaderBackground, ReaderSettings, ReadingDirection, ReadingFit, ReadingMode } from '@/src/entities/user-setting';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, ChoiceGroup } from '@/src/shared/ui';

import { selectableQualities } from '../model/readerConfiguration';

const MODES: readonly ReadingMode[] = ['VERTICAL', 'PAGED', 'DOUBLE'];
const DIRECTIONS: readonly ReadingDirection[] = ['LTR', 'RTL', 'WEBTOON'];
const FITS: readonly ReadingFit[] = ['WIDTH', 'HEIGHT', 'ORIGINAL'];
const BACKGROUNDS: readonly ReaderBackground[] = ['BLACK', 'DARK', 'PAPER', 'LIGHT', 'WHITE'];

interface Props {
    value: ReaderSettings;
    capabilities: ImageVariantCapabilities;
    onChange: (patch: Partial<ReaderSettings>) => void;
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
    const { t } = useTranslation('reader');
    const { spacing } = useTheme();
    return (
        <View style={{ gap: spacing.xs }}>
            <AppText variant="label">{`${label}: ${value}`}</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {([-1, 1] as const).map(delta => (
                    <Button
                        key={delta}
                        accessibilityLabel={delta < 0 ? t('controls.decrease', { label }) : t('controls.increase', { label })}
                        disabled={delta < 0 ? value <= min : value >= max}
                        fullWidth={false}
                        onPress={() => onChange(Math.min(max, Math.max(min, value + delta)))}
                        size="compact"
                        variant="outline"
                    >
                        {delta < 0 ? '−' : '+'}
                    </Button>
                ))}
            </View>
        </View>
    );
}

export function ReaderSettingsControls({ value, capabilities, onChange }: Props) {
    const { t } = useTranslation('reader');
    const { spacing } = useTheme();
    const qualities = selectableQualities(capabilities);
    return (
        <View style={{ gap: spacing.md }}>
            <ChoiceGroup
                label={t('settings.mode')}
                optionLabel={option => t(`options.${option}`)}
                value={value.mode}
                options={MODES}
                onChange={mode => onChange({ mode })}
            />
            <ChoiceGroup
                label={t('settings.direction')}
                optionLabel={option => t(`options.${option}`)}
                value={value.direction}
                options={DIRECTIONS}
                onChange={direction => onChange({ direction })}
            />
            <ChoiceGroup
                label={t('settings.fit')}
                optionLabel={option => t(`options.${option}`)}
                value={value.fit}
                options={FITS}
                onChange={fit => onChange({ fit })}
            />
            <ChoiceGroup
                label={t('settings.quality')}
                optionLabel={option => t(`options.${option}`)}
                value={qualities.includes(value.quality) ? value.quality : 'AUTO'}
                options={qualities}
                onChange={(quality: ImageQuality) => onChange({ quality })}
            />
            <ChoiceGroup
                label={t('settings.background')}
                optionLabel={option => t(`options.${option}`)}
                value={value.background}
                options={BACKGROUNDS}
                onChange={background => onChange({ background })}
            />
            <Stepper label={t('settings.saturation')} value={value.saturation} min={0} max={100} onChange={saturation => onChange({ saturation })} />
            <Stepper label={t('settings.gap')} value={value.gap} min={0} max={32} onChange={gap => onChange({ gap })} />
            <Stepper label={t('settings.preload')} value={value.preload} min={0} max={10} onChange={preload => onChange({ preload })} />
        </View>
    );
}
