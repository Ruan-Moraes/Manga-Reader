import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'pt-BR', label: 'PT' },
    { code: 'en-US', label: 'EN' },
    { code: 'es-ES', label: 'ES' },
] as const;

interface LanguageSwitcherProps {
    block?: boolean;
}

export default function LanguageSwitcher({ block = false }: LanguageSwitcherProps) {
    const { t, i18n } = useTranslation();

    const currentLang = i18n.language;

    return (
        <div
            role="group"
            aria-label={t('nav.language')}
            className={`inline-flex gap-0.5 rounded-full border border-[#444] bg-white/5 p-[3px] ${
                block ? 'w-full' : 'w-auto'
            }`}
        >
            {LANGUAGES.map(({ code, label }) => {
                const active = currentLang === code;

                return (
                    <button
                        key={code}
                        onClick={() => i18n.changeLanguage(code)}
                        aria-pressed={active}
                        className={`h-[30px] min-w-[38px] cursor-pointer rounded-full px-3 text-xs font-extrabold tracking-wider transition-colors ${
                            block ? 'flex-1' : 'flex-none'
                        } ${active ? 'bg-accent text-primary' : 'text-tertiary hover:text-white'}`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
