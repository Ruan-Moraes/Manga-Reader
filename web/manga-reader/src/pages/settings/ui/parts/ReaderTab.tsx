import { useTranslation } from 'react-i18next';

import { SegmentedControl } from '@ui/SegmentedControl';
import { Select } from '@ui/Select';
import { Switch } from '@ui/Switch';
import { Slider } from '@ui/Slider';
import type {
    ImageQuality,
    ReaderBackground,
    ReadingDirection,
    ReadingFit,
    ReadingMode,
} from '@entities/user';

import { SettingSection, SettingRow } from './settingsShared';
import type { SettingsState } from '../../model/useSettingsState';

const ReaderTab = ({ state }: { state: SettingsState }) => {
    const { t } = useTranslation('user');
    const { settings, updateGroup } = state;
    const r = settings.reader;

    return (
        <>
            <SettingSection title={t('settings.system.reader.sectionNavigation')}>
                <SettingRow label={t('settings.system.reader.direction')} block>
                    <SegmentedControl
                        tone="soft"
                        block
                        size="sm"
                        value={r.direction}
                        onChange={v => updateGroup('reader', { direction: v as ReadingDirection }, t('settings.system.reader.directionToast'))}
                        items={[
                            { value: 'LTR', label: t('settings.system.reader.directionLtr') },
                            { value: 'RTL', label: t('settings.system.reader.directionRtl') },
                            { value: 'WEBTOON', label: t('settings.system.reader.directionWebtoon') },
                        ]}
                    />
                </SettingRow>

                <SettingRow label={t('settings.system.reader.mode')} block>
                    <SegmentedControl
                        tone="soft"
                        block
                        size="sm"
                        value={r.mode}
                        onChange={v => updateGroup('reader', { mode: v as ReadingMode }, t('settings.system.reader.modeToast'))}
                        items={[
                            { value: 'VERTICAL', label: t('settings.system.reader.modeVertical') },
                            { value: 'PAGED', label: t('settings.system.reader.modePaged') },
                            { value: 'DOUBLE', label: t('settings.system.reader.modeDouble') },
                        ]}
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection title={t('settings.system.reader.sectionImages')}>
                <SettingRow label={t('settings.system.reader.fit')} block>
                    <SegmentedControl
                        tone="soft"
                        block
                        size="sm"
                        value={r.fit}
                        onChange={v => updateGroup('reader', { fit: v as ReadingFit }, t('settings.system.reader.fitToast'))}
                        items={[
                            { value: 'WIDTH', label: t('settings.system.reader.fitWidth') },
                            { value: 'HEIGHT', label: t('settings.system.reader.fitHeight') },
                            { value: 'ORIGINAL', label: t('settings.system.reader.fitOriginal') },
                        ]}
                    />
                </SettingRow>

                <SettingRow label={t('settings.system.reader.quality')}>
                    <Select
                        aria-label={t('settings.system.reader.quality')}
                        value={r.quality}
                        onChange={e => updateGroup('reader', { quality: e.target.value as ImageQuality }, t('settings.system.reader.qualityToast'))}
                        className="w-44"
                        options={[
                            { value: 'AUTO', label: t('settings.system.reader.qualityAuto') },
                            { value: 'LOW', label: t('settings.system.reader.qualityLow') },
                            { value: 'MEDIUM', label: t('settings.system.reader.qualityMedium') },
                            { value: 'HIGH', label: t('settings.system.reader.qualityHigh') },
                            { value: 'ORIGINAL', label: t('settings.system.reader.qualityOriginal') },
                        ]}
                    />
                </SettingRow>

                <SettingRow label={t('settings.system.reader.gap')} desc={t('settings.system.reader.gapDesc')} block>
                    <Slider
                        min={0}
                        max={32}
                        unit="px"
                        value={r.gap}
                        onChange={v => updateGroup('reader', { gap: v }, t('settings.system.reader.gapToast'))}
                        aria-label={t('settings.system.reader.gap')}
                    />
                </SettingRow>

                <SettingRow label={t('settings.system.reader.background')} block>
                    <SegmentedControl
                        tone="soft"
                        block
                        size="sm"
                        value={r.background}
                        onChange={v => updateGroup('reader', { background: v as ReaderBackground }, t('settings.system.reader.backgroundToast'))}
                        items={[
                            { value: 'BLACK', label: t('settings.system.reader.bgBlack') },
                            { value: 'DARK', label: t('settings.system.reader.bgDark') },
                            { value: 'PAPER', label: t('settings.system.reader.bgPaper') },
                        ]}
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection title={t('settings.system.reader.sectionProgress')}>
                <SettingRow label={t('settings.system.reader.autoMark')} desc={t('settings.system.reader.autoMarkDesc')}>
                    <Switch
                        bare
                        checked={r.autoMarkRead}
                        onChange={v => updateGroup('reader', { autoMarkRead: v }, t('settings.system.reader.autoMarkToast'))}
                        aria-label={t('settings.system.reader.autoMark')}
                    />
                </SettingRow>

                <SettingRow label={t('settings.system.reader.preload')} desc={t('settings.system.reader.preloadDesc')} block>
                    <Slider
                        min={0}
                        max={10}
                        value={r.preload}
                        onChange={v => updateGroup('reader', { preload: v }, t('settings.system.reader.preloadToast'))}
                        aria-label={t('settings.system.reader.preload')}
                    />
                </SettingRow>
            </SettingSection>
        </>
    );
};

export default ReaderTab;
