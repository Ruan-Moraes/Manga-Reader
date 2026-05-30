import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Switch } from '@ui/Switch';

import { SettingSection } from './settingsShared';

type AccessibilityTabProps = {
    onNavigateToAbout: () => void;
};

const AccessibilityTab = ({ onNavigateToAbout }: AccessibilityTabProps) => {
    const { t } = useTranslation('user');
    const [reducedMotion, setReducedMotion] = useState(false);
    const [highContrast, setHighContrast] = useState(false);

    return (
        <SettingSection title={t('settings.accessibility.section')}>
            <Switch
                checked={reducedMotion}
                onChange={setReducedMotion}
                label={t('settings.accessibility.reducedMotionLabel')}
                description={t('settings.accessibility.reducedMotionDesc')}
            />
            <Switch
                checked={highContrast}
                onChange={setHighContrast}
                label={t('settings.accessibility.highContrastLabel')}
                description={t('settings.accessibility.highContrastDesc')}
                disabled
            />
            <div className="mt-2">
                <a href="#shortcuts" onClick={onNavigateToAbout} className="text-mr-small text-mr-accent hover:underline">
                    {t('settings.accessibility.shortcutsLink')}
                </a>
            </div>
        </SettingSection>
    );
};

export default AccessibilityTab;
