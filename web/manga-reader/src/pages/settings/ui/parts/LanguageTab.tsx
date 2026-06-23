import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';

import { SegmentedControl } from '@ui/SegmentedControl';
import { Select } from '@ui/Select';
import type { DateFormatPreference } from '@entities/user';

import { SettingSection, SettingRow } from './settingsShared';
import type { SettingsState } from '../../model/useSettingsState';

const READING_LANG_OPTIONS = [
    { value: 'pt-BR', labelKey: 'settings.system.language.langPt' },
    { value: 'es-ES', labelKey: 'settings.system.language.langEs' },
    { value: 'en-US', labelKey: 'settings.system.language.langEn' },
] as const;

// pt-BR é a língua de fallback garantida pelo backend (cadeia de contentLocales
// termina sempre em pt-BR); não pode ser removida da lista de prioridade.
const FALLBACK_LANG = 'pt-BR';

const labelKeyFor = (value: string) => READING_LANG_OPTIONS.find(opt => opt.value === value)?.labelKey ?? value;

const LanguageTab = ({ state }: { state: SettingsState }) => {
    const { t } = useTranslation('user');

    const { settings, updateGroup, interfaceLang, changeInterfaceLang, readingLangs, setReadingLangs } = state;
    const l = settings.locale;

    const availableLangs = READING_LANG_OPTIONS.filter(opt => !readingLangs.includes(opt.value));

    // A ordem do array é a cadeia de prioridade/fallback: posição 1 = primeira escolha.
    const moveLang = (index: number, direction: -1 | 1) => {
        const target = index + direction;

        if (target < 0 || target >= readingLangs.length) return;

        const next = [...readingLangs];
        [next[index], next[target]] = [next[target], next[index]];

        setReadingLangs(next, t('settings.system.language.readingToast'));
    };

    const addLang = (value: string) => {
        setReadingLangs([...readingLangs, value], t('settings.system.language.readingToast'));
    };

    const removeLang = (value: string) => {
        if (value === FALLBACK_LANG) return;

        setReadingLangs(
            readingLangs.filter(v => v !== value),
            t('settings.system.language.readingToast'),
        );
    };

    return (
        <>
            <SettingSection title={t('settings.system.language.sectionInterface')}>
                <SettingRow label={t('settings.system.language.interfaceLang')} desc={t('settings.system.language.interfaceLangDesc')}>
                    <Select
                        aria-label={t('settings.system.language.interfaceLang')}
                        value={interfaceLang}
                        onChange={e => changeInterfaceLang(e.target.value, t('settings.system.language.interfaceToast'))}
                        className="w-44"
                        options={[
                            { value: 'pt-BR', label: t('settings.system.language.langPtFull') },
                            { value: 'en-US', label: t('settings.system.language.langEnFull') },
                            { value: 'es-ES', label: t('settings.system.language.langEsFull') },
                        ]}
                    />
                </SettingRow>

                <SettingRow label={t('settings.system.language.readingLangs')} desc={t('settings.system.language.readingLangsDesc')} block>
                    <ol className="flex flex-col gap-2 pt-1">
                        {readingLangs.map((lang, index) => {
                            const isFallback = lang === FALLBACK_LANG;

                            return (
                                <li key={lang} className="flex items-center gap-3 rounded-mr-xs border border-mr-separator bg-mr-secondary px-3 py-2">
                                    <span className="w-5 shrink-0 text-center text-mr-small font-mr-bold text-mr-fg-subtle">{index + 1}</span>
                                    <span className="min-w-0 flex-1 truncate text-mr-body font-mr-bold text-mr-fg">{t(labelKeyFor(lang))}</span>
                                    {isFallback && (
                                        <span className="shrink-0 rounded-mr-xs bg-mr-accent-10 px-1.5 py-0.5 text-mr-tiny font-mr-bold uppercase tracking-mr-label text-mr-accent">
                                            {t('settings.system.language.fallbackBadge')}
                                        </span>
                                    )}
                                    <div className="flex shrink-0 items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => moveLang(index, -1)}
                                            disabled={index === 0}
                                            aria-label={t('settings.system.language.moveUp')}
                                            className="mr-focus-ring inline-flex size-8 items-center justify-center rounded-mr-xs text-mr-fg-subtle hover:text-mr-fg disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <ArrowUp className="size-4" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveLang(index, 1)}
                                            disabled={index === readingLangs.length - 1}
                                            aria-label={t('settings.system.language.moveDown')}
                                            className="mr-focus-ring inline-flex size-8 items-center justify-center rounded-mr-xs text-mr-fg-subtle hover:text-mr-fg disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <ArrowDown className="size-4" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeLang(lang)}
                                            disabled={isFallback}
                                            aria-label={t('settings.system.language.removeLang')}
                                            className="mr-focus-ring inline-flex size-8 items-center justify-center rounded-mr-xs text-mr-fg-subtle hover:text-mr-danger disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <X className="size-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>

                    {availableLangs.length > 0 && (
                        <div className="mt-3">
                            <p className="mb-2 text-mr-small text-mr-fg-subtle">{t('settings.system.language.availableLangs')}</p>
                            <div className="flex flex-wrap gap-2">
                                {availableLangs.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => addLang(opt.value)}
                                        className="mr-focus-ring inline-flex items-center gap-1.5 rounded-mr-xs border border-mr-separator px-2.5 py-1.5 text-mr-small font-mr-bold text-mr-fg hover:border-mr-accent hover:text-mr-accent"
                                    >
                                        <Plus className="size-4" aria-hidden="true" />
                                        {t(opt.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </SettingRow>
            </SettingSection>

            <SettingSection title={t('settings.system.language.sectionRegion')}>
                <SettingRow label={t('settings.system.language.dateFormat')} block>
                    <SegmentedControl
                        tone="soft"
                        block
                        size="sm"
                        value={l.dateFormat}
                        onChange={v => updateGroup('locale', { dateFormat: v as DateFormatPreference }, t('settings.system.language.dateToast'))}
                        items={[
                            { value: 'D_MON', label: t('settings.system.language.dateDMon') },
                            { value: 'D_M', label: t('settings.system.language.dateDM') },
                            { value: 'MON_D', label: t('settings.system.language.dateMonD') },
                        ]}
                    />
                </SettingRow>

                <SettingRow label={t('settings.system.language.timezone')}>
                    <Select
                        aria-label={t('settings.system.language.timezone')}
                        value={l.timezone}
                        onChange={e => updateGroup('locale', { timezone: e.target.value }, t('settings.system.language.timezoneToast'))}
                        className="w-56"
                        options={[
                            { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
                            { value: 'America/New_York', label: 'New York (GMT-5)' },
                            { value: 'Europe/Lisbon', label: 'Lisboa (GMT+0)' },
                            { value: 'Asia/Tokyo', label: 'Tóquio (GMT+9)' },
                            { value: 'UTC', label: 'UTC' },
                        ]}
                    />
                </SettingRow>
            </SettingSection>
        </>
    );
};

export default LanguageTab;
