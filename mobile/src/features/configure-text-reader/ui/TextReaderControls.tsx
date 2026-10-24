import { useTranslation } from 'react-i18next';

import type { TextReaderPreferences } from '@/entities/user-setting';
import { Button, ChoiceCards, FormSection, RangeSlider, SegmentedControl, StatusMessage } from '@/shared/ui';

interface Props {
    value: TextReaderPreferences;
    onChange(patch: Partial<TextReaderPreferences>): void;
    onReset(): void;
    persistenceError?: boolean;
    onRetry?(): void;
}

const FAMILIES = ['APP', 'SERIF'] as const;
const SPACING = ['COMPACT', 'COMFORTABLE', 'WIDE'] as const;
const MARGINS = ['NARROW', 'MEDIUM', 'WIDE'] as const;
const BACKGROUNDS = ['APP', 'LIGHT', 'PAPER', 'DARK'] as const;

export function TextReaderControls({ value, onChange, onReset, persistenceError, onRetry }: Props) {
    const { t } = useTranslation('reader');

    return (
        <FormSection title={t('text.title')} description={t('text.description')}>
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
            <ChoiceCards
                label={t('text.background')}
                value={value.background}
                options={BACKGROUNDS}
                layout="stacked"
                optionLabel={option => t(`text.backgrounds.${option}`)}
                onChange={background => onChange({ background })}
            />
            <Button variant="ghost" onPress={onReset}>
                {t('text.reset')}
            </Button>
            {persistenceError ? <StatusMessage tone="danger" title={t('text.saveError')} actionLabel={t('text.retry')} onAction={onRetry} /> : null}
        </FormSection>
    );
}
