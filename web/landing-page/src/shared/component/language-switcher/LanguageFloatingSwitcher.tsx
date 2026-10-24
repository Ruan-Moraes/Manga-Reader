import { useTranslation } from 'react-i18next';

import Icon from '@/shared/component/Icon';
import { useDropdownMenu } from '@/shared/hook/useDropdownMenu';
import { LANGUAGES, type LanguageCode } from './LanguageDrawerSwitcher';

export function LanguageFloatingSwitcher() {
    const { t, i18n } = useTranslation();
    const resolvedLanguage = i18n.resolvedLanguage ?? i18n.language;
    const selectedIndex = Math.max(
        LANGUAGES.findIndex(language => language.code === resolvedLanguage),
        0,
    );
    const selectedLanguage = LANGUAGES[selectedIndex];

    const {
        open,
        toggleMenu,
        closeMenu,
        rootRef,
        triggerRef,
        optionRefs,
        handleKeyDown,
        closeAfterFocusLeaves,
    } = useDropdownMenu({
        itemCount: LANGUAGES.length,
        enabled: true,
    });

    async function selectLanguage(code: LanguageCode) {
        closeMenu(true);
        await i18n.changeLanguage(code);
    }

    return (
        <div
            ref={rootRef}
            className="relative block"
            onBlur={closeAfterFocusLeaves}
            onKeyDown={handleKeyDown}
        >
            <button
                ref={triggerRef}
                type="button"
                className={`relative inline-flex h-[52px] w-[78px] cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-[14px] border border-accent-border/40 bg-floating py-0 pr-[7px] pl-[7px] text-fg shadow-[var(--shadow-floating)] backdrop-blur-[14px] transition-[border-color,background-color,translate,scale,box-shadow] duration-[180ms] before:absolute before:left-0 before:h-6 before:w-[3px] before:rounded-r-full before:bg-accent before:opacity-80 hover:-translate-x-[3px] hover:border-accent-border hover:bg-floating-hover active:-translate-x-px active:scale-[0.98] ${open ? '-translate-x-[3px] border-accent-border bg-floating-hover' : ''}`}
                aria-label={t('nav.changeLanguage', {
                    language: selectedLanguage.name,
                })}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={toggleMenu}
            >
                <span
                    className="inline-flex size-[27px] shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted"
                    aria-hidden="true"
                >
                    <span
                        className="text-base leading-none tracking-normal saturate-90"
                        aria-hidden="true"
                    >
                        {selectedLanguage.flag}
                    </span>
                </span>
                <span className="text-[0.6875rem] font-black tracking-[0.06em]">
                    {selectedLanguage.compactLabel}
                </span>
                <span
                    className="inline-flex size-[19px] shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted"
                    aria-hidden="true"
                >
                    <Icon
                        name="chevronD"
                        size={11}
                        stroke={2.6}
                        className={`opacity-80 transition-[opacity,rotate] duration-[180ms] ${open ? 'rotate-180 opacity-100' : ''}`}
                    />
                </span>
            </button>

            {open ? (
                <div
                    className="absolute top-1/2 right-[calc(100%+10px)] grid w-[208px] -translate-y-1/2 gap-1 rounded-[14px] border border-border-strong bg-floating p-2 shadow-[var(--shadow-menu)] backdrop-blur-[18px] animate-language-menu-in"
                    role="menu"
                    aria-label={t('nav.language')}
                >
                    {LANGUAGES.map(({ code, name, flag }, index) => {
                        const active = resolvedLanguage === code;

                        return (
                            <button
                                ref={element => {
                                    optionRefs.current[index] = element;
                                }}
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                key={code}
                                onClick={() => {
                                    void selectLanguage(code);
                                }}
                                className={`relative grid min-h-12 w-full cursor-pointer grid-cols-[30px_minmax(0,1fr)_24px] items-center gap-[9px] rounded-[10px] border px-3 text-left text-[0.875rem] font-extrabold transition-[border-color,background-color,color] duration-150 ${active ? 'border-accent-border/50 bg-accent-subtle text-accent-fg before:absolute before:left-0 before:h-6 before:w-[3px] before:rounded-r-full before:bg-accent' : 'border-transparent bg-transparent text-copy hover:bg-surface-hover hover:text-fg'}`}
                            >
                                <span
                                    className="inline-flex size-[27px] shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted"
                                    aria-hidden="true"
                                >
                                    <span
                                        className="text-base leading-none tracking-normal saturate-90"
                                        aria-hidden="true"
                                    >
                                        {flag}
                                    </span>
                                </span>
                                <span>{name}</span>
                                <span
                                    className={`inline-flex size-[22px] items-center justify-center rounded-full text-center text-[0.6875rem] text-on-accent ${active ? 'bg-accent opacity-100' : 'opacity-0'}`}
                                    aria-hidden="true"
                                >
                                    ✓
                                </span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}

export default LanguageFloatingSwitcher;
