import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Icon from '@/shared/component/Icon';

const LANGUAGES = [
    { code: 'pt-BR', compactLabel: 'PT', name: 'Português', flag: '🇧🇷' },
    { code: 'en-US', compactLabel: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'es-ES', compactLabel: 'ES', name: 'Español', flag: '🇲🇽' },
] as const;

type LanguageSwitcherVariant = 'floating' | 'drawer';

interface LanguageSwitcherProps {
    variant: LanguageSwitcherVariant;
}

export default function LanguageSwitcher({ variant }: LanguageSwitcherProps) {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const blurTimeoutRef = useRef<number | null>(null);
    const resolvedLanguage = i18n.resolvedLanguage ?? i18n.language;
    const selectedIndex = Math.max(
        LANGUAGES.findIndex(language => language.code === resolvedLanguage),
        0,
    );
    const selectedLanguage = LANGUAGES[selectedIndex];

    useEffect(() => {
        if (!open || variant !== 'floating') return;

        const onPointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open, variant]);

    useEffect(
        () => () => {
            if (blurTimeoutRef.current !== null)
                window.clearTimeout(blurTimeoutRef.current);
        },
        [],
    );

    async function selectLanguage(code: (typeof LANGUAGES)[number]['code']) {
        if (blurTimeoutRef.current !== null)
            window.clearTimeout(blurTimeoutRef.current);

        await i18n.changeLanguage(code);
        setOpen(false);
        triggerRef.current?.focus();
    }

    function closeAfterFocusLeaves() {
        if (blurTimeoutRef.current !== null)
            window.clearTimeout(blurTimeoutRef.current);

        blurTimeoutRef.current = window.setTimeout(() => {
            if (!rootRef.current?.contains(document.activeElement))
                setOpen(false);
            blurTimeoutRef.current = null;
        }, 0);
    }

    function toggleMenu() {
        if (blurTimeoutRef.current !== null)
            window.clearTimeout(blurTimeoutRef.current);

        if (open) {
            setOpen(false);
            triggerRef.current?.focus();
            return;
        }

        setOpen(true);
    }

    if (variant === 'drawer') {
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

    return (
        <div
            ref={rootRef}
            className="relative block"
            onBlur={closeAfterFocusLeaves}
            onKeyDown={event => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    setOpen(false);
                    triggerRef.current?.focus();
                    return;
                }

                if (
                    !open ||
                    !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
                )
                    return;

                event.preventDefault();
                const currentIndex = optionRefs.current.findIndex(
                    option => option === document.activeElement,
                );
                const nextIndex =
                    currentIndex === -1
                        ? event.key === 'ArrowUp' || event.key === 'End'
                            ? LANGUAGES.length - 1
                            : 0
                        : event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? LANGUAGES.length - 1
                            : event.key === 'ArrowDown'
                              ? (currentIndex + 1) % LANGUAGES.length
                              : (currentIndex - 1 + LANGUAGES.length) %
                                LANGUAGES.length;
                optionRefs.current[nextIndex]?.focus();
            }}
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
