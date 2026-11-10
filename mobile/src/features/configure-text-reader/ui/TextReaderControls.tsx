import { useTranslation } from 'react-i18next';

import type { TextReaderPreferences } from '@/entities/user-setting';
import { darkTokens, lightTokens } from '@/shared/theme';
import { Button, FormSection, RangeSlider, SegmentedControl, StatusMessage, SwatchPicker } from '@/shared/ui';

interface Props {
    value: TextReaderPreferences;
    onChange(patch: Partial<TextReaderPreferences>): void;
    onReset(): void;
    persistenceError?: boolean;
    onRetry?(): void;
    /** Renders without the section header (inside a sheet that already names it). */
    compact?: boolean;
    /** The settings sheet renders the reset action in its footer. */
    showReset?: boolean;
}

const FAMILIES = ['APP', 'SERIF'] as const;
const SPACING = ['COMPACT', 'COMFORTABLE', 'WIDE'] as const;
const MARGINS = ['NARROW', 'MEDIUM', 'WIDE'] as const;
const BACKGROUNDS = ['APP', 'LIGHT', 'PAPER', 'DARK'] as const;
// Mesmas cores do leitor de texto (`textReaderPalette`): Papel usa a superfície suave do tema claro.
const TEXT_BACKGROUND_COLORS: Record<(typeof BACKGROUNDS)[number], string> = {
    APP: darkTokens.bg,
    LIGHT: lightTokens.bg,
    PAPER: lightTokens.surfaceMuted,
    DARK: darkTokens.bg,
};

export function TextReaderControls({ value, onChange, onReset, persistenceError, onRetry, compact = false, showReset = true }: Props) {
    const { t } = useTranslation('reader');

    return (
        <FormSection compact={compact} title={t('text.title')} description={t('text.description')}>
            <SegmentedControl
                label={t('text.font')}
                value={value.fontFamily}
                options={FAMILIES}
                optionLabel={option => t(`text.fonts.${option}`)}
                onChange={fontFamily => onChange({ fontFamily })}
            />
            <RangeSlider
                label={t('text.size')}
                minimum={16}
                maximum={28}
                step={1}
                value={value.fontSize}
                decrementLabel={t('text.decrease')}
                incrementLabel={t('text.increase')}
                valueLabel={size => t('text.sizeValue', { size })}
                onChange={fontSize => onChange({ fontSize })}
            />
            <SegmentedControl
                label={t('text.spacing')}
                value={value.lineSpacing}
                options={SPACING}
                optionLabel={option => t(`text.lineSpacing.${option}`)}
                onChange={lineSpacing => onChange({ lineSpacing })}
            />
            <SegmentedControl
                label={t('text.margin')}
                value={value.margins}
                options={MARGINS}
                optionLabel={option => t(`text.margins.${option}`)}
                onChange={margins => onChange({ margins })}
            />
            {/* Kit: amostras que mostram a cor; "Seguir aplicativo" aparece dividido entre claro e escuro. */}
            <SwatchPicker
                label={t('text.background')}
                value={value.background}
                options={BACKGROUNDS}
                optionLabel={option => t(`text.backgrounds.${option}`)}
                optionColor={option => TEXT_BACKGROUND_COLORS[option]}
                optionSplit={option => (option === 'APP' ? ([lightTokens.bg, darkTokens.bg] as const) : undefined)}
                onChange={background => onChange({ background })}
            />
            {showReset ? (
                <Button variant="ghost" onPress={onReset}>
                    {t('text.reset')}
                </Button>
            ) : null}
            {persistenceError ? <StatusMessage tone="danger" title={t('text.saveError')} actionLabel={t('text.retry')} onAction={onRetry} /> : null}
        </FormSection>
    );
}
