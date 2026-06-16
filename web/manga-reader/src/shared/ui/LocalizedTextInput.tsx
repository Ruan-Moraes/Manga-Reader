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
        'w-full rounded-mr-xs border border-mr-tertiary bg-mr-primary px-3 py-2 text-mr-body text-mr-fg placeholder:text-mr-tertiary transition-colors hover:border-mr-accent-50 focus:border-mr-accent focus:outline-none';

    return (
        <div className="flex flex-col gap-2">
            <label className="text-mr-small font-mr-bold text-mr-fg-muted">
                {label}
                {isRequired(DEFAULT_LANGUAGE) && <span className="ml-1 text-mr-danger">*</span>}
            </label>

            <div className="flex gap-1 border-b border-mr-border-subtle" role="tablist" aria-label={label}>
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
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-mr-tiny font-mr-bold transition-colors ${
                                isActive ? 'border-b-2 border-mr-accent text-mr-accent' : 'text-mr-fg-subtle hover:text-mr-fg'
                            }`}
                        >
                            <span>{t(`i18n.language.${lang}`, lang)}</span>
                            {filled && (
                                <span className="text-mr-accent" aria-label={t('i18n.filled', 'preenchido')}>
                                    ●
                                </span>
                            )}
                            {missing && (
                                <span className="text-mr-danger" aria-label={t('i18n.missing', 'faltando')}>
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
                        className={`${inputClasses} resize-y leading-relaxed`}
                    />
                ) : (
                    <input
                        type="text"
                        value={value[activeTab] ?? ''}
                        onChange={e => handleChange(activeTab, e.target.value)}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        className={`${inputClasses} h-[42px]`}
                    />
                )}
            </div>
        </div>
    );
};

export default LocalizedTextInput;
