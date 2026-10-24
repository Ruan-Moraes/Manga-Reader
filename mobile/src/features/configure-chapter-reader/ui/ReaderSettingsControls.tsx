import { useTranslation } from 'react-i18next';

import type { ImageVariantCapabilities } from '@/entities/chapter';
import type { ImageQuality, ReaderBackground, ReaderSettings, ReadingDirection, ReadingFit, ReadingMode } from '@/entities/user-setting';
import { darkTokens, lightTokens } from '@/shared/theme';
import {
    ChoiceCards,
    ControlHelp,
    FormSection,
    type IconName,
    RangeSlider,
    SectionStack,
    SegmentedControl,
    SelectField,
    SwatchPicker,
    SwitchRow,
} from '@/shared/ui';

import { selectableQualities } from '../model/readerConfiguration';

const MODES: readonly ReadingMode[] = ['VERTICAL', 'PAGED', 'DOUBLE'];
const DIRECTIONS: readonly ReadingDirection[] = ['LTR', 'RTL', 'WEBTOON'];
const FITS: readonly ReadingFit[] = ['WIDTH', 'HEIGHT', 'ORIGINAL'];
const BACKGROUNDS: readonly ReaderBackground[] = ['BLACK', 'DARK', 'PAPER', 'LIGHT', 'WHITE'];
const MODE_ICONS: Record<ReadingMode, IconName> = { VERTICAL: 'swap-vertical-outline', PAGED: 'copy-outline', DOUBLE: 'albums-outline' };
const DIRECTION_ICONS: Record<ReadingDirection, IconName> = { LTR: 'arrow-forward-outline', RTL: 'arrow-back-outline', WEBTOON: 'arrow-down-outline' };
interface Props {
    value: ReaderSettings;
    category?: 'reading' | 'appearance';
    compact?: boolean;
    capabilities: ImageVariantCapabilities;
    onChange: (patch: Partial<ReaderSettings>) => void;
}

export function ReaderSettingsControls({ value, capabilities, onChange, category, compact = false }: Props) {
    const { t } = useTranslation('reader');

    const qualities = selectableQualities(capabilities);

    const backgroundColors: Record<ReaderBackground, string> = {
        BLACK: darkTokens.logoBg,
        DARK: darkTokens.surface,
        PAPER: lightTokens.surfaceMuted,
        LIGHT: lightTokens.bg,
        WHITE: lightTokens.surface,
    };

    return (
        <SectionStack>
            {category !== 'appearance' ? (
                <FormSection compact={compact} title={t('settings.sections.navigation.title')} description={t('settings.sections.navigation.description')}>
                    <ChoiceCards
                        compact={compact}
                        label={t('settings.mode')}
                        layout="stacked"
                        onChange={mode => onChange({ mode })}
                        optionDescription={option => t(`settings.descriptions.mode.${option}`)}
                        optionIcon={option => MODE_ICONS[option]}
                        optionLabel={option => t(`options.${option}`)}
                        options={MODES}
                        value={value.mode}
                    />
                    <ChoiceCards
                        compact={compact}
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
            ) : null}
            {category !== 'reading' ? (
                <FormSection compact={compact} title={t('settings.sections.image.title')} description={t('settings.sections.image.description')}>
                    <SelectField
                        closeLabel={t('settings.closeSelection')}
                        label={t('settings.quality')}
                        onChange={(quality: ImageQuality) => onChange({ quality })}
                        optionDescription={option => t(`settings.descriptions.quality.${option}`)}
                        optionLabel={option => t(`options.${option}`)}
                        options={qualities}
                        value={qualities.includes(value.quality) ? value.quality : 'AUTO'}
                    />
                    <SwatchPicker
                        separated={compact}
                        label={t('settings.background')}
                        onChange={background => onChange({ background })}
                        optionLabel={option => t(`options.${option}`)}
                        optionColor={option => backgroundColors[option]}
                        options={BACKGROUNDS}
                        value={value.background}
                    />
                    <RangeSlider
                        decrementLabel={t('controls.decrease', { label: t('settings.saturation') })}
                        description={compact ? undefined : t('settings.descriptions.saturation')}
                        incrementLabel={t('controls.increase', { label: t('settings.saturation') })}
                        label={t('settings.saturation')}
                        maximum={100}
                        minimum={0}
                        onChange={saturation => onChange({ saturation })}
                        step={5}
                        value={value.saturation}
                        valueLabel={current => t('settings.values.percent', { value: current })}
                    />
                    {compact ? (
                        <ControlHelp label={t('panel.help', { label: t('settings.saturation') })} description={t('settings.descriptions.saturation')} />
                    ) : null}
                </FormSection>
            ) : null}
            {category !== 'appearance' ? (
                <FormSection compact={compact} title={t('settings.sections.behavior.title')} description={t('settings.sections.behavior.description')}>
                    <RangeSlider
                        decrementLabel={t('controls.decrease', { label: t('settings.gap') })}
                        description={compact ? undefined : t('settings.descriptions.gap')}
                        incrementLabel={t('controls.increase', { label: t('settings.gap') })}
                        label={t('settings.gap')}
                        maximum={32}
                        minimum={0}
                        onChange={gap => onChange({ gap })}
                        step={1}
                        value={value.gap}
                        valueLabel={current => t('settings.values.pixels', { value: current })}
                    />
                    {compact ? <ControlHelp label={t('panel.help', { label: t('settings.gap') })} description={t('settings.descriptions.gap')} /> : null}
                    <RangeSlider
                        decrementLabel={t('controls.decrease', { label: t('settings.preload') })}
                        description={compact ? undefined : t('settings.descriptions.preload')}
                        incrementLabel={t('controls.increase', { label: t('settings.preload') })}
                        label={t('settings.preload')}
                        maximum={10}
                        minimum={0}
                        onChange={preload => onChange({ preload })}
                        step={1}
                        value={value.preload}
                        valueLabel={current => t('settings.values.pages', { value: current })}
                    />
                    {compact ? (
                        <ControlHelp label={t('panel.help', { label: t('settings.preload') })} description={t('settings.descriptions.preload')} />
                    ) : null}
                    <SwitchRow
                        description={t('settings.descriptions.autoMarkRead')}
                        label={t('settings.autoMarkRead')}
                        onChange={autoMarkRead => onChange({ autoMarkRead })}
                        value={value.autoMarkRead}
                    />
                </FormSection>
            ) : null}
        </SectionStack>
    );
}
