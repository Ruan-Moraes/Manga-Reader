import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SegmentedControl } from '@ui/SegmentedControl';
import { Select } from '@ui/Select';
import { Switch } from '@ui/Switch';

import { SettingSection, SettingRow } from './settingsShared';

const ReaderTab = () => {
    const { t } = useTranslation('user');
    const [direction, setDirection] = useState('ltr');
    const [readMode, setReadMode] = useState('vertical');
    const [quality, setQuality] = useState('auto');
    const [autoMark, setAutoMark] = useState(true);

    return (
        <>
            <SettingSection title={t('settings.reader.navigationSection')}>
                <SettingRow label={t('settings.reader.defaultDirection')}>
                    <SegmentedControl
                        items={[
                            { value: 'ltr', label: 'LTR' },
                            { value: 'rtl', label: 'RTL' },
                            { value: 'webtoon', label: 'Webtoon' },
                        ]}
                        value={direction}
                        onChange={setDirection}
                        size="sm"
                    />
                </SettingRow>
                <SettingRow label={t('settings.reader.readingMode')}>
                    <SegmentedControl
                        items={[
                            {
                                value: 'vertical',
                                label: t('settings.reader.modeVertical'),
                            },
                            {
                                value: 'paged',
                                label: t('settings.reader.modePaged'),
                            },
                            {
                                value: 'double',
                                label: t('settings.reader.modeDouble'),
                            },
                        ]}
                        value={readMode}
                        onChange={setReadMode}
                        size="sm"
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection title={t('settings.reader.imagesSection')}>
                <SettingRow label={t('settings.reader.imageQualityLabel')}>
                    <Select
                        value={quality}
                        onChange={e => setQuality(e.target.value)}
                        options={[
                            {
                                value: 'auto',
                                label: t('settings.reader.qualityAuto'),
                            },
                            {
                                value: 'low',
                                label: t('settings.reader.qualityLow'),
                            },
                            {
                                value: 'medium',
                                label: t('settings.reader.qualityMedium'),
                            },
                            {
                                value: 'high',
                                label: t('settings.reader.qualityHigh'),
                            },
                            {
                                value: 'original',
                                label: t('settings.reader.qualityOriginal'),
                            },
                        ]}
                        className="w-40"
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection title={t('settings.reader.progressSection')}>
                <Switch
                    checked={autoMark}
                    onChange={setAutoMark}
                    label={t('settings.reader.markReadAuto')}
                    description={t('settings.reader.markReadAutoDesc')}
                />
            </SettingSection>
        </>
    );
};

export default ReaderTab;
