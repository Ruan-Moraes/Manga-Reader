import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BaseSelect from '@shared/component/input/BaseSelect';

import {
    sectionTitleClass,
    checkboxLabelClass,
    type SettingsTabProps,
    type UserSettings,
} from '../settings.constants';

const ReadingSettings = ({ settings, onUpdate }: SettingsTabProps) => {
    const { t } = useTranslation('user');

    const modeOptions = useMemo(
        () => [
            { value: 'continuous', label: t('settings.reading.mode.continuous') },
            { value: 'paged', label: t('settings.reading.mode.paged') },
        ],
        [t],
    );

    const directionOptions = useMemo(
        () => [
            { value: 'ltr', label: t('settings.reading.direction.ltr') },
            { value: 'rtl', label: t('settings.reading.direction.rtl') },
            {
                value: 'vertical',
                label: t('settings.reading.direction.vertical'),
            },
        ],
        [t],
    );

    const imageQualityOptions = useMemo(
        () => [
            { value: 'auto', label: t('settings.reading.imageQuality.auto') },
            { value: 'high', label: t('settings.reading.imageQuality.high') },
            {
                value: 'data-saver',
                label: t('settings.reading.imageQuality.dataSaver'),
            },
        ],
        [t],
    );

    const updateReading = <K extends keyof UserSettings['reading']>(
        key: K,
        value: UserSettings['reading'][K],
    ) => {
        onUpdate(prev => ({
            ...prev,
            reading: { ...prev.reading, [key]: value },
        }));
    };

    return (
        <div className="space-y-4">
            <h3 className={sectionTitleClass}>{t('settings.reading.title')}</h3>

            <BaseSelect
                label={t('settings.reading.modeLabel')}
                options={modeOptions}
                value={settings.reading.mode}
                onChange={e =>
                    updateReading(
                        'mode',
                        e.target.value as UserSettings['reading']['mode'],
                    )
                }
            />

            <BaseSelect
                label={t('settings.reading.directionLabel')}
                options={directionOptions}
                value={settings.reading.direction}
                onChange={e =>
                    updateReading(
                        'direction',
                        e.target.value as UserSettings['reading']['direction'],
                    )
                }
            />

            <BaseSelect
                label={t('settings.reading.imageQualityLabel')}
                options={imageQualityOptions}
                value={settings.reading.imageQuality}
                onChange={e =>
                    updateReading(
                        'imageQuality',
                        e.target
                            .value as UserSettings['reading']['imageQuality'],
                    )
                }
            />

            <label className="block text-xs font-bold">
                {t('settings.reading.preloadPages', {
                    count: settings.reading.preloadPages,
                })}
            </label>
            <input
                type="range"
                min={0}
                max={5}
                value={settings.reading.preloadPages}
                className="w-full accent-quaternary-default"
                onChange={e =>
                    updateReading('preloadPages', Number(e.target.value))
                }
            />

            <label className={checkboxLabelClass}>
                <input
                    type="checkbox"
                    checked={settings.reading.autoNextChapter}
                    className="accent-quaternary-default"
                    onChange={e =>
                        updateReading('autoNextChapter', e.target.checked)
                    }
                />
                {t('settings.reading.autoNextChapter')}
            </label>

            <label className={checkboxLabelClass}>
                <input
                    type="checkbox"
                    checked={settings.reading.showPageNumber}
                    className="accent-quaternary-default"
                    onChange={e =>
                        updateReading('showPageNumber', e.target.checked)
                    }
                />
                {t('settings.reading.showPageNumber')}
            </label>
        </div>
    );
};

export default ReadingSettings;
