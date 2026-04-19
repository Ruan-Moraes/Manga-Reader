import BaseSelect from '@shared/component/input/BaseSelect';

import {
    sectionTitleClass,
    checkboxLabelClass,
    type SettingsTabProps,
    type UserSettings,
} from '../settings.constants';

const modeOptions = [
    { value: 'continuous', label: 'Contínuo' },
    { value: 'paged', label: 'Paginado' },
];

const directionOptions = [
    { value: 'ltr', label: 'Esquerda → direita' },
    { value: 'rtl', label: 'Direita → esquerda' },
    { value: 'vertical', label: 'Rolagem vertical' },
];

const imageQualityOptions = [
    { value: 'auto', label: 'Automática' },
    { value: 'high', label: 'Alta' },
    { value: 'data-saver', label: 'Economia de dados' },
];

const ReadingSettings = ({ settings, onUpdate }: SettingsTabProps) => {
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
            <h3 className={sectionTitleClass}>Modo de leitura</h3>

            <BaseSelect
                label="Modo"
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
                label="Direção"
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
                label="Qualidade de imagem"
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
                Pré-carregamento de páginas: {settings.reading.preloadPages}
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
                Abrir próximo capítulo automaticamente
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
                Exibir número da página
            </label>
        </div>
    );
};

export default ReadingSettings;
