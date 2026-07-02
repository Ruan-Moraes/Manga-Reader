import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Icon from '@/shared/component/Icon';
import LanguageSwitcher from '@/shared/component/LanguageSwitcher';
import { Wordmark } from '@/shared/component/Primitives';

import { goToSection } from '@/shared/util/smoothScroll';

const NAV_IDS = ['benefits', 'demo', 'plans', 'app', 'faq'] as const;

export default function Header() {
    const { t } = useTranslation();

    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    function onNav(id: string) {
        setOpen(false);
        goToSection(id);
    }

    const ctaClass =
        'inline-flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xs border border-accent bg-accent px-[18px] text-sm font-extrabold tracking-wider text-primary transition-colors hover:bg-accent-hover';

    return (
        <>
            <header
                className="fixed inset-x-0 top-0 z-[100] transition-all duration-300"
                style={{
                    background: scrolled ? 'rgba(22,22,22,0.78)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(14px)' : 'none',
                    WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
                    borderBottom: `1px solid ${scrolled ? '#2d2d2d' : 'transparent'}`,
                }}
            >
                <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5">
                    <a
                        href="#top"
                        onClick={e => {
                            e.preventDefault();
                            onNav('top');
                        }}
                        className="no-underline"
                    >
                        <Wordmark size={19} />
                    </a>

                    <nav className="lp-nav-desktop hidden items-center gap-7">
                        {NAV_IDS.map(id => (
                            <a
                                key={id}
                                href={`#${id}`}
                                onClick={e => {
                                    e.preventDefault();
                                    onNav(id);
                                }}
                                className="text-sm font-semibold tracking-wider text-[#cccccc] no-underline transition-colors hover:text-accent"
                            >
                                {t(`nav.${id}`)}
                            </a>
                        ))}
                    </nav>

                    <div className="lp-actions-desktop hidden items-center gap-3.5">
                        <LanguageSwitcher />
                        <button onClick={() => onNav('plans')} className={ctaClass}>
                            {t('cta.subscribe')}
                        </button>
                    </div>

                    <button
                        className="lp-burger inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xs border border-[#444] bg-transparent text-white"
                        aria-label={t('nav.menu')}
                        aria-expanded={open}
                        onClick={() => setOpen(o => !o)}
                    >
                        <Icon name={open ? 'close' : 'menu'} size={22} />
                    </button>
                </div>
            </header>

            {/* drawer mobile */}
            <div
                className="fixed inset-0 z-[99] transition-opacity duration-300"
                onClick={() => setOpen(false)}
                style={{
                    background: 'rgba(22,22,22,0.75)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                }}
            >
                <div
                    onClick={e => e.stopPropagation()}
                    className="absolute inset-y-0 right-0 flex w-[min(86vw,340px)] flex-col gap-2 overflow-y-auto border-l border-[#2d2d2d] bg-primary px-6 pb-7 pt-20 transition-transform duration-300"
                    style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
                >
                    {NAV_IDS.map(id => (
                        <a
                            key={id}
                            href={`#${id}`}
                            onClick={e => {
                                e.preventDefault();
                                onNav(id);
                            }}
                            className="border-b border-[#2d2d2d] py-3 text-lg font-bold tracking-wider text-white no-underline"
                        >
                            {t(`nav.${id}`)}
                        </a>
                    ))}
                    <div className="mt-[18px] max-w-[210px]">
                        <LanguageSwitcher block />
                    </div>
                    <button onClick={() => onNav('plans')} className={`${ctaClass} mt-3.5 h-12 w-full`}>
                        {t('cta.subscribe')}
                    </button>
                </div>
            </div>
        </>
    );
}
