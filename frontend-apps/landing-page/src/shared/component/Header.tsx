import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import LanguageSwitcher from '@/shared/component/LanguageSwitcher';

const NAV_LINKS = [
    { href: '#benefits', key: 'nav.benefits' },
    { href: '#plans', key: 'nav.plans' },
    { href: '#faq', key: 'nav.faq' },
] as const;

export default function Header() {
    const { t } = useTranslation();

    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-secondary bg-primary-90 backdrop-blur-sm">
            <nav className="flex items-center justify-between max-w-6xl px-4 py-3 mx-auto">
                <span className="text-xl font-extrabold text-accent">
                    Manga Reader
                </span>

                <div className="items-center hidden gap-6 text-sm sm:flex text-tertiary">
                    {NAV_LINKS.map(link => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="transition-colors hover:text-white"
                        >
                            {t(link.key)}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                    <a
                        href="#plans"
                        className="hidden px-4 py-2 text-sm font-bold transition-colors rounded-lg sm:inline-block bg-accent text-primary hover:bg-accent-hover"
                    >
                        {t('nav.cta')}
                    </a>
                    <button
                        onClick={() => setMenuOpen(prev => !prev)}
                        className="sm:hidden flex flex-col gap-1.5 p-1"
                        aria-label={t('nav.menu_toggle')}
                        aria-expanded={menuOpen}
                    >
                        <span
                            className={`block h-0.5 w-5 bg-white transition-transform duration-200 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}
                        />
                        <span
                            className={`block h-0.5 w-5 bg-white transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`}
                        />
                        <span
                            className={`block h-0.5 w-5 bg-white transition-transform duration-200 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}
                        />
                    </button>
                </div>
            </nav>

            {menuOpen && (
                <>
                    <div
                        className="fixed inset-0 top-[57px] bg-black/50 sm:hidden z-40"
                        onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute left-0 right-0 z-50 border-b top-full bg-primary border-secondary sm:hidden">
                        <div className="flex flex-col gap-4 px-4 py-4">
                            {NAV_LINKS.map(link => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="text-sm transition-colors text-tertiary hover:text-white"
                                >
                                    {t(link.key)}
                                </a>
                            ))}
                            <a
                                href="#plans"
                                onClick={() => setMenuOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-center transition-colors rounded-lg bg-accent text-primary hover:bg-accent-hover"
                            >
                                {t('nav.cta')}
                            </a>
                        </div>
                    </div>
                </>
            )}
        </header>
    );
}
