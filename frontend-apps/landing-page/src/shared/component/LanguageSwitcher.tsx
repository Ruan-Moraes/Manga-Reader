import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'pt-BR', label: 'PT', flag: '🇧🇷' },
    { code: 'en-US', label: 'EN', flag: '🇺🇸' },
    { code: 'es-ES', label: 'ES', flag: '🇪🇸' },
] as const;

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    return (
        <div className="flex items-center gap-1">
            {LANGUAGES.map(({ code, label, flag }) => (
                <button
                    key={code}
                    onClick={() => i18n.changeLanguage(code)}
                    className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                        currentLang === code
                            ? 'bg-accent text-primary'
                            : 'text-tertiary hover:text-white'
                    }`}
                    aria-label={`Switch language to ${label}`}
                >
                    {flag} {label}
                </button>
            ))}
        </div>
    );
}
