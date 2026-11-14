import { useTranslation } from 'react-i18next';

export const LANGUAGES = [
    { code: 'pt-BR', compactLabel: 'PT', name: 'Português', flag: '🇧🇷' },
    { code: 'en-US', compactLabel: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'es-ES', compactLabel: 'ES', name: 'Español', flag: '🇲🇽' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export function LanguageDrawerSwitcher() {
    const { t, i18n } = useTranslation();
    const resolvedLanguage = i18n.resolvedLanguage ?? i18n.language;

    async function selectLanguage(code: LanguageCode) {
        await i18n.changeLanguage(code);
    }

    return (
        <div
            role="group"
            aria-label={t('nav.language')}
            className="grid min-h-12 w-full grid-cols-1 gap-1 rounded-xl border border-border-strong bg-surface-muted p-1 min-[360px]:grid-cols-2"
        >
            {LANGUAGES.map(({ code, name, flag }) => {
                const active = resolvedLanguage === code;

                return (
                    <button
                        type="button"
                        key={code}
                        onClick={() => {
                            void selectLanguage(code);
                        }}
                        aria-label={t('nav.selectLanguage', {
                            language: name,
                        })}
                        aria-pressed={active}
                        className={`inline-flex min-h-10 min-w-0 cursor-pointer items-center justify-center gap-[5px] rounded-lg border-0 px-1 text-[0.6875rem] font-extrabold tracking-[0.06em] transition-[color,background-color,scale] duration-[180ms] last:min-[360px]:col-span-2 active:scale-[0.97] ${active ? 'bg-accent text-on-accent hover:text-on-accent' : 'bg-transparent text-copy-muted hover:bg-surface-hover hover:text-fg'}`}
                    >
                        <span
                            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface-elevated"
                            aria-hidden="true"
                        >
                            <span
                                className="text-[0.875rem] leading-none tracking-normal saturate-90"
                                aria-hidden="true"
                            >
                                {flag}
                            </span>
                        </span>
                        <span className="tracking-[0.01em]">{name}</span>
                    </button>
                );
            })}
        </div>
    );
}

export default LanguageDrawerSwitcher;
