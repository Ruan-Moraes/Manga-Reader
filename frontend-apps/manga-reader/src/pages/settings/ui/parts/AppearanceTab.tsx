import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SegmentedControl } from '@ui/SegmentedControl';
import { Switch } from '@ui/Switch';
import { RadioGroup } from '@ui/Radio';

import { SettingSection, SettingRow } from './settingsShared';

const AppearanceTab = () => {
    const { t } = useTranslation('user');
    const [theme, setTheme] = useState('dark');
    const [fontSize, setFontSize] = useState('default');
    const [animations, setAnimations] = useState(true);

    return (
        <>
            <SettingSection title={t('settings.appearance.themeSection')}>
                <RadioGroup
                    name="theme"
                    value={theme}
                    onChange={setTheme}
                    options={[
                        {
                            value: 'dark',
                            label: t('settings.appearance.theme.dark'),
                        },
                        {
                            value: 'light',
                            label: t('settings.appearance.theme.lightSoon'),
                            disabled: true,
                        },
                        {
                            value: 'system',
                            label: t('settings.appearance.theme.followSystem'),
                        },
                    ]}
                />
            </SettingSection>

            <SettingSection title={t('settings.appearance.textSection')}>
                <SettingRow label={t('settings.appearance.fontSizeLabel')}>
                    <SegmentedControl
                        items={[
                            {
                                value: 'compact',
                                label: t('settings.appearance.fontSize.compact'),
                            },
                            {
                                value: 'default',
                                label: t('settings.appearance.fontSize.default'),
                            },
                            {
                                value: 'comfortable',
                                label: t('settings.appearance.fontSize.comfortable'),
                            },
                        ]}
                        value={fontSize}
                        onChange={setFontSize}
                        size="sm"
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection title={t('settings.appearance.motionSection')}>
                <Switch
                    checked={animations}
                    onChange={setAnimations}
                    label={t('settings.appearance.animationsLabel')}
                    description={t('settings.appearance.animationsDesc')}
                />
            </SettingSection>
        </>
    );
};

export default AppearanceTab;
