import { type ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ReaderBackground, ReaderSettings, ReadingDirection, ReadingFit, ReadingMode } from '@/entities/user-setting';
import { darkTokens, lightTokens, useTheme } from '@/shared/theme';
import { ChoiceCards, FormSection, type IconName, RangeSlider, SectionStack, SegmentedControl, SwatchPicker, SwitchRow } from '@/shared/ui';


const MODES: readonly ReadingMode[] = ['VERTICAL', 'PAGED', 'DOUBLE'];
const DIRECTIONS: readonly ReadingDirection[] = ['LTR', 'RTL', 'WEBTOON'];
const FITS: readonly ReadingFit[] = ['WIDTH', 'HEIGHT', 'ORIGINAL'];
const BACKGROUNDS: readonly ReaderBackground[] = ['BLACK', 'DARK', 'PAPER', 'LIGHT', 'WHITE'];
const MODE_ICONS: Record<ReadingMode, IconName> = { VERTICAL: 'swap-vertical-outline', PAGED: 'copy-outline', DOUBLE: 'albums-outline' };
const DIRECTION_ICONS: Record<ReadingDirection, IconName> = { LTR: 'arrow-forward-outline', RTL: 'arrow-back-outline', WEBTOON: 'arrow-down-outline' };
export type ReaderSettingsCategory = 'reading' | 'appearance' | 'navigation' | 'image' | 'behavior' | 'quick';

const showsNavigation = (category?: ReaderSettingsCategory) =>
    category === undefined || category === 'reading' || category === 'navigation' || category === 'quick';
const showsImage = (category?: ReaderSettingsCategory) => category === undefined || category === 'appearance' || category === 'image' || category === 'quick';
const showsBehavior = (category?: ReaderSettingsCategory) => category === undefined || category === 'reading' || category === 'behavior';

interface Props {
    value: ReaderSettings;
    /**
     * `reading`/`appearance` group sections for the reader panel; `navigation`/`image`/`behavior` render one section;
     * `quick` is the single reader sheet (063): mode, direction, fit, background, saturation and, in the vertical flow, gap.
     */
    category?: ReaderSettingsCategory;
    compact?: boolean;
    onChange: (patch: Partial<ReaderSettings>) => void;
}

export function ReaderSettingsControls({ value, onChange, category, compact = false }: Props) {
    const { t } = useTranslation('reader');

    const backgroundColors: Record<ReaderBackground, string> = {
        BLACK: darkTokens.logoBg,
        DARK: darkTokens.surface,
        PAPER: lightTokens.surfaceMuted,
        LIGHT: lightTokens.bg,
        WHITE: lightTokens.surface,
    };

    // Folha única do leitor (063): grupos sem divisor e 24 entre controles, como no kit.
    const Section = category === 'quick' ? QuickGroup : FormSection;
    const Stack = category === 'quick' ? QuickGroup : SectionStack;

    return (
        <Stack>
            {showsNavigation(category) ? (
                <Section compact={compact} title={t('settings.sections.navigation.title')} description={t('settings.sections.navigation.description')}>
                    {category === 'quick' ? (
                        // Folha do leitor (063): segmentados compactos como no kit; telas de Ajustes mantêm os cartões.
                        <>
                            <SegmentedControl
                                label={t('settings.modeLong')}
                                onChange={mode => onChange({ mode })}
                                optionLabel={option => t(`options.${option}`)}
                                options={MODES}
                                value={value.mode}
                            />
                            <SegmentedControl
                                label={t('settings.direction')}
                                onChange={direction => onChange({ direction })}
                                optionLabel={option => (option === 'WEBTOON' ? t('options.WEBTOON') : t(`shortOptions.${option}`))}
                                options={DIRECTIONS}
                                value={value.direction}
                            />
                        </>
                    ) : (
                        <>
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
                        </>
                    )}
                    <SegmentedControl
                        label={t('settings.fit')}
                        onChange={fit => onChange({ fit })}
                        optionLabel={option => t(`options.${option}`)}
                        options={FITS}
                        value={value.fit}
                    />
                </Section>
            ) : null}
            {showsImage(category) ? (
                <Section compact={compact} title={t('settings.sections.image.title')} description={t('settings.sections.image.description')}>
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
                        help={
                            compact && category !== 'quick'
                                ? { label: t('panel.help', { label: t('settings.saturation') }), description: t('settings.descriptions.saturation') }
                                : undefined
                        }
                        incrementLabel={t('controls.increase', { label: t('settings.saturation') })}
                        label={t('settings.saturation')}
                        maximum={100}
                        minimum={0}
                        onChange={saturation => onChange({ saturation })}
                        step={5}
                        value={value.saturation}
                        valueLabel={current => t('settings.values.percent', { value: current })}
                    />
                </Section>
            ) : null}
            {category === 'quick' && (value.mode === 'VERTICAL' || value.direction === 'WEBTOON') ? (
                <Section compact={compact} title={t('settings.sections.behavior.title')}>
                    <RangeSlider
                        decrementLabel={t('controls.decrease', { label: t('settings.gap') })}
                        incrementLabel={t('controls.increase', { label: t('settings.gap') })}
                        label={t('settings.gap')}
                        maximum={32}
                        minimum={0}
                        onChange={gap => onChange({ gap })}
                        step={1}
                        value={value.gap}
                        valueLabel={current => t('settings.values.pixels', { value: current })}
                    />
                </Section>
            ) : null}
            {showsBehavior(category) ? (
                <FormSection compact={compact} title={t('settings.sections.behavior.title')} description={t('settings.sections.behavior.description')}>
                    <RangeSlider
                        decrementLabel={t('controls.decrease', { label: t('settings.gap') })}
                        description={compact ? undefined : t('settings.descriptions.gap')}
                        help={compact ? { label: t('panel.help', { label: t('settings.gap') }), description: t('settings.descriptions.gap') } : undefined}
                        incrementLabel={t('controls.increase', { label: t('settings.gap') })}
                        label={t('settings.gap')}
                        maximum={32}
                        minimum={0}
                        onChange={gap => onChange({ gap })}
                        step={1}
                        value={value.gap}
                        valueLabel={current => t('settings.values.pixels', { value: current })}
                    />
                    <RangeSlider
                        decrementLabel={t('controls.decrease', { label: t('settings.preload') })}
                        description={compact ? undefined : t('settings.descriptions.preload')}
                        help={
                            compact ? { label: t('panel.help', { label: t('settings.preload') }), description: t('settings.descriptions.preload') } : undefined
                        }
                        incrementLabel={t('controls.increase', { label: t('settings.preload') })}
                        label={t('settings.preload')}
                        maximum={10}
                        minimum={0}
                        onChange={preload => onChange({ preload })}
                        step={1}
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
            ) : null}
        </Stack>
    );
}

function QuickGroup({ children }: { children: ReactNode; compact?: boolean; title?: string; description?: string }) {
    const { spacing } = useTheme();
    return <View style={{ gap: spacing.lg }}>{children}</View>;
}
