import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ImageVariantCapabilities } from '@/src/entities/chapter';
import type { ImageQuality, ReaderBackground, ReaderSettings, ReadingDirection, ReadingFit, ReadingMode } from '@/src/entities/user-setting';
import { useTheme } from '@/src/shared/theme';
import { ChoiceCards, FormSection, type IconName, RangeSlider, SegmentedControl, SelectField, StepperControl, SwitchRow } from '@/src/shared/ui';

import { selectableQualities } from '../model/readerConfiguration';

const MODES: readonly ReadingMode[] = ['VERTICAL', 'PAGED', 'DOUBLE'];
const DIRECTIONS: readonly ReadingDirection[] = ['LTR', 'RTL', 'WEBTOON'];
const FITS: readonly ReadingFit[] = ['WIDTH', 'HEIGHT', 'ORIGINAL'];
const BACKGROUNDS: readonly ReaderBackground[] = ['BLACK', 'DARK', 'PAPER', 'LIGHT', 'WHITE'];
const MODE_ICONS: Record<ReadingMode, IconName> = { VERTICAL: 'swap-vertical-outline', PAGED: 'copy-outline', DOUBLE: 'albums-outline' };
const DIRECTION_ICONS: Record<ReadingDirection, IconName> = { LTR: 'arrow-forward-outline', RTL: 'arrow-back-outline', WEBTOON: 'arrow-down-outline' };
interface Props {
    value: ReaderSettings;
    capabilities: ImageVariantCapabilities;
    onChange: (patch: Partial<ReaderSettings>) => void;
}

function Stepper({
    label,
    description,
    value,
    min,
    max,
    valueLabel,
    onChange,
}: {
    label: string;
    description: string;
    value: number;
    min: number;
    max: number;
    valueLabel: (value: number) => string;
    onChange: (value: number) => void;
}) {
    const { t } = useTranslation('reader');
    return (
        <StepperControl
            decrementLabel={t('controls.decrease', { label })}
            description={description}
            incrementLabel={t('controls.increase', { label })}
            label={label}
            maximum={max}
            minimum={min}
            onChange={onChange}
            value={value}
            valueLabel={valueLabel}
        />
    );
}

export function ReaderSettingsControls({ value, capabilities, onChange }: Props) {
    const { t } = useTranslation('reader');
    const { radii, spacing, tokens } = useTheme();
    const qualities = selectableQualities(capabilities);
    const backgroundColors: Record<ReaderBackground, string> = {
        BLACK: tokens.logoBg,
        DARK: tokens.bg,
        PAPER: tokens.surfaceMuted,
        LIGHT: tokens.surfaceElevated,
        WHITE: tokens.surface,
    };
    return (
        <View style={{ gap: spacing.lg }}>
            <FormSection title={t('settings.sections.navigation.title')} description={t('settings.sections.navigation.description')}>
                <ChoiceCards
                    label={t('settings.mode')}
                    onChange={mode => onChange({ mode })}
                    optionDescription={option => t(`settings.descriptions.mode.${option}`)}
                    optionIcon={option => MODE_ICONS[option]}
                    optionLabel={option => t(`options.${option}`)}
                    options={MODES}
                    value={value.mode}
                />
                <ChoiceCards
                    label={t('settings.direction')}
                    layout="stacked"
                    onChange={direction => onChange({ direction })}
                    optionIcon={option => DIRECTION_ICONS[option]}
                    optionLabel={option => t(`options.${option}`)}
                    options={DIRECTIONS}
                    value={value.direction}
                />
                <SegmentedControl
                    label={t('settings.fit')}
                    onChange={fit => onChange({ fit })}
                    optionLabel={option => t(`options.${option}`)}
                    options={FITS}
                    value={value.fit}
                />
            </FormSection>
            <FormSection title={t('settings.sections.image.title')} description={t('settings.sections.image.description')}>
                <SelectField
                    closeLabel={t('settings.closeSelection')}
                    label={t('settings.quality')}
                    onChange={(quality: ImageQuality) => onChange({ quality })}
                    optionLabel={option => t(`options.${option}`)}
                    options={qualities}
                    value={qualities.includes(value.quality) ? value.quality : 'AUTO'}
                />
                <ChoiceCards
                    label={t('settings.background')}
                    onChange={background => onChange({ background })}
                    optionLabel={option => t(`options.${option}`)}
                    optionPreview={option => (
                        <View
                            accessibilityElementsHidden
                            style={{
                                backgroundColor: backgroundColors[option],
                                borderColor: tokens.borderStrong,
                                borderRadius: radii.pill,
                                borderWidth: 1,
                                height: 24,
                                width: 24,
                            }}
                        />
                    )}
                    options={BACKGROUNDS}
                    value={value.background}
                />
                <RangeSlider
                    decrementLabel={t('controls.decrease', { label: t('settings.saturation') })}
                    description={t('settings.descriptions.saturation')}
                    incrementLabel={t('controls.increase', { label: t('settings.saturation') })}
                    label={t('settings.saturation')}
                    maximum={100}
                    minimum={0}
                    onChange={saturation => onChange({ saturation })}
                    step={5}
                    value={value.saturation}
                    valueLabel={current => t('settings.values.percent', { value: current })}
                />
            </FormSection>
            <FormSection title={t('settings.sections.behavior.title')} description={t('settings.sections.behavior.description')}>
                <Stepper
                    description={t('settings.descriptions.gap')}
                    label={t('settings.gap')}
                    max={32}
                    min={0}
                    onChange={gap => onChange({ gap })}
                    value={value.gap}
                    valueLabel={current => t('settings.values.pixels', { value: current })}
                />
                <Stepper
                    description={t('settings.descriptions.preload')}
                    label={t('settings.preload')}
                    max={10}
                    min={0}
                    onChange={preload => onChange({ preload })}
                    value={value.preload}
                    valueLabel={current => t('settings.values.pages', { value: current })}
                />
                <SwitchRow
                    description={t('settings.descriptions.autoMarkRead')}
                    label={t('settings.autoMarkRead')}
                    onChange={autoMarkRead => onChange({ autoMarkRead })}
                    value={value.autoMarkRead}
                />
            </FormSection>
        </View>
    );
}
