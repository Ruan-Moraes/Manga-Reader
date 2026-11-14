import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BrandWordmark from '@/shared/component/BrandWordmark';
import Button from '@/shared/component/Button';
import Icon from '@/shared/component/Icon';
import { useScrolled } from '@/shared/hook/useScrolled';
import { goToSection } from '@/shared/util/smoothScroll';
import { MobileDrawer } from './header/MobileDrawer';
import { NavLinks } from './header/NavLinks';

const DRAWER_ID = 'mobile-navigation';

export default function Header() {
    const { t } = useTranslation();
    const scrolled = useScrolled(24);
    const [open, setOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    const closeDrawer = useCallback((restoreFocus = true) => {
        setOpen(false);

        if (restoreFocus) {
            menuButtonRef.current?.focus();
        }
    }, []);

    function onNav(id: string) {
        setOpen(false);
        goToSection(id);
    }

    return (
        <>
            <header
                className={`fixed inset-x-0 top-0 z-50 transform-gpu border-b border-transparent bg-primary-90 backdrop-blur-[10px] transition-[background-color,border-color,box-shadow] duration-[180ms] ${
                    scrolled
                        ? 'border-border shadow-[0_8px_24px_rgb(0_0_0_/_18%)]'
                        : ''
                }`}
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
                        <NavLinks variant="desktop" onNav={onNav} />
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

            <MobileDrawer
                open={open}
                onClose={() => closeDrawer(true)}
                onNav={onNav}
                drawerId={DRAWER_ID}
            />
        </>
    );
}
