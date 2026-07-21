import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BrandWordmark from '@/shared/component/BrandWordmark';
import Button from '@/shared/component/Button';
import Icon from '@/shared/component/Icon';
import LanguageSwitcher from '@/shared/component/LanguageSwitcher';
import ThemeSwitcher from '@/shared/component/ThemeSwitcher';
import { goToSection } from '@/shared/util/smoothScroll';

const NAV_IDS = ['benefits', 'demo', 'plans', 'app', 'faq'] as const;
const DRAWER_ID = 'mobile-navigation';

export default function Header() {
    const { t } = useTranslation();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);

    const closeDrawer = useCallback((restoreFocus = true) => {
        setOpen(false);

        if (restoreFocus) {
            menuButtonRef.current?.focus();
        }
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!open) return;

        const drawer = drawerRef.current;
        const focusable = drawer?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        document.body.style.overflow = 'hidden';
        focusable?.[0]?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeDrawer();
                return;
            }

            if (event.key !== 'Tab' || !focusable?.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [closeDrawer, open]);

    function onNav(id: string) {
        setOpen(false);
        goToSection(id);
    }

    return (
        <>
            <header
                className={`fixed inset-x-0 top-0 z-50 border-b border-transparent bg-primary-90 backdrop-blur-[10px] transition-[background-color,border-color,box-shadow] duration-[180ms] ${scrolled ? 'border-border shadow-[0_8px_24px_rgb(0_0_0_/_18%)]' : ''}`}
            >
                <div className="mx-auto flex min-h-20 w-full max-w-[1240px] items-center justify-between gap-4 px-[clamp(20px,4vw,32px)]">
                    <a
                        href="#top"
                        className="inline-flex min-h-11 cursor-pointer items-center rounded-lg px-1 no-underline transition-[background-color,scale] duration-[180ms] hover:bg-surface-hover active:scale-[0.98]"
                        onClick={event => {
                            event.preventDefault();
                            onNav('top');
                        }}
                    >
                        <BrandWordmark size="sm" />
                    </a>

                    <nav
                        className="hidden items-center gap-2 min-[940px]:flex"
                        aria-label={t('nav.primary')}
                    >
                        {NAV_IDS.map(id => (
                            <a
                                key={id}
                                href={`#${id}`}
                                className="cursor-pointer rounded-lg px-3 py-2 text-[0.8125rem] font-extrabold tracking-[0.03em] text-copy no-underline transition-[color,background-color] duration-[180ms] hover:bg-surface-hover hover:text-accent-fg"
                                onClick={event => {
                                    event.preventDefault();
                                    onNav(id);
                                }}
                            >
                                {t(`nav.${id}`)}
                            </a>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-3 min-[940px]:flex">
                        <Button size="sm" onClick={() => onNav('plans')}>
                            {t('cta.subscribe')}
                        </Button>
                    </div>

                    <button
                        ref={menuButtonRef}
                        type="button"
                        className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-fg transition-[border-color,background-color,color,scale] duration-[180ms] hover:border-accent-border hover:bg-accent-subtle hover:text-accent-fg active:scale-[0.97] min-[940px]:hidden"
                        aria-label={open ? t('nav.closeMenu') : t('nav.menu')}
                        aria-controls={DRAWER_ID}
                        aria-expanded={open}
                        onClick={() =>
                            open ? closeDrawer(false) : setOpen(true)
                        }
                    >
                        <Icon name={open ? 'close' : 'menu'} size={22} />
                    </button>
                </div>
            </header>

            {open ? (
                <div
                    className="fixed inset-0 z-[70] bg-overlay"
                    onMouseDown={() => closeDrawer()}
                >
                    <div
                        ref={drawerRef}
                        id={DRAWER_ID}
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('nav.mobile')}
                        className="ml-auto flex min-h-full w-[min(88vw,360px)] flex-col gap-5 border-l border-border bg-secondary p-6 shadow-[-18px_0_40px_rgb(0_0_0_/_35%)]"
                        onMouseDown={event => event.stopPropagation()}
                    >
                        <div className="grid">
                            {NAV_IDS.map(id => (
                                <a
                                    key={id}
                                    href={`#${id}`}
                                    className="cursor-pointer border-b border-border py-4 text-[1.05rem] font-extrabold tracking-[0.03em] text-copy no-underline transition-colors hover:text-accent-fg"
                                    onClick={event => {
                                        event.preventDefault();
                                        onNav(id);
                                    }}
                                >
                                    {t(`nav.${id}`)}
                                </a>
                            ))}
                        </div>
                        <LanguageSwitcher variant="drawer" />
                        <ThemeSwitcher variant="drawer" />
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={() => onNav('plans')}
                        >
                            {t('cta.subscribe')}
                        </Button>
                    </div>
                </div>
            ) : null}
        </>
    );
}
