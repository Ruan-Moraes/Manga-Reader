import { useTranslation } from 'react-i18next';

import { SegmentedControl } from '@ui/SegmentedControl';
import { RadioGroup } from '@ui/Radio';
import { Switch } from '@ui/Switch';

import type { DensityPreference, FontSizePreference, ThemePreference } from '@entities/user';

import { SettingSection, SettingRow } from './settingsShared';
import type { SettingsState } from '../../model/useSettingsState';

const AppearanceTab = ({ state }: { state: SettingsState }) => {
    const { t } = useTranslation('user');

    const { settings, updateGroup } = state;

    const a = settings.appearance;

    return (
        <>
            <SettingSection title={t('settings.system.appearance.sectionTheme')}>
                <SettingRow label={t('settings.system.appearance.theme')} block>
                    <RadioGroup
                        name="settings-theme"
                        variant="card"
                        value={a.theme}
                        onChange={v => updateGroup('appearance', { theme: v as ThemePreference }, t('settings.system.appearance.themeToast'))}
                        options={[
                            { value: 'DARK', label: t('settings.system.appearance.themeDark') },
                            { value: 'LIGHT', label: t('settings.system.appearance.themeLight') },
                            { value: 'SYSTEM', label: t('settings.system.appearance.themeSystem') },
                        ]}
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection title={t('settings.system.appearance.sectionInterface')}>
                <SettingRow label={t('settings.system.appearance.fontSize')} block>
                    <SegmentedControl
                        tone="soft"
                        block
                        size="sm"
                        value={a.fontSize}
                        onChange={v => updateGroup('appearance', { fontSize: v as FontSizePreference }, t('settings.system.appearance.fontToast'))}
                        items={[
                            { value: 'COMPACT', label: t('settings.system.appearance.fontCompact') },
                            { value: 'DEFAULT', label: t('settings.system.appearance.fontDefault') },
                            { value: 'COMFORTABLE', label: t('settings.system.appearance.fontComfortable') },
                        ]}
                    />
                </SettingRow>

                <SettingRow label={t('settings.system.appearance.density')} block>
                    <SegmentedControl
                        tone="soft"
                        block
                        size="sm"
                        value={a.density}
                        onChange={v => updateGroup('appearance', { density: v as DensityPreference }, t('settings.system.appearance.densityToast'))}
                        items={[
                            { value: 'COMFORTABLE', label: t('settings.system.appearance.densityComfortable') },
                            { value: 'COMPACT', label: t('settings.system.appearance.densityCompact') },
                        ]}
                    />
                </SettingRow>

                <SettingRow label={t('settings.system.appearance.animations')} desc={t('settings.system.appearance.animationsDesc')}>
                    <Switch
                        bare
                        checked={a.animations}
                        onChange={v => updateGroup('appearance', { animations: v }, t('settings.system.appearance.animationsToast'))}
                        aria-label={t('settings.system.appearance.animations')}
                    />
                </SettingRow>
            </SettingSection>
        </>
    );
};

export default AppearanceTab;
