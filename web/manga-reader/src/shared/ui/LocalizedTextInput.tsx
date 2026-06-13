import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type LanguageTag, type LocalizedString } from '@shared/type/i18n';

interface LocalizedTextInputProps {
    label: string;
    value: LocalizedString;
    onChange: (next: LocalizedString) => void;
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
    requiredLanguages?: readonly LanguageTag[];
    maxLength?: number;
}

/**
 * Input multilíngue com abas por idioma. `pt-BR` é obrigatório por padrão.
 *
 * - Abas mostram indicador (●) quando o idioma tem texto preenchido.
 * - Edição em uma aba não altera as demais.
 * - Use `multiline` + `rows` para textareas (ex.: descrição, sinopse).
 */
const LocalizedTextInput = ({
    label,
    value,
    onChange,
    multiline = false,
    rows = 4,
    placeholder,
    requiredLanguages = [DEFAULT_LANGUAGE],
    maxLength,
}: LocalizedTextInputProps): React.JSX.Element => {
    const { t } = useTranslation('common');
    const [activeTab, setActiveTab] = useState<LanguageTag>(DEFAULT_LANGUAGE);

    const handleChange = (lang: LanguageTag, text: string) => {
        onChange({ ...value, [lang]: text });
    };

    const isRequired = (lang: LanguageTag) => requiredLanguages.includes(lang);

    const hasContent = (lang: LanguageTag) => Boolean(value[lang] && value[lang]!.trim().length > 0);

    const inputClasses =
        'w-full rounded-xs border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white';

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {label}
                {isRequired(DEFAULT_LANGUAGE) && <span className="ml-1 text-red-500">*</span>}
            </label>

            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700" role="tablist" aria-label={label}>
                {SUPPORTED_LANGUAGES.map(lang => {
                    const filled = hasContent(lang);
                    const required = isRequired(lang);
                    const missing = required && !filled;
                    const isActive = activeTab === lang;

                    return (
                        <button
                            key={lang}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`i18n-panel-${lang}`}
                            onClick={() => setActiveTab(lang)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                                isActive
                                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            <span>{t(`i18n.language.${lang}`, lang)}</span>
                            {filled && (
                                <span className="text-green-500" aria-label={t('i18n.filled', 'preenchido')}>
                                    ●
                                </span>
                            )}
                            {missing && (
                                <span className="text-red-500" aria-label={t('i18n.missing', 'faltando')}>
                                    ●
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div id={`i18n-panel-${activeTab}`} role="tabpanel" aria-labelledby={`i18n-tab-${activeTab}`}>
                {multiline ? (
                    <textarea
                        value={value[activeTab] ?? ''}
                        onChange={e => handleChange(activeTab, e.target.value)}
                        placeholder={placeholder}
                        rows={rows}
                        maxLength={maxLength}
                        className={inputClasses}
                    />
                ) : (
                    <input
                        type="text"
                        value={value[activeTab] ?? ''}
                        onChange={e => handleChange(activeTab, e.target.value)}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        className={inputClasses}
                    />
                )}
            </div>
        </div>
    );
};

export default LocalizedTextInput;
