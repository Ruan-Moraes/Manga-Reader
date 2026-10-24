import { useTranslation } from 'react-i18next';

import type { ReaderControlsMode, ReaderGesturePreferences } from '@/entities/user-setting';
import { ChoiceCards, FormSection, StatusMessage, SwitchRow } from '@/shared/ui';

const MODES: readonly ReaderControlsMode[] = ['TAP', 'SWIPE', 'TAP_OR_SWIPE', 'VISIBLE'];
export interface ReaderGestureControlsProps {
    compact?: boolean;
    value: ReaderGesturePreferences;
    onChange(patch: Partial<ReaderGesturePreferences>): void;
    sideNavigationAvailable: boolean;
    persistenceError?: boolean;
    onRetry?(): void;
}
export function ReaderGestureControls({ value, onChange, sideNavigationAvailable, persistenceError, onRetry, compact = false }: ReaderGestureControlsProps) {
    const { t } = useTranslation('reader');
    return (
        <FormSection compact={compact} title={t('gestures.title')} description={t('gestures.description')}>
            <ChoiceCards
                compact={compact}
                label={t('gestures.controls')}
                layout="stacked"
                options={MODES}
                value={value.controlsMode}
                optionLabel={mode => t(`gestures.options.${mode}`)}
                optionDescription={mode => t(`gestures.descriptions.${mode}`)}
                onChange={controlsMode => onChange({ controlsMode })}
            />
            <SwitchRow
                label={t('gestures.sideTap')}
                value={sideNavigationAvailable && value.sideTapNavigation}
                disabled={!sideNavigationAvailable}
                description={t(sideNavigationAvailable ? 'gestures.sideDescription' : 'gestures.sideUnavailable')}
                onChange={sideTapNavigation => onChange({ sideTapNavigation })}
            />
            {persistenceError ? <StatusMessage tone="danger" title={t('gestures.saveError')} actionLabel={t('gestures.retry')} onAction={onRetry} /> : null}
        </FormSection>
    );
}
