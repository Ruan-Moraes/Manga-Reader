import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

import { Switch } from '@ui/Switch';

import { SettingSection, SettingRow } from './settingsShared';
import type { SettingsState } from '../../model/useSettingsState';

type AccessibilityTabProps = {
    state: SettingsState;
    onNavigateToAbout: () => void;
};

const AccessibilityTab = ({ state, onNavigateToAbout }: AccessibilityTabProps) => {
    const { t } = useTranslation('user');
    const { settings, updateGroup } = state;

    const ac = settings.accessibility;

    return (
        <>
            <SettingSection title={t('settings.system.a11y.sectionMotion')}>
                <SettingRow label={t('settings.system.a11y.reduceMotion')} desc={t('settings.system.a11y.reduceMotionDesc')}>
                    <Switch
                        bare
                        checked={ac.reduceMotion}
                        onChange={v => updateGroup('accessibility', { reduceMotion: v }, t('settings.system.a11y.reduceMotionToast'))}
                        aria-label={t('settings.system.a11y.reduceMotion')}
                    />
                </SettingRow>

                <SettingRow label={t('settings.system.a11y.highContrast')} desc={t('settings.system.a11y.highContrastDesc')}>
                    <Switch bare checked={ac.highContrast} onChange={() => {}} disabled aria-label={t('settings.system.a11y.highContrast')} />
                </SettingRow>
            </SettingSection>

            <SettingSection title={t('settings.system.a11y.sectionShortcuts')}>
                <SettingRow label={t('settings.system.a11y.shortcuts')} desc={t('settings.system.a11y.shortcutsDesc')}>
                    <button
                        type="button"
                        onClick={onNavigateToAbout}
                        className="mr-focus-ring inline-flex items-center gap-1.5 rounded-mr-xs text-mr-small font-mr-bold text-mr-accent hover:underline"
                    >
                        {t('settings.system.a11y.shortcutsAction')}
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                </SettingRow>
            </SettingSection>
        </>
    );
};

export default AccessibilityTab;
